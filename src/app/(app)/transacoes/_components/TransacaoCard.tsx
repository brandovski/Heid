"use client";

import { CheckCircle, XCircle, Pencil, Trash2 } from "lucide-react";
import type { TransactionWithRelations } from "./types";
import {
  isIncome,
  TYPE_LABELS,
  formatDate,
  formatCurrency,
} from "./types";

interface Props {
  transacao: TransactionWithRelations;
  onEdit: (t: TransactionWithRelations) => void;
  onPagar: (t: TransactionWithRelations) => void;
  onSaved: () => void;
}

const STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  pending: { label: "Pendente", className: "bg-yellow-50 text-yellow-700" },
  paid: { label: "Pago", className: "bg-green-50 text-green-700" },
  cancelled: { label: "Cancelado", className: "bg-gray-100 text-gray-500" },
};

export default function TransacaoCard({
  transacao: t,
  onEdit,
  onPagar,
  onSaved,
}: Props) {
  const income = isIncome(t.type);
  const badge = STATUS_BADGE[t.status] ?? STATUS_BADGE.pending;
  const typeLabel = TYPE_LABELS[t.type] ?? t.type;
  const isManual = !t.auto_generated;

  async function handleCancel() {
    await fetch(`/api/transacoes/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    onSaved();
  }

  async function handleDelete() {
    if (!confirm("Excluir esta transação permanentemente?")) return;
    await fetch(`/api/transacoes/${t.id}`, { method: "DELETE" });
    onSaved();
  }

  const scopeColor =
    t.scope === "personal"
      ? "bg-purple-50 text-purple-700"
      : "bg-blue-50 text-blue-700";
  const scopeLabel = t.scope === "personal" ? "Pessoal" : "Familiar";

  return (
    <div
      className={`px-4 py-3 rounded-xl border ${
        t.status === "cancelled"
          ? "bg-gray-50 border-gray-100 opacity-60"
          : "bg-white border-gray-200"
      }`}
    >
      {/* Linha 1: ícone + descrição + valor */}
      <div className="flex items-center gap-3">
        <span className="text-lg shrink-0 w-7 text-center">
          {t.category?.icon ?? (income ? "📈" : "📉")}
        </span>
        <p className="flex-1 text-sm font-medium text-gray-900 truncate">
          {t.description}
        </p>
        <span
          className={`text-sm font-semibold shrink-0 ${
            income ? "text-green-600" : "text-red-600"
          }`}
        >
          {income ? "+" : "-"}
          {formatCurrency(t.amount)}
        </span>
      </div>

      {/* Linha 2: metadata + badges + ações */}
      <div className="flex items-center gap-2 mt-1.5 ml-10 min-w-0">
        <p className="flex-1 text-xs text-gray-400 truncate min-w-0">
          {formatDate(t.date)}
          {t.category ? ` · ${t.category.name}` : ""}
          {t.credit_card ? ` · ${t.credit_card.name}` : ""}
        </p>

        <div className="flex items-center gap-1 shrink-0">
          {/* Badge de tipo (para transações automáticas) */}
          {!isManual && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
              {typeLabel}
            </span>
          )}

          {/* Badge de escopo */}
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${scopeColor}`}
          >
            {scopeLabel}
          </span>

          {/* Badge de status */}
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${badge.className}`}
          >
            {badge.label}
          </span>

          {/* Ações */}
          <div className="flex items-center gap-0.5">
            {/* Editar — apenas manuais não cancelados */}
            {isManual && t.status !== "cancelled" && (
              <button
                onClick={() => onEdit(t)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Editar"
              >
                <Pencil size={14} />
              </button>
            )}

            {/* Pagar — apenas pendentes */}
            {t.status === "pending" && (
              <button
                onClick={() => onPagar(t)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                title="Marcar como pago"
              >
                <CheckCircle size={14} />
              </button>
            )}

            {/* Cancelar — apenas não cancelados */}
            {t.status !== "cancelled" && (
              <button
                onClick={handleCancel}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Cancelar"
              >
                <XCircle size={14} />
              </button>
            )}

            {/* Excluir — apenas manuais cancelados */}
            {isManual && t.status === "cancelled" && (
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Excluir permanentemente"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
