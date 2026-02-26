import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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

  if (!profile?.family_id)
    return NextResponse.json({ error: "family_id ausente" }, { status: 400 });

  const body = await request.json();
  const { credit_card_id, reference_month, amount_paid, notes } = body;

  if (!credit_card_id || !reference_month || !amount_paid)
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });

  const { data, error } = await supabase
    .from("invoice_payments")
    .insert({
      family_id: profile.family_id,
      credit_card_id,
      reference_month,
      amount_paid: Number(amount_paid),
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505")
      return NextResponse.json({ error: "Fatura já registrada para este mês" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
