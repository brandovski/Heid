"use client";

import { useState } from "react";
import { XCircle } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import type { InstallmentGroupWithRelations, InstallmentSummary } from "./types";
import { groupStatus, formatCurrency, formatDate } from "./types";

interface Props {
  group: InstallmentGroupWithRelations;
  summary: InstallmentSummary;
  onSaved: () => void;
}

const STATUS_BADGE = {
  active: { label: "Em andamento", className: "bg-brand-50 text-brand-700" },
  done: { label: "Quitado", className: "bg-green-50 text-green-700" },
  cancelled: { label: "Cancelado", className: "bg-gray-100 text-gray-500" },
};

export default function ParcelamentoCard({ group, summary, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const status = groupStatus(summary);
  const badge = STATUS_BADGE[status];
  const scopeColor =
    group.scope === "personal" ? "bg-purple-50 text-purple-700" : "bg-brand-50 text-brand-700";

  async function handleCancelRemaining() {
    setLoading(true);
    await fetch(`/api/parcelamentos/${group.id}`, { method: "DELETE" });
    setLoading(false);
    onSaved();
  }

  return (
    <>
    <div
      className={`px-4 py-3 rounded-xl border ${
        status === "cancelled"
          ? "bg-gray-50 border-gray-100 opacity-60"
          : "bg-white border-gray-200"
      }`}
    >
      {/* Linha 1: ícone + descrição + total */}
      <div className="flex items-center gap-3">
        <span className="text-lg shrink-0 w-7 text-center">
          {group.category?.icon ?? "🛒"}
        </span>
        <p className="flex-1 text-sm font-medium text-gray-900 truncate">
          {group.description}
        </p>
        <span className="text-sm font-semibold text-red-600 shrink-0">
          {formatCurrency(group.total_amount)}
        </span>
      </div>

      {/* Linha 2: progresso */}
      <div className="mt-2 ml-10">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>
            {summary.paid}/{summary.total} parcelas pagas
            {summary.paid > 0 && ` · ${formatCurrency(summary.amountPaid)}`}
          </span>
          {summary.nextDate && (
            <span className="text-gray-400">
              Próxima: {formatDate(summary.nextDate)}
            </span>
          )}
        </div>
        {summary.total > 0 && (
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                status === "done" ? "bg-green-500" : "bg-brand-500"
              }`}
              style={{ width: `${(summary.paid / summary.total) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Linha 3: metadata + badges + ações */}
      <div className="flex items-center gap-2 mt-2 ml-10 min-w-0">
        <p className="flex-1 text-xs text-gray-400 truncate min-w-0">
          {group.credit_card?.name ?? "—"}
          {group.category ? ` · ${group.category.name}` : ""}
        </p>

        <div className="flex items-center gap-1 shrink-0">
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${scopeColor}`}>
            {group.scope === "personal" ? "Pessoal" : "Familiar"}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${badge.className}`}>
            {badge.label}
          </span>

          {status === "active" && (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={loading}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              title="Cancelar parcelas restantes"
            >
              <XCircle size={14} />
            </button>
          )}
        </div>
      </div>
    </div>

    <ConfirmModal
      isOpen={showConfirm}
      onClose={() => setShowConfirm(false)}
      onConfirm={handleCancelRemaining}
      title="Cancelar parcelas"
      description={`Cancelar as ${summary.pending} parcela(s) pendente(s) de "${group.description}"?`}
      confirmLabel="Cancelar parcelas"
      variant="warning"
    />
  </>
  );
}
