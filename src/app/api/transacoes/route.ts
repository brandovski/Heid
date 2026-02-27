import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id, share_with_partner")
    .eq("id", user.id)
    .single();

  if (!profile?.family_id) {
    return NextResponse.json({ error: "Family not configured" }, { status: 400 });
  }

  const {
    description,
    amount,
    date,
    type,
    category_id,
    credit_card_id,
    notes,
    scope,
  } = await req.json();

  if (!description?.trim() || !amount || !date || !type) {
    return NextResponse.json(
      { error: "Campos obrigatórios faltando" },
      { status: 400 }
    );
  }

  if (!["income", "expense"].includes(type)) {
    return NextResponse.json(
      { error: "Tipo inválido para lançamento manual" },
      { status: 400 }
    );
  }

  const resolvedScope = scope ?? "personal";

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
      status: "pending",
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
