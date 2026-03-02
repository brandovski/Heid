import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getSystemCategoryId } from "@/lib/supabase/system-categories";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.family_id)
    return NextResponse.json(
      { error: "Perfil não encontrado" },
      { status: 400 }
    );

  const body = await request.json();
  const { amount, date, notes } = body;

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
    return NextResponse.json({ error: "Valor inválido" }, { status: 400 });

  const dateToUse = date ?? new Date().toISOString().split("T")[0];

  const systemCategoryId = await getSystemCategoryId(supabase, profile.family_id, "Caixa Familiar");

  // 1. Cria despesa pessoal (dinheiro sai da conta do usuário)
  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .insert({
      family_id: profile.family_id,
      description: "Contribuição ao Caixa Familiar",
      amount: Number(amount),
      date: dateToUse,
      type: "expense",
      status: "paid",
      category_id: systemCategoryId,
      scope: "personal",
      user_id: user.id,
      auto_generated: false,
      paid_at: new Date().toISOString(),
      notes: notes ?? null,
    })
    .select("id")
    .single();

  if (txError)
    return NextResponse.json({ error: txError.message }, { status: 500 });

  // 2. Registra o aporte no Caixa Familiar vinculando à transação
  const { error: contribError } = await supabase
    .from("family_contributions")
    .insert({
      family_id: profile.family_id,
      user_id: user.id,
      amount: Number(amount),
      date: dateToUse,
      transaction_id: tx.id,
      notes: notes ?? null,
    });

  if (contribError) {
    // Rollback: remove a transação criada
    await supabase.from("transactions").delete().eq("id", tx.id);
    return NextResponse.json({ error: contribError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
