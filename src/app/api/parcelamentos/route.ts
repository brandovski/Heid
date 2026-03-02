import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function addMonths(dateStr: string, months: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const totalMonths = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;
  const lastDay = new Date(targetYear, targetMonth, 0).getDate();
  const targetDay = Math.min(day, lastDay);
  return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;
}

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
    total_amount,
    installments_count,
    first_installment_date,
    credit_card_id,
    category_id,
    notes,
    paid_installments = 0,
  } = await req.json();

  if (
    !description?.trim() ||
    !total_amount ||
    !installments_count ||
    !first_installment_date ||
    !credit_card_id
  ) {
    return NextResponse.json(
      { error: "Campos obrigatórios faltando" },
      { status: 400 }
    );
  }

  const count = Number(installments_count);
  if (count < 2 || count > 48) {
    return NextResponse.json(
      { error: "Número de parcelas deve ser entre 2 e 48" },
      { status: 400 }
    );
  }

  const paidCount = Number(paid_installments);
  if (paidCount < 0 || paidCount > count) {
    return NextResponse.json({ error: "paid_installments inválido" }, { status: 400 });
  }

  const { data: group, error: groupError } = await supabase
    .from("installment_groups")
    .insert({
      family_id: profile.family_id,
      description: description.trim(),
      total_amount: parseFloat(total_amount),
      installments_count: count,
      first_installment_date,
      credit_card_id,
      category_id: category_id || null,
      notes: notes || null,
      scope: "personal",
      user_id: user.id,
      is_shared: false,
    })
    .select()
    .single();

  if (groupError) {
    return NextResponse.json({ error: groupError.message }, { status: 500 });
  }

  // Distribute total across installments (remainder goes to last)
  const totalCents = Math.round(parseFloat(total_amount) * 100);
  const installmentCents = Math.floor(totalCents / count);
  const remainderCents = totalCents - installmentCents * count;

  const transactions = Array.from({ length: count }, (_, i) => {
    const isLast = i === count - 1;
    return {
      family_id: profile.family_id,
      description: `${description.trim()} (${i + 1}/${count})`,
      amount: (isLast ? installmentCents + remainderCents : installmentCents) / 100,
      date: addMonths(first_installment_date, i),
      type: "installment" as const,
      status: (i < paidCount ? "paid" : "pending") as "paid" | "pending",
      category_id: category_id || null,
      credit_card_id,
      installment_group_id: group.id,
      scope: "personal" as const,
      user_id: user.id,
      auto_generated: false,
    };
  });

  const { error: txError } = await supabase.from("transactions").insert(transactions);

  if (txError) {
    // Rollback the group if transaction insertion fails
    await supabase.from("installment_groups").delete().eq("id", group.id);
    return NextResponse.json({ error: txError.message }, { status: 500 });
  }

  return NextResponse.json(group, { status: 201 });
}
