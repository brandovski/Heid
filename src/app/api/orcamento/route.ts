import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createOrcamentoSchema = z.object({
  reference_month: z.string().regex(/^\d{4}-\d{2}$/, "Mês inválido (YYYY-MM)"),
  category_id: z.string().uuid("Categoria inválida"),
  planned_amount: z.coerce.number().positive("Valor planejado deve ser positivo"),
  notes: z.string().max(500).optional().nullable(),
  scope: z.enum(["personal", "family"]).default("family"),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.family_id) {
    return NextResponse.json({ error: "Family not configured" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = createOrcamentoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { reference_month, category_id, planned_amount, notes, scope } = parsed.data;
  const amount = planned_amount;
  const finalScope = scope;

  const { data, error } = await supabase
    .from("budgets")
    .insert({
      family_id: profile.family_id,
      reference_month,
      category_id,
      planned_amount: amount,
      notes: notes || null,
      scope: finalScope,
      user_id: finalScope === "personal" ? user.id : null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Categoria já possui orçamento neste mês" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
