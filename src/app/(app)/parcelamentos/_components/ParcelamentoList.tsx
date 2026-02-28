"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { Category, CreditCard } from "@/types/database";
import type { InstallmentGroupWithRelations } from "./types";
import { computeSummary, groupStatus } from "./types";
import ParcelamentoCard from "./ParcelamentoCard";
import ParcelamentoModal from "./ParcelamentoModal";

type InstallmentTx = {
  id: string;
  status: string;
  amount: number;
  date: string;
  installment_group_id: string | null;
};

interface Props {
  groups: InstallmentGroupWithRelations[];
  transactions: InstallmentTx[];
  categorias: Pick<Category, "id" | "name" | "icon">[];
  cartoes: Pick<CreditCard, "id" | "name" | "brand">[];
}

type StatusFilter = "all" | "active" | "done";

export default function ParcelamentoList({ groups, transactions, categorias, cartoes }: Props) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [showModal, setShowModal] = useState(false);

  function handleSaved() {
    setShowModal(false);
    router.refresh();
  }

  const filtered = groups.filter((g) => {
    if (statusFilter === "all") return true;
    const summary = computeSummary(transactions, g.id);
    const status = groupStatus(summary);
    if (statusFilter === "active") return status === "active";
    if (statusFilter === "done") return status === "done" || status === "cancelled";
    return true;
  });

  return (
    <div>
      {/* Mobile full-width button */}
      <button
        onClick={() => setShowModal(true)}
        className="sm:hidden w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-semibold mb-4 hover:bg-brand-700 transition-colors"
      >
        <Plus size={16} /> Nova Compra
      </button>

      {/* Header desktop */}
      <div className="hidden sm:flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Parcelamentos</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus size={16} />
          Nova Compra
        </button>
      </div>

      {/* Filtro de status */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-fit mb-5">
        {(
          [
            { value: "active", label: "Em andamento" },
            { value: "done", label: "Concluídos" },
            { value: "all", label: "Todos" },
          ] as { value: StatusFilter; label: string }[]
        ).map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`flex flex-1 sm:flex-none items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">Nenhum parcelamento encontrado.</p>
          {groups.length === 0 && (
            <p className="text-xs mt-1">Cadastre uma compra parcelada para começar.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((g) => {
            const summary = computeSummary(transactions, g.id);
            return (
              <ParcelamentoCard
                key={g.id}
                group={g}
                summary={summary}
                onSaved={() => router.refresh()}
              />
            );
          })}
        </div>
      )}

      {showModal && (
        <ParcelamentoModal
          categorias={categorias}
          cartoes={cartoes}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
