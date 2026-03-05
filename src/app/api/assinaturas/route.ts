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
    billing_day,
    credit_card_id,
    category_id,
    start_date,
    notes,
    scope,
    is_shared,
    promotional_amount,
    promotional_months,
  } = await req.json();

  if (!name?.trim() || !amount_original || !billing_day || !credit_card_id || !start_date) {
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

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      family_id: profile.family_id,
      name: name.trim(),
      original_currency: currency,
      amount_original: parseFloat(amount_original),
      amount_brl: finalAmountBrl,
      billing_day: Number(billing_day),
      credit_card_id,
      category_id: category_id || null,
      start_date,
      is_active: true,
      notes: notes || null,
      scope: scope ?? "family",
      user_id: scope === "personal" ? user.id : null,
      is_shared: scope === "personal" ? (is_shared ?? false) : false,
      promotional_amount: promotional_amount ?? null,
      promotional_months: promotional_months ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
