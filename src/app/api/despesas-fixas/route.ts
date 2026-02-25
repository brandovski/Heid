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
    .select("family_id")
    .eq("id", user.id)
    .single();

  if (!profile?.family_id) {
    return NextResponse.json({ error: "Family not configured" }, { status: 400 });
  }

  const {
    description,
    amount,
    day_of_month,
    category_id,
    start_date,
    notes,
    scope,
    is_shared,
    payment_method,
    credit_card_id,
  } = await req.json();

  if (!description?.trim() || !amount || !day_of_month || !payment_method) {
    return NextResponse.json(
      { error: "Campos obrigatórios faltando" },
      { status: 400 }
    );
  }

  if (payment_method === "credit_card" && !credit_card_id) {
    return NextResponse.json(
      { error: "Cartão de crédito obrigatório" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("fixed_expenses")
    .insert({
      family_id: profile.family_id,
      description: description.trim(),
      amount,
      day_of_month,
      category_id: category_id ?? null,
      start_date: start_date ?? new Date().toISOString().split("T")[0],
      notes: notes ?? null,
      payment_method,
      credit_card_id: payment_method === "credit_card" ? credit_card_id : null,
      scope: scope ?? "family",
      user_id: scope === "personal" ? user.id : null,
      is_shared: scope === "personal" ? (is_shared ?? false) : false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
