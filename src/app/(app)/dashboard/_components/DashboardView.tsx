"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, ExternalLink } from "lucide-react";
import ProgressBar from "@/components/ui/ProgressBar";
import MonthNavigator from "@/components/ui/MonthNavigator";
import InfoCard from "@/components/ui/InfoCard";
import ConfirmarAporteModal from "@/components/ui/ConfirmarAporteModal";
import GraficoEvolucao from "./GraficoEvolucao";
import GraficoCategoria from "./GraficoCategoria";
import FaturaModal from "./FaturaModal";
import FluxoWidget from "./FluxoWidget";
import {
  EscopoType,
  TransactionRow,
  HistoricalTxRow,
  BudgetRow,
  CreditCardRow,
  InvoicePaymentRow,
  InvestmentContributionRow,
  InvTransactionRow,
  AporteCardData,
  MonthlyTotal,
  computeSummary,
  computeMonthlyTotals,
  computeDailyTotals,
  computeCategoryDistribution,
  computeBudgetStats,
  computeInvoiceCards,
  computeAporteCards,
  formatCurrency,
  formatMonth,
  formatDate,
  shiftMonth,
  lastNMonths,
  lastNDays,
  daysInMonth,
} from "./types";
import { INVESTMENT_TYPE_LABELS } from "@/app/(app)/investimentos/_components/types";

interface Props {
  currentMonth: string;
  escopo: EscopoType;
  userName: string;
  partnerName: string;
  transactions: TransactionRow[];
  historicalTransactions: HistoricalTxRow[];
  budgets: BudgetRow[];
  creditCards: CreditCardRow[];
  invoicePayments: InvoicePaymentRow[];
  faturaTransacoes: TransactionRow[];
  investments: InvestmentContributionRow[];
  invTransactions: InvTransactionRow[];
  currentUserId: string;
}

