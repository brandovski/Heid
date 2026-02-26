import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();

  if (!profile?.family_id)
    return NextResponse.json(
      { error: "Perfil não encontrado" },
      { status: 400 }
    );

  const body = await request.json();
  const { amount, notes, mes } = body;

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
    return NextResponse.json({ error: "Valor inválido" }, { status: 400 });

  if (!mes || !/^\d{4}-\d{2}$/.test(mes))
    return NextResponse.json({ error: "Mês inválido" }, { status: 400 });

  const effectiveFrom = `${mes}-01`;

  // Verifica se já existe contribuição para este usuário+família+mês
  const { data: existing } = await supabase
    .from("family_contributions")
    .select("id")
    .eq("family_id", profile.family_id)
    .eq("user_id", user.id)
    .eq("effective_from", effectiveFrom)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("family_contributions")
      .update({ amount: Number(amount), notes: notes ?? null })
      .eq("id", existing.id);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from("family_contributions").insert({
      family_id: profile.family_id,
      user_id: user.id,
      amount: Number(amount),
      effective_from: effectiveFrom,
      notes: notes ?? null,
    });
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
