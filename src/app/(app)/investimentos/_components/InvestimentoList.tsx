"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import InvestimentoCard from "./InvestimentoCard";
import InvestimentoModal from "./InvestimentoModal";
import type { Investment, InvestmentTransaction, InvestmentSnapshot } from "./types";

interface Props {
  investments: Investment[];
  transactions: InvestmentTransaction[];
  snapshots: InvestmentSnapshot[];
}

type Tab = "ativos" | "arquivados";

export default function InvestimentoList({ investments: initial, transactions, snapshots }: Props) {
  const [investments, setInvestments] = useState<Investment[]>(initial);
  const [tab, setTab] = useState<Tab>("ativos");
  const [modalInvestment, setModalInvestment] = useState<Investment | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);

  const ativos = investments.filter((i) => i.is_active);
  const arquivados = investments.filter((i) => !i.is_active);
  const displayed = tab === "ativos" ? ativos : arquivados;

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

      {/* Modal */}
      {modalOpen && (
        <InvestimentoModal
          investment={modalInvestment}
          onClose={() => setModalOpen(false)}
          onSaved={(saved) => { handleSaved(saved); setModalOpen(false); }}
        />
      )}
    </div>
  );
}
