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

  // Busca todas as transações auto_generated já existentes no mês corrente
  // para pré-filtrar e evitar duplicatas (ON CONFLICT DO NOTHING não funciona
  // confiavelmente com índices parciais via Supabase JS).
  const { data: existing, error: existingErr } = await supabase
    .from("transactions")
    .select("fixed_income_id, fixed_expense_id, subscription_id")
    .eq("auto_generated", true)
    .gte("date", firstDay)
    .lte("date", lastDay);

  if (existingErr) {
    return NextResponse.json({ error: existingErr.message }, { status: 500 });
  }

  const existingIncomeIds = new Set(
    existing?.map((t) => t.fixed_income_id).filter(Boolean) ?? []
  );
  const existingExpenseIds = new Set(
    existing?.map((t) => t.fixed_expense_id).filter(Boolean) ?? []
  );
  const existingSubIds = new Set(
    existing?.map((t) => t.subscription_id).filter(Boolean) ?? []
  );

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
    const rows = incomes
      .filter((inc) => !existingIncomeIds.has(inc.id))
      .map((inc) => ({
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

    if (rows.length > 0) {
      const { error: insertErr } = await supabase
        .from("transactions")
        .insert(rows);

      if (insertErr) {
        errors.push(`fixed_incomes insert: ${insertErr.message}`);
      } else {
        totalIncomes = rows.length;
      }
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
    const rows = expenses
      .filter((exp) => !existingExpenseIds.has(exp.id))
      .map((exp) => ({
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

    if (rows.length > 0) {
      const { error: insertErr } = await supabase
        .from("transactions")
        .insert(rows);

      if (insertErr) {
        errors.push(`fixed_expenses insert: ${insertErr.message}`);
      } else {
        totalExpenses = rows.length;
      }
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
    const rows = subs
      .filter((sub) => !existingSubIds.has(sub.id))
      .map((sub) => {
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

    if (rows.length > 0) {
      const { error: insertErr } = await supabase
        .from("transactions")
        .insert(rows);

      if (insertErr) {
        errors.push(`subscriptions insert: ${insertErr.message}`);
      } else {
        totalSubscriptions = rows.length;
      }
    }
  }

  // ── Aportes automáticos de investimentos ───────────────────────────────────

  let totalInvestments = 0;

  // Pré-filtro: investment_transactions auto_generated já geradas no mês corrente
  const { data: existingInvTxs, error: existingInvErr } = await supabase
    .from("investment_transactions")
    .select("investment_id")
    .eq("auto_generated", true)
    .gte("date", firstDay)
    .lte("date", lastDay);

  if (existingInvErr) {
    errors.push(`investment_transactions fetch: ${existingInvErr.message}`);
  } else {
    const existingInvIds = new Set(
      existingInvTxs?.map((t) => t.investment_id).filter(Boolean) ?? []
    );

    const { data: investments, error: invErr } = await supabase
      .from("investments")
      .select("*")
      .eq("is_active", true)
      .not("monthly_contribution_amount", "is", null);

    if (invErr) {
      errors.push(`investments fetch: ${invErr.message}`);
    } else if (investments?.length) {
      const toProcess = investments.filter((inv) => !existingInvIds.has(inv.id));

      for (const inv of toProcess) {
        const txDate = dateStr(year, month, inv.monthly_contribution_day ?? 1);

        // Insert financial transaction
        const { data: tx, error: txErr } = await supabase
          .from("transactions")
          .insert({
            family_id: inv.family_id,
            description: `Aporte automático: ${inv.name}`,
            amount: inv.monthly_contribution_amount,
            date: txDate,
            type: "investment_deposit" as const,
            status: "paid" as const,
            paid_at: new Date().toISOString(),
            scope: inv.scope,
            user_id: inv.user_id,
            is_shared: false,
            auto_generated: true,
            investment_id: inv.id,
          })
          .select()
          .single();

        if (txErr) {
          errors.push(`investment tx insert (${inv.id}): ${txErr.message}`);
          continue;
        }

        // Insert investment_transaction
        const { error: invTxErr } = await supabase
          .from("investment_transactions")
          .insert({
            investment_id: inv.id,
            family_id: inv.family_id,
            type: "deposit" as const,
            amount: inv.monthly_contribution_amount,
            date: txDate,
            transaction_id: tx.id,
            auto_generated: true,
          });

        if (invTxErr) {
          errors.push(`investment_transaction insert (${inv.id}): ${invTxErr.message}`);
          // Rollback financial transaction
          await supabase.from("transactions").delete().eq("id", tx.id);
        } else {
          totalInvestments++;
        }
      }
    }
  }

  const status = errors.length > 0 ? 207 : 200;
  return NextResponse.json(
    {
      ok: errors.length === 0,
      month: `${year}-${String(month).padStart(2, "0")}`,
      generated: {
        fixed_incomes: totalIncomes,
        fixed_expenses: totalExpenses,
        subscriptions: totalSubscriptions,
        investments: totalInvestments,
      },
      errors,
    },
    { status }
  );
}
