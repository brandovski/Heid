import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSystemCategoryId } from "@/lib/supabase/system-categories";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

  // Load investment to get scope/user_id
  const { data: investment, error: invError } = await supabase
    .from("investments")
    .select("*")
    .eq("id", params.id)
    .single();

  if (invError || !investment) {
    return NextResponse.json({ error: "Investimento não encontrado" }, { status: 404 });
  }

  const { type, amount, date, notes } = await req.json();

  if (!type || !["deposit", "withdrawal"].includes(type)) {
    return NextResponse.json({ error: "Tipo inválido (deposit ou withdrawal)" }, { status: 400 });
  }
  if (!amount || parseFloat(amount) <= 0) {
    return NextResponse.json({ error: "Valor deve ser maior que zero" }, { status: 400 });
  }
  if (!date) {
    return NextResponse.json({ error: "Data é obrigatória" }, { status: 400 });
  }

  const txType = type === "deposit" ? "investment_deposit" : "investment_withdrawal";
  const amountNum = parseFloat(amount);

  const systemCategoryId = await getSystemCategoryId(supabase, profile.family_id, "Investimento");

  // 1. Create financial transaction
  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .insert({
      family_id: profile.family_id,
      description: `${type === "deposit" ? "Aporte" : "Resgate"}: ${investment.name}`,
      amount: amountNum,
      date,
      type: txType,
      status: "paid",
      paid_at: new Date().toISOString(),
      category_id: systemCategoryId,
      scope: investment.scope,
      user_id: investment.user_id,
      is_shared: false,
      auto_generated: false,
      investment_id: params.id,
      notes: notes?.trim() ?? null,
    })
    .select()
    .single();

  if (txError) return NextResponse.json({ error: txError.message }, { status: 500 });

  // 2. Create investment transaction
  const { data: invTx, error: invTxError } = await supabase
    .from("investment_transactions")
    .insert({
      investment_id: params.id,
      family_id: profile.family_id,
      type,
      amount: amountNum,
      date,
      notes: notes?.trim() ?? null,
      transaction_id: tx.id,
      auto_generated: false,
    })
    .select()
    .single();

  if (invTxError) {
    await supabase.from("transactions").delete().eq("id", tx.id);
    return NextResponse.json({ error: invTxError.message }, { status: 500 });
  }

  return NextResponse.json(invTx, { status: 201 });
}
