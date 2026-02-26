import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// Retorna YYYY-MM-DD com clamping para o último dia do mês.
// month é 1-indexed (1–12).
function dateStr(year: number, month: number, day: number): string {
  const lastDay = new Date(year, month, 0).getDate();
  const d = Math.min(day, lastDay);
  return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed
  const firstDay = dateStr(year, month, 1);
  const lastDay = dateStr(year, month, 31); // clamp ao último dia real

  const errors: string[] = [];
  let totalIncomes = 0;
  let totalExpenses = 0;
  let totalSubscriptions = 0;

  // ── Receitas fixas ─────────────────────────────────────────────────────────

  const { data: incomes, error: incomesErr } = await supabase
    .from("fixed_incomes")
    .select("*")
    .eq("is_active", true)
    .lte("start_date", lastDay)
    .or(`end_date.is.null,end_date.gte.${firstDay}`);

  if (incomesErr) {
    errors.push(`fixed_incomes fetch: ${incomesErr.message}`);
  } else if (incomes?.length) {
    const rows = incomes.map((inc) => ({
      family_id: inc.family_id,
      description: inc.description,
      amount: inc.amount,
      date: dateStr(year, month, inc.day_of_month),
      type: "fixed_income" as const,
      status: "pending" as const,
      category_id: inc.category_id ?? null,
      credit_card_id: null,
      installment_group_id: null,
      subscription_id: null,
      fixed_income_id: inc.id,
      fixed_expense_id: null,
      exchange_rate: null,
      original_amount: null,
      original_currency: null,
      exchange_estimated: false,
      auto_generated: true,
      paid_at: null,
      notes: null,
      scope: inc.scope,
      user_id: inc.user_id ?? null,
    }));

    const { error: insertErr } = await supabase
      .from("transactions")
      .upsert(rows, { ignoreDuplicates: true });

    if (insertErr) {
      errors.push(`fixed_incomes insert: ${insertErr.message}`);
    } else {
      totalIncomes = rows.length;
    }
  }

  // ── Despesas fixas ─────────────────────────────────────────────────────────

  const { data: expenses, error: expensesErr } = await supabase
    .from("fixed_expenses")
    .select("*")
    .eq("is_active", true)
    .lte("start_date", lastDay)
    .or(`end_date.is.null,end_date.gte.${firstDay}`);

  if (expensesErr) {
    errors.push(`fixed_expenses fetch: ${expensesErr.message}`);
  } else if (expenses?.length) {
    const rows = expenses.map((exp) => ({
      family_id: exp.family_id,
      description: exp.description,
      amount: exp.amount,
      date: dateStr(year, month, exp.day_of_month),
      type: "fixed_expense" as const,
      status: "pending" as const,
      category_id: exp.category_id ?? null,
      credit_card_id: exp.credit_card_id ?? null,
      installment_group_id: null,
      subscription_id: null,
      fixed_income_id: null,
      fixed_expense_id: exp.id,
      exchange_rate: null,
      original_amount: null,
      original_currency: null,
      exchange_estimated: false,
      auto_generated: true,
      paid_at: null,
      notes: null,
      scope: exp.scope,
      user_id: exp.user_id ?? null,
    }));

    const { error: insertErr } = await supabase
      .from("transactions")
      .upsert(rows, { ignoreDuplicates: true });

    if (insertErr) {
      errors.push(`fixed_expenses insert: ${insertErr.message}`);
    } else {
      totalExpenses = rows.length;
    }
  }

  // ── Assinaturas ────────────────────────────────────────────────────────────

  const { data: subs, error: subsErr } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("is_active", true)
    .lte("start_date", lastDay);

  if (subsErr) {
    errors.push(`subscriptions fetch: ${subsErr.message}`);
  } else if (subs?.length) {
    const rows = subs.map((sub) => {
      const isUsd = sub.original_currency === "USD";
      return {
        family_id: sub.family_id,
        description: sub.name,
        amount: sub.amount_brl,
        date: dateStr(year, month, sub.billing_day),
        type: "subscription" as const,
        status: "pending" as const,
        category_id: sub.category_id ?? null,
        credit_card_id: sub.credit_card_id,
        installment_group_id: null,
        subscription_id: sub.id,
        fixed_income_id: null,
        fixed_expense_id: null,
        exchange_rate: isUsd
          ? Math.round((sub.amount_brl / sub.amount_original) * 10000) / 10000
          : null,
        original_amount: isUsd ? sub.amount_original : null,
        original_currency: isUsd ? "USD" : null,
        exchange_estimated: false,
        auto_generated: true,
        paid_at: null,
        notes: null,
        scope: sub.scope,
        user_id: sub.user_id ?? null,
      };
    });

    const { error: insertErr } = await supabase
      .from("transactions")
      .upsert(rows, { ignoreDuplicates: true });

    if (insertErr) {
      errors.push(`subscriptions insert: ${insertErr.message}`);
    } else {
      totalSubscriptions = rows.length;
    }
  }

  const status = errors.length > 0 ? 207 : 200;
  return NextResponse.json(
    {
      ok: errors.length === 0,
      month: `${year}-${String(month).padStart(2, "0")}`,
      attempted: {
        fixed_incomes: totalIncomes,
        fixed_expenses: totalExpenses,
        subscriptions: totalSubscriptions,
      },
      errors,
    },
    { status }
  );
}
