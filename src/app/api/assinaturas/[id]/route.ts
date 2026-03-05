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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();
  if (profileError || !profile?.family_id)
    return NextResponse.json({ error: "Family not configured" }, { status: 400 });

  const {
    name,
    original_currency,
    amount_original,
    amount_brl,
    billing_day,
    credit_card_id,
    category_id,
    notes,
    promotional_amount,
    promotional_months,
  } = await req.json();

  const updates: Record<string, unknown> = {};

  if (name !== undefined) updates.name = name.trim();
  if (billing_day !== undefined) updates.billing_day = Number(billing_day);
  if (credit_card_id !== undefined) updates.credit_card_id = credit_card_id;
  if (category_id !== undefined) updates.category_id = category_id || null;
  if (notes !== undefined) updates.notes = notes || null;
  if (original_currency !== undefined) updates.original_currency = original_currency;
  if (amount_original !== undefined) updates.amount_original = parseFloat(amount_original);
  if (amount_brl !== undefined) updates.amount_brl = parseFloat(amount_brl);
  else if (original_currency === "BRL" && amount_original !== undefined) {
    updates.amount_brl = parseFloat(amount_original);
  }
  if (promotional_amount !== undefined) updates.promotional_amount = promotional_amount ?? null;
  if (promotional_months !== undefined) updates.promotional_months = promotional_months ?? null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .update(updates)
    .eq("id", params.id)
    .eq("family_id", profile.family_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();
  if (profileError || !profile?.family_id)
    return NextResponse.json({ error: "Family not configured" }, { status: 400 });

  const { data: sub, error: subError } = await supabase
    .from("subscriptions")
    .select("id, is_active")
    .eq("id", params.id)
    .eq("family_id", profile.family_id)
    .single();

  if (subError || !sub) {
    return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .update({ is_active: false, cancelled_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("family_id", profile.family_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
