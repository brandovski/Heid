"use client";

import { useState } from "react";
import { Pencil, XCircle } from "lucide-react";
import type { SubscriptionWithRelations } from "./types";
import { formatCurrency } from "./types";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface Props {
  assinatura: SubscriptionWithRelations;
  onEdit: (a: SubscriptionWithRelations) => void;
  onSaved: () => void;
}

export default function AssinaturaCard({ assinatura: a, onEdit, onSaved }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const isUsd = a.original_currency === "USD";

  // Verificar se está no período promocional
  const isInPromo = (() => {
    if (a.promotional_amount == null || a.promotional_months == null) return false;
    const today = new Date();
    const [startYear, startMonth] = a.start_date.split("-").map(Number);
    const monthsActive = (today.getFullYear() * 12 + today.getMonth() + 1) - (startYear * 12 + startMonth);
    return monthsActive < a.promotional_months;
  })();
  async function handleCancel() {
    await fetch(`/api/assinaturas/${a.id}`, { method: "DELETE" });
    onSaved();
  }

  return (
    <>
    <div
      className={`px-4 py-3 rounded-xl border ${
        !a.is_active
          ? "bg-brand-700/5 border-brand-700/10 opacity-60"
          : "bg-surface border-brand-700/20"
      }`}
    >
      {/* Linha 1: ícone + nome + valor */}
      <div className="flex items-center gap-3">
        <span className="text-lg shrink-0 w-7 text-center">
          {a.category?.icon ?? "🔄"}
        </span>
        <p className="flex-1 text-sm font-medium text-brand-700 truncate">{a.name}</p>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-red-600">{formatCurrency(a.amount_brl)}/mês</p>
          {isUsd && (
            <p className="text-xs text-brand-700/40">US$ {a.amount_original.toFixed(2)}</p>
          )}
        </div>
      </div>

      {/* Linha 2: metadata + badges + ações */}
      <div className="flex items-center gap-2 mt-1.5 ml-10 min-w-0">
        <p className="flex-1 text-xs text-brand-700/40 truncate min-w-0">
          Dia {a.billing_day}
          {a.credit_card ? ` · ${a.credit_card.name}` : ""}
          {a.category ? ` · ${a.category.name}` : ""}
        </p>

        <div className="flex items-center gap-1 shrink-0">
          {isInPromo && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700">
              Promo
            </span>
          )}

          {isUsd && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-yellow-50 text-yellow-700">
              USD
            </span>
          )}

          {a.is_active ? (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-green-50 text-green-700">
              Ativa
            </span>
          ) : (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-brand-700/10 text-brand-700/50">
              Cancelada
            </span>
          )}

          <div className="flex items-center gap-0.5">
            {a.is_active && (
              <>
                <button
                  onClick={() => onEdit(a)}
                  className="p-1.5 rounded-lg text-brand-700/40 hover:text-brand-700/70 hover:bg-brand-700/10 transition-colors"
                  title="Editar"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="p-1.5 rounded-lg text-brand-700/40 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Cancelar assinatura"
                >
                  <XCircle size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>

    <ConfirmModal
      isOpen={showConfirm}
      onClose={() => setShowConfirm(false)}
      onConfirm={handleCancel}
      title="Cancelar assinatura"
      description={`Cancelar a assinatura "${a.name}"? As transações futuras não serão mais geradas.`}
      confirmLabel="Cancelar assinatura"
      variant="warning"
    />
  </>
  );
}
