import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardView from "./_components/DashboardView";
import {
  EscopoType,
  TransactionRow,
  HistoricalTxRow,
  BudgetRow,
  CreditCardRow,
  InvoicePaymentRow,
  InvestmentContributionRow,
  InvTransactionRow,
  shiftMonth,
} from "./_components/types";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { mes?: string; escopo?: string };
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

  // Sem family_id: exibe aviso sem tentar queries
  if (!profile?.family_id) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Olá, {profile?.full_name ?? user.email}
        </h1>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Configuração pendente:</strong> o <code>family_id</code> ainda não foi
            configurado neste perfil. Consulte o guia em <code>docs/setup.md</code>.
          </p>
        </div>
      </div>
    );
  }

  // ── Parâmetros ────────────────────────────────────────────────────────────────
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const mes = searchParams.mes ?? currentMonth;
  const escopo: EscopoType =
    searchParams.escopo === "parceiro" ? "parceiro" : "personal";

  const [y, m] = mes.split("-").map(Number);
  const firstDay = `${mes}-01`;
  const lastDay = `${mes}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;
  const twelveMonthsStart = `${shiftMonth(mes, -11)}-01`;

  // Buscar nome do parceiro
  const { data: partnerProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("family_id", profile.family_id)
    .neq("id", user.id)
    .single();

  const partnerName = partnerProfile?.full_name ?? "Parceiro";

  // ── Queries ───────────────────────────────────────────────────────────────────

  // Transações do mês
  let txCurrentQ = supabase
    .from("transactions")
    .select(
      "id, description, amount, date, type, status, scope, user_id, category_id, credit_card_id, category:categories(name, icon, color)"
    )
    .eq("family_id", profile.family_id)
    .gte("date", firstDay)
    .lte("date", lastDay)
    .order("date", { ascending: false });

  if (escopo === "personal") {
    txCurrentQ = txCurrentQ.eq("scope", "personal").eq("user_id", user.id);
  } else {
    // parceiro: transações pessoais compartilhadas do parceiro
    txCurrentQ = txCurrentQ
      .eq("scope", "personal")
      .eq("is_shared", true)
      .neq("user_id", user.id);
  }

  // Transações dos últimos 6 meses (para gráfico de evolução)
  let txHistoricalQ = supabase
    .from("transactions")
    .select("amount, date, type, status")
    .eq("family_id", profile.family_id)
    .gte("date", twelveMonthsStart)
    .lte("date", lastDay)
    .neq("status", "cancelled");

  if (escopo === "personal") {
    txHistoricalQ = txHistoricalQ.eq("scope", "personal").eq("user_id", user.id);
  } else {
    txHistoricalQ = txHistoricalQ
      .eq("scope", "personal")
      .eq("is_shared", true)
      .neq("user_id", user.id);
  }

  // Orçamentos do mês (sempre pessoal do usuário logado)
  const budgetsQ = supabase
    .from("budgets")
    .select("id, category_id, planned_amount, category:categories(name, icon, color)")
    .eq("family_id", profile.family_id)
    .eq("reference_month", mes)
    .eq("scope", "personal")
    .eq("user_id", user.id)
    .order("created_at");

  const [
    { data: transactions },
    { data: historicalTransactions },
    { data: budgets },
    { data: creditCards },
    { data: invoicePayments },
    { data: investments },
    { data: invTransactions },
  ] = await Promise.all([
    txCurrentQ,
    txHistoricalQ,
    budgetsQ,
    supabase
      .from("credit_cards")
      .select("id, name, color, due_day, scope, user_id, is_shared")
      .eq("family_id", profile.family_id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("invoice_payments")
      .select("id, credit_card_id, reference_month, amount_paid, paid_at, notes")
      .eq("family_id", profile.family_id)
      .eq("reference_month", mes),
    // Investimentos com aporte configurado (da família toda)
    supabase
      .from("investments")
      .select("id, name, type, user_id, scope, monthly_contribution_amount, monthly_contribution_day, partner_contribution_amount, partner_contribution_day")
      .eq("family_id", profile.family_id)
      .eq("is_active", true),
    // Investment transactions do mês (depósitos manuais para checar confirmações)
    supabase
      .from("investment_transactions")
      .select("id, investment_id, type, amount, date, contributor_user_id, auto_generated")
      .eq("family_id", profile.family_id)
      .gte("date", firstDay)
      .lte("date", lastDay)
      .eq("type", "deposit")
      .eq("auto_generated", false),
  ]);

  return (
    <DashboardView
      currentMonth={mes}
      escopo={escopo}
      userName={profile.full_name ?? user.email ?? ""}
      partnerName={partnerName}
      transactions={(transactions as unknown as TransactionRow[]) ?? []}
      historicalTransactions={(historicalTransactions as HistoricalTxRow[]) ?? []}
      budgets={(budgets as unknown as BudgetRow[]) ?? []}
      creditCards={(creditCards as CreditCardRow[]) ?? []}
      invoicePayments={(invoicePayments as InvoicePaymentRow[]) ?? []}
      investments={(investments as unknown as InvestmentContributionRow[]) ?? []}
      invTransactions={(invTransactions as unknown as InvTransactionRow[]) ?? []}
      currentUserId={user.id}
    />
  );
}
