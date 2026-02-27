import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    project_group_id,
    project_id,
    name,
    description,
    budget_amount,
    payment_type,
    payment_origin,
    payment_user_id,
    payment_method,
    credit_card_id,
    installments_count,
    deposit_amount,
    remainder_date,
    category_id,
    notes,
  } = await req.json();

  if (!project_group_id || !project_id || !name?.trim()) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("project_items")
    .insert({
      project_group_id,
      project_id,
      name: name.trim(),
      description: description?.trim() ?? null,
      budget_amount: budget_amount != null ? parseFloat(budget_amount) : null,
      payment_type: payment_type ?? null,
      payment_origin: payment_origin ?? null,
      payment_user_id: payment_user_id ?? null,
      payment_method: payment_method ?? null,
      credit_card_id: credit_card_id ?? null,
      installments_count: installments_count ?? null,
      deposit_amount: deposit_amount != null ? parseFloat(deposit_amount) : null,
      remainder_date: remainder_date ?? null,
      category_id: category_id ?? null,
      notes: notes?.trim() ?? null,
      status: "considering",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
