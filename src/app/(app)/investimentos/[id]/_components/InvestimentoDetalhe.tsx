"use client";

import { useState } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Link from "next/link";
import ProgressBar from "@/components/ui/ProgressBar";
import InvestimentoModal from "../../_components/InvestimentoModal";
import TransacaoModal from "./TransacaoModal";
import SnapshotModal from "./SnapshotModal";
import GraficoEvolucao from "./GraficoEvolucao";
import type { Investment, InvestmentTransaction, InvestmentSnapshot } from "../../_components/types";
import ProjecaoView from "./ProjecaoView";
import {
  INVESTMENT_TYPE_LABELS,
  formatCurrency,
  calcTotalAportado,
  calcSaldoAtual,
  calcRentabilidadeReais,
  calcRentabilidadePct,
} from "../../_components/types";

interface ProjectItemRef {
  id: string;
  name: string;
  actual_amount: number | null;
  budget_amount?: number | null;
  expected_payment_date?: string | null;
  status: string;
  payment_type?: string | null;
  deposit_amount?: number | null;
  remainder_date?: string | null;
  deposit_transaction_id?: string | null;
}

interface Props {
  investment: Investment;
  transactions: InvestmentTransaction[];
  snapshots: InvestmentSnapshot[];
  projectItems: ProjectItemRef[];
}

type Modal =
  | { type: "none" }
  | { type: "edit" }
  | { type: "aporte" }
  | { type: "resgate" }
  | { type: "snapshot" };

