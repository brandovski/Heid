import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createParcelamentoSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória").max(200),
  total_amount: z.coerce.number().positive("Valor total deve ser positivo"),
  installments_count: z.coerce.number().int().min(2, "Mínimo 2 parcelas").max(48, "Máximo 48 parcelas"),
  first_installment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD)"),
  credit_card_id: z.string().uuid("Cartão inválido"),
  category_id: z.string().uuid().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  paid_installments: z.coerce.number().int().min(0).default(0),
});

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

  const body = await req.json();
  const parsed = createParcelamentoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { description, total_amount, installments_count, first_installment_date, credit_card_id, category_id, notes, paid_installments } = parsed.data;
  const count = installments_count;
  const paidCount = paid_installments;

  if (paidCount > count) {
    return NextResponse.json({ error: "paid_installments não pode exceder o número de parcelas" }, { status: 400 });
  }

  const { data: group, error: groupError } = await supabase
    .from("installment_groups")
    .insert({
      family_id: profile.family_id,
      description: description.trim(),
      total_amount,
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
  const totalCents = Math.round(total_amount * 100);
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
