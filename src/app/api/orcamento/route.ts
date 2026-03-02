import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const { reference_month, category_id, planned_amount, notes, scope, is_shared } =
    await req.json();

  if (!reference_month || !category_id || !planned_amount) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const amount = parseFloat(planned_amount);
  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
  }

  const finalScope = scope ?? "family";

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