export default function InvestimentoDetalhe({
  investment: initialInvestment,
  transactions: initialTxs,
  snapshots: initialSnaps,
  projectItems,
}: Props) {
  const [investment, setInvestment] = useState<Investment>(initialInvestment);
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>(initialTxs);
  const [snapshots, setSnapshots] = useState<InvestmentSnapshot[]>(initialSnaps);
  const [modal, setModal] = useState<Modal>({ type: "none" });
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const totalAportado = calcTotalAportado(transactions);
  const saldoAtual = calcSaldoAtual(snapshots, transactions);
  const rentReais = calcRentabilidadeReais(snapshots, transactions);
  const rentPct = calcRentabilidadePct(snapshots, transactions);
  const goalPct =
    saldoAtual != null && investment.goal_amount
      ? (saldoAtual / investment.goal_amount) * 100
      : null;
  async function reloadData() {
    const [txRes, snapRes] = await Promise.all([
      fetch(`/api/investimentos/${investment.id}/transacoes`).catch(() => null),
      fetch(`/api/investimentos/${investment.id}/snapshots`).catch(() => null),
    ]);
    // Reload via full page refresh to keep it simple and consistent
    window.location.reload();
  }

  function handleDeleteTx(txId: string) {
    setPendingDeleteId(txId);
  }

  async function doDeleteTx() {
    if (!pendingDeleteId) return;
    const res = await fetch(`/api/investimentos/transacoes/${pendingDeleteId}`, { method: "DELETE" });
    if (res.ok) {
      setTransactions((prev) => prev.filter((t) => t.id !== pendingDeleteId));
    }
    setPendingDeleteId(null);
  }

  const rentPositive = rentReais != null && rentReais >= 0;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link href="/investimentos" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-3 transition-colors">
          <ArrowLeft size={14} />
          Investimentos
        </Link>

        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{investment.name}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-medium">
                {INVESTMENT_TYPE_LABELS[investment.type]}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                {investment.scope === "family" ? "Familiar" : "Pessoal"}
              </span>
              {!investment.is_active && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 font-medium">
                  Arquivado
                </span>
              )}
            </div>
            {investment.description && (
              <p className="text-sm text-gray-500 mt-1">{investment.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setModal({ type: "edit" })}
            className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Editar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Total Aportado</p>
          <p className="text-base font-bold text-gray-900">{formatCurrency(totalAportado)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Saldo Atual</p>
          <p className="text-base font-bold text-gray-900">
            {saldoAtual != null ? formatCurrency(saldoAtual) : "—"}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 mb-1">Rentabilidade</p>
          {rentReais != null ? (
            <div className="flex items-center gap-1.5">
              {rentReais > 0 ? (
                <TrendingUp size={14} className="text-green-600 shrink-0" />
              ) : rentReais < 0 ? (
                <TrendingDown size={14} className="text-red-500 shrink-0" />
              ) : (
                <Minus size={14} className="text-gray-400 shrink-0" />
              )}
              <p className={`text-base font-bold ${rentPositive ? "text-green-700" : "text-red-600"}`}>
                {rentPositive ? "+" : ""}{formatCurrency(rentReais)}
              </p>
              {rentPct != null && (
                <span className={`text-xs font-medium ${rentPositive ? "text-green-600" : "text-red-500"}`}>
                  ({rentPct.toFixed(1)}%)
                </span>
              )}
            </div>
          ) : (
            <p className="text-base font-bold text-gray-400">—</p>
          )}
        </div>
      </div>

      {/* Goal progress */}
      {goalPct != null && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Meta</span>
            <span className="text-gray-500">
              {formatCurrency(saldoAtual!)} / {formatCurrency(investment.goal_amount!)} ({goalPct.toFixed(1)}%)
            </span>
          </div>
          <ProgressBar value={goalPct} />
        </div>
      )}

      {/* Action buttons */}
      {investment.is_active && (
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setModal({ type: "aporte" })}
            className="px-3 py-1.5 text-sm font-medium text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
          >
            + Registrar Aporte
          </button>
          <button
            type="button"
            onClick={() => setModal({ type: "resgate" })}
            className="px-3 py-1.5 text-sm font-medium text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
          >
            − Registrar Resgate
          </button>
          <button
            type="button"
            onClick={() => setModal({ type: "snapshot" })}
            className="px-3 py-1.5 text-sm font-medium text-brand-700 border border-brand-300 rounded-lg hover:bg-brand-50 transition-colors"
          >
            Atualizar Saldo
          </button>
        </div>
      )}

      {/* Evolução */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Evolução do Saldo</h2>
        <GraficoEvolucao snapshots={snapshots} />
      </div>

      {/* Movimentações */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Movimentações</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Nenhuma movimentação registrada.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${tx.type === "deposit" ? "bg-green-500" : "bg-orange-400"}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {tx.type === "deposit" ? "Aporte" : "Resgate"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(tx.date + "T12:00:00").toLocaleDateString("pt-BR")}
                      {tx.auto_generated && " · Automático"}
                      {tx.notes && ` · ${tx.notes}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${tx.type === "deposit" ? "text-green-700" : "text-orange-600"}`}>
                    {tx.type === "deposit" ? "+" : "−"}{formatCurrency(tx.amount)}
                  </span>
                  {!tx.auto_generated && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTx(tx.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Projeção de Saldo */}
      <ProjecaoView
        saldoAtual={saldoAtual ?? 0}
        monthlyContributionAmount={investment.monthly_contribution_amount}
        monthlyContributionDay={investment.monthly_contribution_day}
        investmentTransactions={transactions}
        projectItems={projectItems}
      />

      {/* Modals */}
      {modal.type === "edit" && (
        <InvestimentoModal
          investment={investment}
          onClose={() => setModal({ type: "none" })}
          onSaved={(saved) => { setInvestment(saved); setModal({ type: "none" }); }}
        />
      )}

      {modal.type === "aporte" && (
        <TransacaoModal
          investmentId={investment.id}
          investmentName={investment.name}
          defaultType="deposit"
          onClose={() => setModal({ type: "none" })}
          onSaved={reloadData}
        />
      )}

      {modal.type === "resgate" && (
        <TransacaoModal
          investmentId={investment.id}
          investmentName={investment.name}
          defaultType="withdrawal"
          onClose={() => setModal({ type: "none" })}
          onSaved={reloadData}
        />
      )}

      {modal.type === "snapshot" && (
        <SnapshotModal
          investmentId={investment.id}
          investmentName={investment.name}
          onClose={() => setModal({ type: "none" })}
          onSaved={reloadData}
        />
      )}

      <ConfirmModal
        isOpen={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={doDeleteTx}
        title="Excluir movimentação"
        description="Excluir esta movimentação e a transação financeira vinculada? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
      />
    </div>
  );
}
