"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Settings2,
  Users,
} from "lucide-react";
import ContribuicaoModal from "./ContribuicaoModal";
import {
  ViewType,
  FamilyMember,
  FamilyContribution,
  FamilyTransaction,
  SharedFixedIncome,
  SharedFixedExpense,
  SharedSubscription,
  SharedCreditCard,
  computeCaixaFamiliar,
  computeLastDay,
  formatCurrency,
  formatMonth,
  formatDate,
  shiftMonth,
} from "./types";

interface Props {
  currentMonth: string;
  view: ViewType;
  userId: string;
  members: FamilyMember[];
  contributions: FamilyContribution[];
  familyTransactions: FamilyTransaction[];
  sharedFixedIncomes: SharedFixedIncome[];
  sharedFixedExpenses: SharedFixedExpense[];
  sharedSubscriptions: SharedSubscription[];
  sharedCreditCards: SharedCreditCard[];
}

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  income: "Receita",
  fixed_income: "Receita fixa",
  expense: "Despesa",
  fixed_expense: "Despesa fixa",
  installment: "Parcela",
  subscription: "Assinatura",
};

const EXPENSE_TYPES = new Set([
  "expense",
  "fixed_expense",
  "installment",
  "subscription",
]);

function StatusBadge({ status }: { status: string }) {
  if (status === "paid")
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
        Pago
      </span>
    );
  if (status === "pending")
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
        A pagar
      </span>
    );
  return null;
}

function SharedSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SharedItemCard({
  icon,
  title,
  subtitle,
  amount,
  amountColor,
  badge,
}: {
  icon: string;
  title: string;
  subtitle: string;
  amount: number;
  amountColor: string;
  badge?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-lg shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <p className={`text-sm font-semibold ${amountColor}`}>
          {formatCurrency(amount)}
        </p>
        {badge && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-yellow-50 text-yellow-700">
            {badge}
          </span>
        )}
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
          Somente leitura
        </span>
      </div>
    </div>
  );
}

