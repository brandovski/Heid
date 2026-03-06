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

  const {
    name,
    original_currency,
    amount_original,
    amount_brl,
    credit_card_id,
    category_id,
    start_date,
    notes,
    promotional_amount,
    promotional_months,
  } = await req.json();

  if (!name?.trim() || !amount_original || !credit_card_id || !start_date) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const currency = original_currency ?? "BRL";
  if (!["BRL", "USD"].includes(currency)) {
    return NextResponse.json({ error: "Moeda inválida" }, { status: 400 });
  }

  const finalAmountBrl =
    currency === "BRL" ? parseFloat(amount_original) : parseFloat(amount_brl);

  if (isNaN(finalAmountBrl) || finalAmountBrl <= 0) {
    return NextResponse.json(
      { error: "Valor em BRL inválido" },
      { status: 400 }
    );
  }

  const billing_day = parseInt(start_date.split("-")[2], 10);

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      family_id: profile.family_id,
      name: name.trim(),
      original_currency: currency,
      amount_original: parseFloat(amount_original),
      amount_brl: finalAmountBrl,
      billing_day,
      credit_card_id,
      category_id: category_id || null,
      start_date,
      is_active: true,
      notes: notes || null,
      scope: "personal",
      user_id: user.id,
      is_shared: false,
      promotional_amount: promotional_amount ?? null,
      promotional_months: promotional_months ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Generate first transaction immediately
  const [startYear, startMonth] = start_date.split("-").map(Number);
  const now = new Date();
  const monthsActive =
    now.getFullYear() * 12 + now.getMonth() + 1 - (startYear * 12 + startMonth);
  const isUsd = currency === "USD";
  const isInPromo =
    promotional_amount != null &&
    promotional_months != null &&
    monthsActive < Number(promotional_months);
  const effectiveAmount = isInPromo
    ? parseFloat(String(promotional_amount))
    : finalAmountBrl;
  const txDescription = isInPromo ? `${name.trim()} (Promo)` : name.trim();

  await supabase.from("transactions").insert({
    family_id: profile.family_id,
    description: txDescription,
    amount: effectiveAmount,
    date: start_date,
    type: "subscription",
    status: "pending",
    category_id: category_id || null,
    credit_card_id,
    subscription_id: data.id,
    auto_generated: true,
    exchange_rate: isUsd
      ? Math.round((finalAmountBrl / parseFloat(String(amount_original))) * 10000) / 10000
      : null,
    original_amount: isUsd ? parseFloat(String(amount_original)) : null,
    original_currency: isUsd ? "USD" : null,
    exchange_estimated: false,
    scope: "personal",
    user_id: user.id,
    installment_group_id: null,
    fixed_income_id: null,
    fixed_expense_id: null,
    paid_at: null,
    notes: null,
  });

  return NextResponse.json(data, { status: 201 });
}
