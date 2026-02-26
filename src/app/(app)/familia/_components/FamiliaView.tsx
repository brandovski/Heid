"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Users } from "lucide-react";
import ContribuicaoModal from "./ContribuicaoModal";
import {
  FamilyMember,
  FamilyContribution,
  FamilyTransaction,
  computeCaixaFamiliar,
  formatCurrency,
  formatMonth,
  formatDate,
  shiftMonth,
} from "./types";

interface Props {
  currentMonth: string;
  userId: string;
  members: FamilyMember[];
  contributions: FamilyContribution[];
  familyTransactions: FamilyTransaction[];
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

export default function FamiliaView({
  currentMonth,
  userId,
  members,
  contributions,
  familyTransactions,
}: Props) {
  const router = useRouter();
  const [isContribuicaoOpen, setIsContribuicaoOpen] = useState(false);

  const { memberContribs, totalContribuicoes, totalGasto, totalReceita, saldoLivre } =
    computeCaixaFamiliar(contributions, members, familyTransactions);

  function navigate(delta: number) {
    router.push(`/familia?mes=${shiftMonth(currentMonth, delta)}`);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <h1 className="text-xl font-bold text-gray-900">Família</h1>

      {/* Month navigation */}
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

      {/* Caixa Familiar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Caixa Familiar
          </h2>
          <button
            onClick={() => setIsContribuicaoOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus size={13} />
            Registrar aporte
          </button>
        </div>

        {/* Contributions per member */}
        <div className="grid grid-cols-2 gap-3">
          {members.map((member) => {
            const total = memberContribs.get(member.id) ?? 0;
            const memberConts = contributions.filter(
              (c) => c.user_id === member.id
            );
            return (
              <div
                key={member.id}
                className="bg-gray-50 rounded-xl p-3.5 flex flex-col gap-1"
              >
                <p className="text-xs text-gray-500 truncate">
                  {member.full_name ?? "Usuário"}
                </p>
                <p className="text-base font-bold text-gray-900">
                  {total > 0 ? formatCurrency(total) : "—"}
                </p>
                {memberConts.length > 0 && (
                  <p className="text-[10px] text-gray-400">
                    {memberConts.length}{" "}
                    {memberConts.length === 1 ? "aporte" : "aportes"}
                  </p>
                )}
                {total === 0 && (
                  <p className="text-[10px] text-gray-400">Nenhum aporte</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
          {[
            {
              label: "Total aportado",
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

      <ContribuicaoModal
        isOpen={isContribuicaoOpen}
        onClose={() => setIsContribuicaoOpen(false)}
      />
    </div>
  );
}