export default function FamiliaView({
  currentMonth,
  view,
  userId,
  members,
  contributions,
  familyTransactions,
  sharedFixedIncomes,
  sharedFixedExpenses,
  sharedSubscriptions,
  sharedCreditCards,
}: Props) {
  const router = useRouter();
  const [isContribuicaoOpen, setIsContribuicaoOpen] = useState(false);

  const lastDay = computeLastDay(currentMonth);
  const { activeContribs, totalContribuicoes, totalGasto, totalReceita, saldoLivre } =
    computeCaixaFamiliar(contributions, members, familyTransactions, lastDay);

  const partner = members.find((m) => m.id !== userId) ?? null;
  const myContribution = activeContribs.get(userId) ?? null;

  const hasSharedItems =
    sharedFixedIncomes.length > 0 ||
    sharedFixedExpenses.length > 0 ||
    sharedSubscriptions.length > 0 ||
    sharedCreditCards.length > 0;

  function navigate(delta: number) {
    router.push(
      `/familia?mes=${shiftMonth(currentMonth, delta)}&view=${view}`
    );
  }

  function setView(v: ViewType) {
    router.push(`/familia?mes=${currentMonth}&view=${v}`);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900">Família</h1>

        {/* Toggle */}
        <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 text-sm">
          <button
            onClick={() => view !== "familiar" && setView("familiar")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              view === "familiar"
                ? "bg-blue-600 text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Familiar
          </button>
          <button
            onClick={() => view !== "pessoal" && setView("pessoal")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              view === "pessoal"
                ? "bg-blue-600 text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Pessoal
          </button>
        </div>
      </div>

      {/* Month navigation — only in familiar view */}
      {view === "familiar" && (
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
      )}

      {view === "familiar" ? (
        <>
          {/* Caixa Familiar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Caixa Familiar
            </h2>

            {/* Contributions per member */}
            <div className="grid grid-cols-2 gap-3">
              {members.map((member) => {
                const contrib = activeContribs.get(member.id) ?? null;
                const isMe = member.id === userId;
                return (
                  <div
                    key={member.id}
                    className="bg-gray-50 rounded-xl p-3.5 flex flex-col gap-1.5"
                  >
                    <p className="text-xs text-gray-500 truncate">
                      {member.full_name ?? "Usuário"}
                    </p>
                    <p className="text-base font-bold text-gray-900">
                      {contrib ? formatCurrency(contrib.amount) : "—"}
                    </p>
                    {!contrib && (
                      <p className="text-[10px] text-amber-500">
                        Não configurado
                      </p>
                    )}
                    {isMe && (
                      <button
                        onClick={() => setIsContribuicaoOpen(true)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors mt-0.5 w-fit"
                      >
                        <Settings2 size={11} />
                        {contrib ? "Alterar" : "Configurar"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
              {[
                {
                  label: "Total contribuído",
                  value: totalContribuicoes,
                  color: "text-blue-600",
                },
                {
                  label: "Gastos familiares",
                  value: totalGasto,
                  color: "text-red-500",
                },
                {
                  label: "Saldo livre",
                  value: saldoLivre,
                  color: saldoLivre < 0 ? "text-red-600" : "text-green-600",
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
                  <p className={`text-sm font-bold ${color}`}>
                    {formatCurrency(value)}
                  </p>
                </div>
              ))}
            </div>

            {totalReceita > 0 && (
              <p className="text-xs text-gray-400 text-center">
                Inclui{" "}
                <span className="text-green-600 font-medium">
                  {formatCurrency(totalReceita)}
                </span>{" "}
                em receitas familiares
              </p>
            )}
          </div>

          {/* Family transactions */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">
              Transações familiares
              {familyTransactions.length > 0 && (
                <span className="ml-2 text-xs font-normal text-gray-400">
                  ({familyTransactions.length})
                </span>
              )}
            </h2>

            {familyTransactions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <Users className="mx-auto mb-3 text-gray-300" size={32} />
                <p className="text-sm text-gray-500">
                  Nenhuma transação familiar em{" "}
                  <span className="font-medium capitalize">
                    {formatMonth(currentMonth)}
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Crie transações com escopo "Familiar" em Transações
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {familyTransactions.map((tx) => {
                  const isExpense = EXPENSE_TYPES.has(tx.type);
                  return (
                    <div
                      key={tx.id}
                      className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-lg shrink-0">
                          {tx.category?.icon ?? (isExpense ? "💸" : "💰")}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {tx.description}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(tx.date)} ·{" "}
                            {TRANSACTION_TYPE_LABELS[tx.type] ?? tx.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <p
                          className={`text-sm font-semibold ${
                            isExpense ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {isExpense ? "-" : "+"}
                          {formatCurrency(tx.amount)}
                        </p>
                        <StatusBadge status={tx.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Pessoal view — items shared by partner */
        <div className="space-y-5">
          {!hasSharedItems ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
              <Users className="mx-auto mb-3 text-gray-300" size={32} />
              <p className="text-sm text-gray-500">
                {partner
                  ? `${partner.full_name ?? "Seu parceiro"} não compartilhou nenhum item`
                  : "Nenhum item compartilhado"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Itens compartilhados aparecem em Fixas, Assinaturas e Cartões
              </p>
            </div>
          ) : (
            <>
              {partner && (
                <p className="text-xs text-gray-500">
                  Itens compartilhados por{" "}
                  <span className="font-medium text-gray-700">
                    {partner.full_name ?? "Seu parceiro"}
                  </span>
                </p>
              )}

              {sharedFixedExpenses.length > 0 && (
                <SharedSection title="Despesas Fixas">
                  {sharedFixedExpenses.map((item) => (
                    <SharedItemCard
                      key={item.id}
                      icon={item.category?.icon ?? "💸"}
                      title={item.description}
                      subtitle={`Todo dia ${item.day_of_month} · ${item.category?.name ?? "Sem categoria"}`}
                      amount={item.amount}
                      amountColor="text-red-600"
                    />
                  ))}
                </SharedSection>
              )}

              {sharedFixedIncomes.length > 0 && (
                <SharedSection title="Receitas Fixas">
                  {sharedFixedIncomes.map((item) => (
                    <SharedItemCard
                      key={item.id}
                      icon={item.category?.icon ?? "💰"}
                      title={item.description}
                      subtitle={`Todo dia ${item.day_of_month} · ${item.category?.name ?? "Sem categoria"}`}
                      amount={item.amount}
                      amountColor="text-green-600"
                    />
                  ))}
                </SharedSection>
              )}

              {sharedSubscriptions.length > 0 && (
                <SharedSection title="Assinaturas">
                  {sharedSubscriptions.map((item) => (
                    <SharedItemCard
                      key={item.id}
                      icon={item.category?.icon ?? "🔄"}
                      title={item.name}
                      subtitle={
                        item.original_currency === "USD"
                          ? `US$ ${item.amount_original.toFixed(2)} · ${item.category?.name ?? ""}`
                          : (item.category?.name ?? "Sem categoria")
                      }
                      amount={item.amount_brl}
                      amountColor="text-red-600"
                      badge={
                        item.original_currency === "USD" ? "USD" : undefined
                      }
                    />
                  ))}
                </SharedSection>
              )}

              {sharedCreditCards.length > 0 && (
                <SharedSection title="Cartões de Crédito">
                  {sharedCreditCards.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-lg shrink-0">💳</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-400">{item.brand}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">
                        Somente leitura
                      </span>
                    </div>
                  ))}
                </SharedSection>
              )}
            </>
          )}
        </div>
      )}

      <ContribuicaoModal
        isOpen={isContribuicaoOpen}
        onClose={() => setIsContribuicaoOpen(false)}
        currentContribution={myContribution}
        currentMonth={currentMonth}
      />
    </div>
  );
}
