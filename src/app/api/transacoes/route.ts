import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createTransacaoSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória").max(200),
  amount: z.number().positive("Valor deve ser positivo"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD)"),
  type: z.enum(["income", "expense"], { message: "Tipo inválido para lançamento manual" }),
  category_id: z.string().uuid().optional().nullable(),
  credit_card_id: z.string().uuid().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  scope: z.enum(["personal", "family"]).default("personal"),
  status: z.enum(["pending", "paid"]).default("pending"),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("family_id, share_with_partner")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.family_id) {
    return NextResponse.json({ error: "Family not configured" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = createTransacaoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { description, amount, date, type, category_id, credit_card_id, notes, scope, status } = parsed.data;
  const resolvedStatus = status;
  const resolvedScope = scope;

  // Para transações pessoais, herdar preferência de compartilhamento do perfil
  const isShared =
    resolvedScope === "personal" ? (profile.share_with_partner ?? false) : false;

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      family_id: profile.family_id,
      description: description.trim(),
      amount,
      date,
      type,
      status: resolvedStatus,
      category_id: category_id ?? null,
      credit_card_id: credit_card_id ?? null,
      notes: notes ?? null,
      scope: resolvedScope,
      user_id: resolvedScope === "personal" ? user.id : null,
      is_shared: isShared,
      auto_generated: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
