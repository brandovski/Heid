import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FluxoView from "./_components/FluxoView";
import type {
  ScopeFilter,
  PendingTx,
  InvestmentRow,
  InvestmentTxRow,
  ProjectItemRow,
  FixedIncomeRow,
  FixedExpenseRow,
  CreditCardRow,
} from "./_components/FluxoView";

export default async function FluxoPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; escopo?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.family_id) redirect("/dashboard");

  const resolvedParams = await searchParams;

  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const mes = resolvedParams.mes ?? currentMonth;
  const escopo = (resolvedParams.escopo === "partner" ? "partner" : "personal") as ScopeFilter;

  const [y, m] = mes.split("-").map(Number);
  const firstDay = `${mes}-01`;
  const lastDay = `${mes}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;

  // Query 1: transações pagas (saldo base)
  let paidQuery = supabase
    .from("transactions")
    .select("amount, type")
    .eq("status", "paid")
    .gte("date", firstDay)
    .lte("date", lastDay);

  // Query 2: transações pendentes (timeline principal)
  let pendingQuery = supabase
    .from("transactions")
    .select(
      "id, description, amount, date, type, scope, user_id, credit_card_id, fixed_income_id, fixed_expense_id, category:categories(name, icon, color)"
    )
    .eq("status", "pending")
    .gte("date", firstDay)
    .lte("date", lastDay)
    .order("date", { ascending: true });

  // Aplicar filtro de scope
  if (escopo === "personal") {
    paidQuery = paidQuery.eq("scope", "personal").eq("user_id", user.id);
    pendingQuery = pendingQuery.eq("scope", "personal").eq("user_id", user.id);
  } else {
    // "partner": transações pessoais compartilhadas do parceiro
    paidQuery = paidQuery.eq("scope", "personal").eq("is_shared", true).neq("user_id", user.id);
    pendingQuery = pendingQuery
      .eq("scope", "personal")
      .eq("is_shared", true)
      .neq("user_id", user.id);
  }

  const [
    { data: paidTxRaw },
    { data: pendingTxRaw },
    { data: investmentsRaw },
    { data: investmentTxRaw },
    { data: projectItemsRaw },
    { data: fixedIncomesRaw },
    { data: fixedExpensesRaw },
    { data: creditCardsRaw },
    { data: partnerProfileRaw },
  ] = await Promise.all([
    paidQuery,
    pendingQuery,
    // Query 3: investimentos ativos com aporte recorrente
    supabase
      .from("investments")
      .select("id, name, monthly_contribution_amount, monthly_contribution_day, scope, user_id")
      .eq("is_active", true)
      .not("monthly_contribution_amount", "is", null)
      .not("monthly_contribution_day", "is", null),
    // Query 4: investment_transactions auto_generated do mês (para deduplicação)
    supabase
      .from("investment_transactions")
      .select("investment_id, date")
      .eq("auto_generated", true)
      .gte("date", firstDay)
      .lte("date", lastDay),
    // Query 5: project_items confirmados com expected_payment_date no mês + projeto
    supabase
      .from("project_items")
      .select(
        "id, name, budget_amount, actual_amount, expected_payment_date, project:projects(id, name, scope, user_id)"
      )
      .eq("status", "confirmed")
      .not("expected_payment_date", "is", null)
      .gte("expected_payment_date", firstDay)
      .lte("expected_payment_date", lastDay),
    // Query 6: receitas fixas ativas (para projeção de não-geradas)
    (() => {
      let q = supabase
        .from("fixed_incomes")
        .select("id, description, amount, day_of_month")
        .eq("is_active", true)
        .eq("scope", "personal");
      if (escopo === "personal") return q.eq("user_id", user.id);
      return q.eq("is_shared", true).neq("user_id", user.id);
    })(),
    // Query 7: despesas fixas ativas (para projeção de não-geradas)
    (() => {
      let q = supabase
        .from("fixed_expenses")
        .select("id, description, amount, day_of_month, payment_method, credit_card_id")
        .eq("is_active", true)
        .eq("scope", "personal");
      if (escopo === "personal") return q.eq("user_id", user.id);
      return q.eq("is_shared", true).neq("user_id", user.id);
    })(),
    // Query 8: cartões de crédito ativos (para agrupamento de fatura)
    supabase
      .from("credit_cards")
      .select("id, name, due_day, color, scope, user_id")
      .eq("is_active", true),
    // Query 9: perfil do parceiro (para nome real na tab)
    supabase
      .from("profiles")
      .select("full_name")
      .eq("family_id", profile.family_id)
      .neq("id", user.id)
      .single(),
  ]);

  const myName = profile.full_name ?? "Eu";
  const partnerName = partnerProfileRaw?.full_name ?? "Parceiro";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 sm:pb-8">
      <FluxoView
        mes={mes}
        escopo={escopo}
        userId={user.id}
        myName={myName}
        partnerName={partnerName}
        paidTx={(paidTxRaw ?? []) as { amount: number; type: string }[]}
        pendingTx={(pendingTxRaw ?? []) as unknown as PendingTx[]}
        investments={(investmentsRaw ?? []) as unknown as InvestmentRow[]}
        investmentTx={(investmentTxRaw ?? []) as InvestmentTxRow[]}
        projectItems={(projectItemsRaw ?? []) as unknown as ProjectItemRow[]}
        fixedIncomes={(fixedIncomesRaw ?? []) as FixedIncomeRow[]}
        fixedExpenses={(fixedExpensesRaw ?? []) as unknown as FixedExpenseRow[]}
        creditCards={(creditCardsRaw ?? []) as unknown as CreditCardRow[]}
      />
    </div>
  );
}
