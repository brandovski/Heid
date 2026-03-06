import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getFatureDateRange } from "@/lib/fatura-utils";

export async function POST(request: Request) {
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

  if (profileError || !profile?.family_id)
    return NextResponse.json({ error: "family_id ausente" }, { status: 400 });

  const body = await request.json();
  const { credit_card_id, reference_month, amount_paid, notes, paid_at } = body;

  if (!credit_card_id || !reference_month || !amount_paid)
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });

  // paid_at: usa a data enviada ou hoje
  const paidAtDate = paid_at ?? new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("invoice_payments")
    .insert({
      family_id: profile.family_id,
      credit_card_id,
      reference_month,
      amount_paid: Number(amount_paid),
      notes: notes?.trim() || null,
      paid_at: paidAtDate,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505")
      return NextResponse.json({ error: "Fatura já registrada para este mês" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Buscar closing_day do cartão para usar o ciclo de faturamento correto
  const { data: card } = await supabase
    .from("credit_cards")
    .select("closing_day")
    .eq("id", credit_card_id)
    .single();

  // Marca todas as transactions do ciclo de faturamento do cartão como pagas
  const { start: firstDay, end: lastDay } = getFatureDateRange(
    reference_month,
    card?.closing_day ?? 1
  );

  await supabase
    .from("transactions")
    .update({ status: "paid" })
    .eq("credit_card_id", credit_card_id)
    .gte("date", firstDay)
    .lte("date", lastDay)
    .neq("status", "cancelled");

  return NextResponse.json(data, { status: 201 });
}
