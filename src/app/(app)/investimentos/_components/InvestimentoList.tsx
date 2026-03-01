"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import InvestimentoCard from "./InvestimentoCard";
import InvestimentoModal from "./InvestimentoModal";
import ConfirmarAporteModal from "@/components/ui/ConfirmarAporteModal";
import { computeAporteCards, AporteCardData } from "@/lib/investment-utils";
import type { Investment, InvestmentTransaction, InvestmentSnapshot } from "./types";
import { formatCurrency } from "./types";

interface Props {
  investments: Investment[];
  transactions: InvestmentTransaction[];
  snapshots: InvestmentSnapshot[];
  userId: string;
  userName: string;
  partnerName: string;
}

type Tab = "ativos" | "arquivados";

export default function InvestimentoList({ investments: initial, transactions, snapshots, userId, userName, partnerName }: Props) {
  const router = useRouter();
  const [investments, setInvestments] = useState<Investment[]>(initial);
  const [tab, setTab] = useState<Tab>("ativos");
  const [modalInvestment, setModalInvestment] = useState<Investment | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [aporteToConfirm, setAporteToConfirm] = useState<AporteCardData | null>(null);

  const ativos = investments.filter((i) => i.is_active);
  const arquivados = investments.filter((i) => !i.is_active);
  const displayed = tab === "ativos" ? ativos : arquivados;

  // Compute pending aportes for this month
  const currentMonth = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();

  const aporteTransactions = transactions.filter(
    (tx) =>
      tx.date.startsWith(currentMonth) &&
      tx.auto_generated === false &&
      tx.type === "deposit"
  );

  const pendingAportes = computeAporteCards(
    ativos,
    aporteTransactions,
    currentMonth,
    userId
  ).filter((c) => !c.confirmed);

  function getTxs(investmentId: string) {
    return transactions.filter((t) => t.investment_id === investmentId);
  }

  function getSnaps(investmentId: string) {
    return snapshots.filter((s) => s.investment_id === investmentId);
  }

  function handleSaved(saved: Investment) {
    setInvestments((prev) => {
      const exists = prev.find((i) => i.id === saved.id);
      if (exists) return prev.map((i) => i.id === saved.id ? saved : i);
      return [...prev, saved];
    });
  }

  return (
    <div className="space-y-4">
      {/* Mobile full-width button */}
      <button
        type="button"
        onClick={() => { setModalInvestment(undefined); setModalOpen(true); }}
        className="sm:hidden w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
      >
        <Plus size={14} /> Novo Investimento
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(["ativos", "arquivados"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "ativos" ? `Ativos (${ativos.length})` : `Arquivados (${arquivados.length})`}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => { setModalInvestment(undefined); setModalOpen(true); }}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-100 transition-colors"
        >
          <Plus size={14} />
          Novo Investimento
        </button>
      </div>

      {/* Banner de aportes pendentes (aba Ativos) */}
      {tab === "ativos" && pendingAportes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800 mb-3">
            {pendingAportes.length} aporte{pendingAportes.length > 1 ? "s" : ""} pendente{pendingAportes.length > 1 ? "s" : ""} este mês
          </p>
          <div className="space-y-2">
            {pendingAportes.map((card) => (
              <div key={card.investment.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{card.investment.name}</p>
                  <p className="text-xs text-gray-500">
                    Dia {card.scheduledDay} — {formatCurrency(card.expectedAmount)}
                  </p>
                </div>
                <button
                  onClick={() => setAporteToConfirm(card)}
                  className="text-xs font-medium text-brand-600 border border-brand-200 bg-brand-50 hover:bg-brand-100 rounded-lg px-3 py-1.5 transition-colors"
                >
                  Confirmar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      {displayed.length === 0 ? (
        <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-sm">
            {tab === "ativos" ? "Nenhum investimento ativo." : "Nenhum investimento arquivado."}
          </p>
          {tab === "ativos" && (
            <button
              type="button"
              onClick={() => { setModalInvestment(undefined); setModalOpen(true); }}
              className="mt-2 text-sm text-brand-600 hover:underline"
            >
              Criar primeiro investimento
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((inv) => (
            <InvestimentoCard
              key={inv.id}
              investment={inv}
              transactions={getTxs(inv.id)}
              snapshots={getSnaps(inv.id)}
              onEdit={() => { setModalInvestment(inv); setModalOpen(true); }}
            />
          ))}
        </div>
      )}

      {/* Modal de criação/edição */}
      {modalOpen && (
        <InvestimentoModal
          investment={modalInvestment}
          onClose={() => setModalOpen(false)}
          onSaved={(saved) => { handleSaved(saved); setModalOpen(false); }}
          userName={userName}
          partnerName={partnerName}
        />
      )}

      {/* Modal de confirmação de aporte */}
      {aporteToConfirm && (
        <ConfirmarAporteModal
          isOpen
          onClose={() => setAporteToConfirm(null)}
          onSaved={() => { setAporteToConfirm(null); router.refresh(); }}
          investment={aporteToConfirm.investment}
          expectedAmount={aporteToConfirm.expectedAmount}
          scheduledDay={aporteToConfirm.scheduledDay}
          currentMonth={currentMonth}
        />
      )}
    </div>
  );
}
