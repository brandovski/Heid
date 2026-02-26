"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { ProgressBar } from "@tremor/react";
import GraficoEvolucao from "./GraficoEvolucao";
import GraficoCategoria from "./GraficoCategoria";
import FaturaModal from "./FaturaModal";
import {
  EscopoType,
  TransactionRow,
  HistoricalTxRow,
  BudgetRow,
  CreditCardRow,
  InvoicePaymentRow,
  UpcomingRow,
  computeSummary,
  computeMonthlyTotals,
  computeCategoryDistribution,
  computeBudgetStats,
  computeInvoiceCards,
  formatCurrency,
  formatMonth,
  formatDate,
  shiftMonth,
  last6Months,
} from "./types";

interface Props {
  currentMonth: string;
  escopo: EscopoType;
  userName: string;
  transactions: TransactionRow[];
  historicalTransactions: HistoricalTxRow[];
  budgets: BudgetRow[];
  creditCards: CreditCardRow[];
  invoicePayments: InvoicePaymentRow[];
  upcoming: UpcomingRow[];
}

export default function DashboardView({
  currentMonth,
  escopo,
  userName,
  transactions,
  historicalTransactions,
  budgets,
  creditCards,
  invoicePayments,
  upcoming,
}: Props) {
  const router = useRouter();
  const [selectedInvoice, setSelectedInvoice] = useState<{
    card: CreditCardRow;
    monthTotal: number;
  } | null>(null);

  // ── Cálculos ──────────────────────────────────────────────────────────────────
  const summary = computeSummary(transactions);
  const months = last6Months(currentMonth);
  const monthlyTotals = computeMonthlyTotals(historicalTransactions, months);
  const categoryDistribution = computeCategoryDistribution(transactions);
  const budgetsWithStats = computeBudgetStats(budgets, transactions);
  const invoiceCards = computeInvoiceCards(creditCards, transactions, invoicePayments);

  // ── Navegação ─────────────────────────────────────────────────────────────────
  function navigate(delta: number) {
    router.push(`/dashboard?mes=${shiftMonth(currentMonth, delta)}&escopo=${escopo}`);
  }

  function toggleEscopo() {
    const next: EscopoType = escopo === "family" ? "personal" : "family";
    router.push(`/dashboard?mes=${currentMonth}&escopo=${next}`);
  }

  // ── Cards de resumo ───────────────────────────────────────────────────────────
  const summaryCards = [
    { label: "Receitas", value: summary.income, color: "text-green-600" },
    { label: "Despesas", value: summary.expense, color: "text-red-600" },
    {
      label: "Saldo",
      value: summary.balance,
      color: summary.balance >= 0 ? "text-blue-600" : "text-red-600",
    },
    { label: "A receber", value: summary.pendingIncome, color: "text-amber-600" },
    { label: "A pagar", value: summary.pendingExpense, color: "text-orange-600" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Olá, {userName}</h1>
          <p className="text-sm text-gray-500 capitalize mt-0.5">
            {formatMonth(currentMonth)}
          </p>
        </div>
        {/* Toggle escopo */}
        <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 text-sm shrink-0">
          <button
            onClick={() => escopo !== "family" && toggleEscopo()}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              escopo === "family"
                ? "bg-blue-600 text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Familiar
          </button>
          <button
            onClick={() => escopo !== "personal" && toggleEscopo()}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              escopo === "personal"
                ? "bg-blue-600 text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Pessoal
          </button>
        </div>
      </div>

      {/* ── Navegação de mês ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-base font-semibold text-gray-800 capitalize">
          {formatMonth(currentMonth)}
        </span>
        <button
          onClick={() => navigate(1)}
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* ── Cards de Resumo ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {summaryCards.map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className={`text-sm font-bold ${color}`}>{formatCurrency(value)}</p>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Evolução — últimos 6 meses */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span className="text-xs text-gray-500">Receitas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-xs text-gray-500">Despesas</span>
            </div>
            <h2 className="text-sm font-semibold text-gray-700 ml-auto">
              Últimos 6 meses
            </h2>
          </div>
          <GraficoEvolucao data={monthlyTotals} />
        </div>

        {/* Despesas por categoria */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Despesas por categoria
          </h2>
          {categoryDistribution.length > 0 ? (
            <GraficoCategoria data={categoryDistribution} />
          ) : (
            <div className="h-44 flex items-center justify-center">
              <p className="text-sm text-gray-400">Nenhuma despesa registrada</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Orçamento ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Orçamento</h2>
          <Link
            href={`/orcamento?mes=${currentMonth}&escopo=${escopo}`}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Ver tudo <ExternalLink size={12} />
          </Link>
        </div>
        {budgetsWithStats.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-400 mb-3">
              Nenhum orçamento configurado para este mês
            </p>
            <Link
              href={`/orcamento?mes=${currentMonth}&escopo=${escopo}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Configurar orçamento →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {budgetsWithStats.slice(0, 5).map((b) => (
              <div key={b.id}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-700 font-medium">
                    {b.category?.icon && (
                      <span className="mr-1">{b.category.icon}</span>
                    )}
                    {b.category?.name ?? "Categoria"}
                  </span>
                  <span
                    className={
                      b.isOverBudget ? "text-red-600 font-semibold" : "text-gray-500"
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
              <p className="text-xs text-gray-400 text-center pt-1">
                +{budgetsWithStats.length - 5} categorias —{" "}
                <Link
                  href={`/orcamento?mes=${currentMonth}&escopo=${escopo}`}
                  className="text-blue-600 hover:text-blue-700"
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
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Faturas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {invoiceCards.map(({ card, monthTotal, payment }) => (
              <div
                key={card.id}
                className="bg-white rounded-xl border border-gray-100 p-4 space-y-3"
              >
                {/* Nome do cartão */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: card.color ?? "#6366f1" }}
                  />
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {card.name}
                  </span>
                </div>

                {/* Total do mês */}
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Total do mês</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(monthTotal)}
                  </p>
                </div>

                {/* Status de pagamento */}
                {payment ? (
                  <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                    <span className="font-medium">
                      ✓ Pago: {formatCurrency(payment.amount_paid)}
                    </span>
                    <span className="text-green-500 ml-auto">
                      {formatDate(payment.paid_at.split("T")[0])}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedInvoice({ card, monthTotal })}
                    className="w-full text-xs font-medium text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg py-2 px-3 transition-colors"
                  >
                    Registrar pagamento
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Próximos Lançamentos ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">
            Próximos lançamentos
          </h2>
          <Link
            href={`/transacoes?mes=${currentMonth}&escopo=${escopo}`}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Ver tudo <ExternalLink size={12} />
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Nenhum lançamento pendente
          </p>
        ) : (
          <div className="divide-y divide-gray-50">
            {upcoming.map((t) => {
              const isIncome = ["income", "fixed_income"].includes(t.type);
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-3 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {t.category?.icon && (
                      <span className="text-lg shrink-0">{t.category.icon}</span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {t.description}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(t.date)}</p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold shrink-0 ${
                      isIncome ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isIncome ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
    </div>
  );
}
