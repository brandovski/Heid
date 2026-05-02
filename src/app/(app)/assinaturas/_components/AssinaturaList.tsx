"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { Category, CreditCard } from "@/types/database";
import type { SubscriptionWithRelations } from "./types";
import { formatCurrency } from "./types";
import AssinaturaCard from "./AssinaturaCard";
import AssinaturaModal from "./AssinaturaModal";

interface Props {
  assinaturas: SubscriptionWithRelations[];
  categorias: Pick<Category, "id" | "name" | "icon">[];
  cartoes: Pick<CreditCard, "id" | "name" | "brand">[];
}

type StatusFilter = "active" | "all";

export default function AssinaturaList({ assinaturas, categorias, cartoes }: Props) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SubscriptionWithRelations | null>(null);

  function handleEdit(a: SubscriptionWithRelations) {
    setEditing(a);
    setShowModal(true);
  }

  function handleClose() {
    setShowModal(false);
    setEditing(null);
  }

  function handleSaved() {
    handleClose();
    router.refresh();
  }

  const filtered = assinaturas.filter((a) => {
    if (statusFilter === "active") return a.is_active;
    return true;
  });

  const totalMensal = filtered
    .filter((a) => a.is_active)
    .reduce((sum, a) => sum + a.amount_brl, 0);

  return (
    <div>
      {/* Mobile full-width button */}
      <button
        onClick={() => setShowModal(true)}
        className="sm:hidden w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-semibold mb-4 hover:bg-brand-700 transition-colors"
      >
        <Plus size={16} /> Nova Assinatura
      </button>

      {/* Header desktop */}
      <div className="hidden sm:flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-brand-700">Assinaturas</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus size={16} />
          Nova Assinatura
        </button>
      </div>

      {/* Resumo mensal */}
      {filtered.some((a) => a.is_active) && (
        <div className="bg-red-50 rounded-xl p-3 mb-5 text-center">
          <p className="text-xs text-red-600 font-medium mb-0.5">Total mensal ativo</p>
          <p className="text-base font-bold text-red-700">{formatCurrency(totalMensal)}</p>
        </div>
      )}

      {/* Filtro */}
      <div className="flex gap-1 bg-brand-700/10 p-1 rounded-xl w-full sm:w-fit mb-5">
        {(
          [
            { value: "active", label: "Ativas" },
            { value: "all", label: "Todas" },
          ] as { value: StatusFilter; label: string }[]
        ).map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`flex flex-1 sm:flex-none items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === value
                ? "bg-surface text-brand-700 shadow-sm"
                : "text-brand-700/70 hover:text-brand-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-brand-700/40">
          <p className="text-sm">Nenhuma assinatura encontrada.</p>
          {assinaturas.length === 0 && (
            <p className="text-xs mt-1">Cadastre suas assinaturas recorrentes.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <AssinaturaCard
              key={a.id}
              assinatura={a}
              onEdit={handleEdit}
              onSaved={() => router.refresh()}
            />
          ))}
        </div>
      )}

      {showModal && (
        <AssinaturaModal
          assinatura={editing}
          categorias={categorias}
          cartoes={cartoes}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
