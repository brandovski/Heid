import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Special case: confirming item (status → confirmed with actual_amount)
  if (body.confirmar) {
    const { actual_amount, expected_payment_date, deposit_amount, remainder_date } = body;
    if (!actual_amount || parseFloat(actual_amount) <= 0) {
      return NextResponse.json({ error: "Valor real é obrigatório para confirmar" }, { status: 400 });
    }
    const updateFields: Record<string, unknown> = {
      status: "confirmed",
      actual_amount: parseFloat(actual_amount),
      expected_payment_date: expected_payment_date ?? null,
    };
    if (deposit_amount != null) updateFields.deposit_amount = parseFloat(deposit_amount);
    if (remainder_date !== undefined) updateFields.remainder_date = remainder_date ?? null;

    const { data, error } = await supabase
      .from("project_items")
      .update(updateFields)
      .eq("id", params.id)
      .eq("status", "considering")
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Item não encontrado ou já confirmado" }, { status: 404 });
    return NextResponse.json(data);
  }

  const {
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
    investment_id,
  } = body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name?.trim();
  if (description !== undefined) updates.description = description?.trim() ?? null;
  if (budget_amount !== undefined) updates.budget_amount = budget_amount != null ? parseFloat(budget_amount) : null;
  if (payment_type !== undefined) updates.payment_type = payment_type ?? null;
  if (payment_origin !== undefined) updates.payment_origin = payment_origin ?? null;
  if (payment_user_id !== undefined) updates.payment_user_id = payment_user_id ?? null;
  if (payment_method !== undefined) updates.payment_method = payment_method ?? null;
  if (credit_card_id !== undefined) updates.credit_card_id = credit_card_id ?? null;
  if (installments_count !== undefined) updates.installments_count = installments_count ?? null;
  if (deposit_amount !== undefined) updates.deposit_amount = deposit_amount != null ? parseFloat(deposit_amount) : null;
  if (remainder_date !== undefined) updates.remainder_date = remainder_date ?? null;
  if (category_id !== undefined) updates.category_id = category_id ?? null;
  if (notes !== undefined) updates.notes = notes?.trim() ?? null;
  if (investment_id !== undefined) updates.investment_id = investment_id ?? null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("project_items")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Soft-cancel: status → cancelled
  const { data, error } = await supabase
    .from("project_items")
    .update({ status: "cancelled" })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}
