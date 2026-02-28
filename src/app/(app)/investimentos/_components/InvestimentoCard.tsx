"use client";

import Link from "next/link";
import ProgressBar from "@/components/ui/ProgressBar";
import type { Investment, InvestmentTransaction, InvestmentSnapshot } from "./types";
import {
  INVESTMENT_TYPE_LABELS,
  formatCurrency,
  calcTotalAportado,
  calcSaldoAtual,
  calcRentabilidadeReais,
  calcRentabilidadePct,
} from "./types";

interface Props {
  investment: Investment;
  transactions: InvestmentTransaction[];
  snapshots: InvestmentSnapshot[];
  onEdit: () => void;
}

export default function InvestimentoCard({ investment, transactions, snapshots, onEdit }: Props) {
  const totalAportado = calcTotalAportado(transactions);
  const saldoAtual = calcSaldoAtual(snapshots, transactions);
  const rentReais = calcRentabilidadeReais(snapshots, transactions);
  const rentPct = calcRentabilidadePct(snapshots, transactions);
  const goalPct = saldoAtual != null && investment.goal_amount
    ? (saldoAtual / investment.goal_amount) * 100
    : null;

  const rentPositive = rentReais != null && rentReais >= 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/investimentos/${investment.id}`} className="text-sm font-semibold text-gray-900 hover:text-brand-600 transition-colors">
              {investment.name}
            </Link>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-medium">
              {INVESTMENT_TYPE_LABELS[investment.type]}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
              {investment.scope === "family" ? "Familiar" : "Pessoal"}
            </span>
            {investment.is_eligible_for_projects && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                Projetos
              </span>
            )}
          </div>
          {investment.description && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{investment.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Editar
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Aportado</p>
          <p className="text-sm font-semibold text-gray-900">{formatCurrency(totalAportado)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Saldo Atual</p>
          <p className="text-sm font-semibold text-gray-900">
            {saldoAtual != null ? formatCurrency(saldoAtual) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Rentabilidade</p>
          {rentReais != null ? (
            <p className={`text-sm font-semibold ${rentPositive ? "text-green-700" : "text-red-600"}`}>
              {rentPositive ? "+" : ""}{formatCurrency(rentReais)}
              {rentPct != null && (
                <span className="text-xs font-medium ml-1">({rentPct.toFixed(1)}%)</span>
              )}
            </p>
          ) : (
            <p className="text-sm text-gray-400">—</p>
          )}
        </div>
      </div>

      {goalPct != null && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Meta: {formatCurrency(investment.goal_amount!)}</span>
            <span>{goalPct.toFixed(1)}%</span>
          </div>
          <ProgressBar value={goalPct} color={goalPct >= 100 ? "blue" : "blue"} />
        </div>
      )}
    </div>
  );
}