export default function DashboardView({
  currentMonth,
  escopo,
  userName,
  partnerName,
  transactions,
  historicalTransactions,
  budgets,
  creditCards,
  invoicePayments,
  faturaTransacoes,
  investments,
  invTransactions,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [selectedInvoice, setSelectedInvoice] = useState<{
    card: CreditCardRow;
    monthTotal: number;
  } | null>(null);
  const [selectedAporte, setSelectedAporte] = useState<AporteCardData | null>(null);

  type ChartRange = "semana" | "mes" | "3m" | "6m" | "12m";
  const [chartRange, setChartRange] = useState<ChartRange>("6m");

  // ── Cálculos ──────────────────────────────────────────────────────────────────
  const summary = computeSummary(transactions);

  let chartData: MonthlyTotal[];
  switch (chartRange) {
    case "semana": chartData = computeDailyTotals(historicalTransactions, lastNDays(7)); break;
    case "mes":    chartData = computeDailyTotals(historicalTransactions, daysInMonth(currentMonth)); break;
    case "3m":     chartData = computeMonthlyTotals(historicalTransactions, lastNMonths(3, currentMonth)); break;
    case "12m":    chartData = computeMonthlyTotals(historicalTransactions, lastNMonths(12, currentMonth)); break;
    default:       chartData = computeMonthlyTotals(historicalTransactions, lastNMonths(6, currentMonth));
  }

  const categoryDistribution = computeCategoryDistribution(transactions);
  const budgetsWithStats = computeBudgetStats(budgets, transactions);
  const invoiceCards = computeInvoiceCards(creditCards, faturaTransacoes, invoicePayments, currentMonth);
  const aporteCards = computeAporteCards(investments, invTransactions, currentMonth, currentUserId);

  // ── Navegação ─────────────────────────────────────────────────────────────────
  function navigate(delta: number) {
    router.push(`/dashboard?mes=${shiftMonth(currentMonth, delta)}&escopo=${escopo === "parceiro" ? "parceiro" : "personal"}`);
  }

  function toggleEscopo() {
    const next: EscopoType = escopo === "personal" ? "parceiro" : "personal";
    router.push(`/dashboard?mes=${currentMonth}&escopo=${next}`);
  }

  // ── Controle de mês futuro ────────────────────────────────────────────────────
  const todayMonth = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[42px] leading-tight text-brand-700">
            Olá, {userName}
          </h1>
          <p className="font-serif text-[24px] text-brand-700/60 leading-snug">
            Vamos organizar as suas finanças.
          </p>
        </div>
        {/* Toggle escopo */}
        <div className="flex rounded-pill border border-brand p-0.5 text-[13px] shrink-0 mt-2 bg-accent-400/30">
          <button
            onClick={() => escopo !== "personal" && toggleEscopo()}
            className={`px-3 py-1.5 rounded-pill font-medium transition-colors duration-150 ${
              escopo === "personal"
                ? "bg-accent-200 text-brand-700"
                : "text-brand-700/50 hover:text-brand-700"
            }`}
          >
            {userName}
          </button>
          <button
            onClick={() => escopo !== "parceiro" && toggleEscopo()}
            className={`px-3 py-1.5 rounded-pill font-medium transition-colors duration-150 ${
              escopo === "parceiro"
                ? "bg-accent-200 text-brand-700"
                : "text-brand-700/50 hover:text-brand-700"
            }`}
          >
            {partnerName}
          </button>
        </div>
      </div>

      {/* ── Fluxo Widget (Próximas movimentações) ── */}
      <FluxoWidget
        transactions={transactions}
        invoiceCards={invoiceCards}
        currentMonth={currentMonth}
        escopo={escopo}
      />

      {/* ── Navegação de mês ── */}
      <div className="flex items-center justify-between">
        <MonthNavigator
          month={currentMonth}
          onPrev={() => navigate(-1)}
          onNext={() => navigate(1)}
          disableNext={currentMonth >= todayMonth}
        />
      </div>

      {/* ── Cards de Resumo ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-[10px]">
        <InfoCard label="Receitas" value={formatCurrency(summary.income)} colorVariant="income" />
        <InfoCard label="Despesas" value={formatCurrency(summary.expense)} colorVariant="expense" />
        <InfoCard label="A receber" value={formatCurrency(summary.pendingIncome)} />
        <InfoCard label="A pagar" value={formatCurrency(summary.pendingExpense)} colorVariant="expense" />
        <div className="col-span-2 sm:col-span-1">
          <InfoCard
            label="Saldo"
            value={formatCurrency(summary.balance)}
            highlighted
            colorVariant={summary.balance >= 0 ? "income" : "expense"}
          />
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-[10px]">

        {/* Evolução */}
        <div className="lg:col-span-3 bg-surface rounded-card border border-brand p-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-700" />
              <span className="text-xs text-brand-700/60">Receitas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-danger-700" />
              <span className="text-xs text-brand-700/60">Despesas</span>
            </div>
            <select
              value={chartRange}
              onChange={(e) => setChartRange(e.target.value as ChartRange)}
              className="text-xs font-medium text-brand-700/70 border-0 bg-transparent cursor-pointer focus:outline-none ml-auto"
            >
              <option value="semana">Essa semana</option>
              <option value="mes">Esse mês</option>
              <option value="3m">Últimos 3 meses</option>
              <option value="6m">Últimos 6 meses</option>
              <option value="12m">Últimos 12 meses</option>
            </select>
          </div>
          <GraficoEvolucao data={chartData} />
        </div>

        {/* Despesas por categoria */}
        <div className="lg:col-span-2 bg-surface rounded-card border border-brand p-5">
          <h2 className="text-[13px] font-medium text-brand-700 mb-4">
            Despesas por categoria
          </h2>
          {categoryDistribution.length > 0 ? (
            <GraficoCategoria data={categoryDistribution} />
          ) : (
            <div className="h-44 flex items-center justify-center">
              <p className="text-sm text-brand-700/40">Nenhuma despesa registrada</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Orçamento ── */}
      <div className="bg-surface rounded-card border border-brand p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[13px] font-medium text-brand-700">Orçamento</h2>
          <Link
            href={`/orcamento?mes=${currentMonth}`}
            className="text-xs text-brand-700/60 hover:text-brand-700 flex items-center gap-1 transition-colors"
          >
            Ver tudo <ExternalLink size={12} />
          </Link>
        </div>
        {budgetsWithStats.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-brand-700/40 mb-3">
              Nenhum orçamento configurado para este mês
            </p>
            <Link
              href={`/orcamento?mes=${currentMonth}`}
              className="text-sm font-medium text-brand-700 hover:text-brand-600 transition-colors"
            >
              Configurar orçamento →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {budgetsWithStats.slice(0, 5).map((b) => (
              <div key={b.id}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-brand-700 font-medium">
                    {b.category?.icon && (
                      <span className="mr-1">{b.category.icon}</span>
                    )}
                    {b.category?.name ?? "Categoria"}
                  </span>
                  <span
                    className={
                      b.isOverBudget ? "text-danger-700 font-semibold" : "text-brand-700/50"
                    }
                  >
                    {formatCurrency(b.spent + b.committed)} /{" "}
                    {formatCurrency(b.planned_amount)}
                  </span>
                </div>
                <ProgressBar
                  value={Math.min(b.percentage, 100)}
                  color={b.isOverBudget ? "red" : "blue"}
                />
              </div>
            ))}
            {budgetsWithStats.length > 5 && (
              <p className="text-xs text-brand-700/40 text-center pt-1">
                +{budgetsWithStats.length - 5} categorias —{" "}
                <Link
                  href={`/orcamento?mes=${currentMonth}`}
                  className="text-brand-700 hover:text-brand-600 transition-colors"
                >
                  ver tudo
                </Link>
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Faturas ── */}
      {invoiceCards.length > 0 && (
        <div className="bg-surface rounded-card border border-brand p-5">
          <h2 className="text-[13px] font-medium text-brand-700 mb-4">Faturas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[10px]">
            {invoiceCards.map(({ card, monthTotal, payment }) => {
              const [cy, cm] = currentMonth.split("-").map(Number);
              const dueDate = new Date(cy, cm - 1, card.due_day);
              const todayMidnight = new Date();
              todayMidnight.setHours(0, 0, 0, 0);
              const daysUntilDue = Math.ceil(
                (dueDate.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24)
              );

              let venceClass = "text-brand-700/40";
              let venceLabel = `Vence dia ${card.due_day}`;

              if (!payment) {
                if (daysUntilDue < 0) {
                  venceClass = "text-danger-700";
                  venceLabel = `Venceu dia ${card.due_day}`;
                } else if (daysUntilDue <= 3) {
                  venceClass = "text-amber-600";
                  venceLabel = `Vence em ${daysUntilDue}d`;
                }
              }

              return (
              <div
                key={card.id}
                className="bg-surface rounded-card border border-brand p-4 space-y-3"
              >
                {/* Nome do cartão */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: card.color ?? "#6366f1" }}
                  />
                  <span className="text-[13px] font-medium text-brand-700 truncate">
                    {card.name}
                  </span>
                </div>

                {/* Vencimento */}
                <div className={`flex items-center gap-1 text-xs ${venceClass}`}>
                  <Calendar size={11} />
                  <span>{venceLabel}</span>
                </div>

                {/* Total do mês */}
                <div>
                  <p className="text-[12px] text-brand-700/50 mb-0.5">Total do mês</p>
                  <p className="text-[18px] font-medium text-brand-700">
                    {formatCurrency(monthTotal)}
                  </p>
                </div>

                {/* Status de pagamento */}
                {payment ? (
                  <div className="flex items-center gap-1.5 text-xs text-brand-700 bg-income-icon rounded-card px-3 py-2">
                    <span className="font-medium">
                      ✓ Pago: {formatCurrency(payment.amount_paid)}
                    </span>
                    <span className="text-brand-700/50 ml-auto">
                      {formatDate(payment.paid_at.split("T")[0])}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedInvoice({ card, monthTotal })}
                    className="w-full text-xs font-medium text-brand-700 border border-brand rounded-card py-2 px-3 hover:bg-brand-700/5 transition-colors"
                  >
                    Registrar pagamento
                  </button>
                )}
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Aportes do Mês ── */}
      {aporteCards.length > 0 && (
        <div className="bg-surface rounded-card border border-brand p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-medium text-brand-700">Aportes do Mês</h2>
            <Link
              href="/investimentos"
              className="text-xs text-brand-700/60 hover:text-brand-700 flex items-center gap-1 transition-colors"
            >
              Ver todos <ExternalLink size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[10px]">
            {aporteCards.map((card) => (
              <AporteCard
                key={`${card.investment.id}`}
                card={card}
                onConfirm={() => setSelectedAporte(card)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Modal de fatura ── */}
      {selectedInvoice && (
        <FaturaModal
          isOpen
          onClose={() => setSelectedInvoice(null)}
          card={selectedInvoice.card}
          referenceMonth={currentMonth}
          defaultAmount={selectedInvoice.monthTotal}
        />
      )}

      {/* ── Modal de confirmação de aporte ── */}
      {selectedAporte && (
        <ConfirmarAporteModal
          isOpen
          onClose={() => setSelectedAporte(null)}
          onSaved={() => { setSelectedAporte(null); router.refresh(); }}
          investment={selectedAporte.investment}
          expectedAmount={selectedAporte.expectedAmount}
          scheduledDay={selectedAporte.scheduledDay}
          currentMonth={currentMonth}
        />
      )}
    </div>
  );
}

// ── AporteCard (inline) ────────────────────────────────────────────────────────

function AporteCard({ card, onConfirm }: { card: AporteCardData; onConfirm: () => void }) {
  const typeLabel = INVESTMENT_TYPE_LABELS[card.investment.type as keyof typeof INVESTMENT_TYPE_LABELS] ?? card.investment.type;

  return (
    <div className="bg-surface rounded-card border border-brand p-4 space-y-3">
      {/* Nome + tipo */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[13px] font-medium text-brand-700 truncate flex-1">{card.investment.name}</span>
        <span className="text-[11px] text-brand-700/50 bg-brand-700/5 border border-brand rounded-pill px-2 py-0.5 shrink-0">{typeLabel}</span>
      </div>

      {/* Dia programado */}
      <div className="flex items-center gap-1 text-xs text-brand-700/40">
        <Calendar size={11} />
        <span>Dia {card.scheduledDay} do mês</span>
      </div>

      {/* Valor esperado */}
      <div>
        <p className="text-[12px] text-brand-700/50 mb-0.5">Valor esperado</p>
        <p className="text-[18px] font-medium text-brand-700">{formatCurrency(card.expectedAmount)}</p>
      </div>

      {/* Status */}
      {card.confirmed ? (
        <div className="flex items-center gap-1.5 text-xs text-brand-700 bg-income-icon rounded-card px-3 py-2">
          <span className="font-medium">
            ✓ {formatCurrency(card.confirmedAmount!)}
          </span>
          {card.confirmedDate && (
            <span className="text-brand-700/50 ml-auto">
              {formatDate(card.confirmedDate)}
            </span>
          )}
        </div>
      ) : (
        <button
          onClick={onConfirm}
          className="w-full text-xs font-medium text-brand-700 border border-brand rounded-card py-2 px-3 hover:bg-brand-700/5 transition-colors"
        >
          Confirmar aporte
        </button>
      )}
    </div>
  );
}
