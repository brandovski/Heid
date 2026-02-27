"use client";

import { Pencil, XCircle } from "lucide-react";
import type { SubscriptionWithRelations } from "./types";
import { formatCurrency } from "./types";

interface Props {
  assinatura: SubscriptionWithRelations;
  onEdit: (a: SubscriptionWithRelations) => void;
  onSaved: () => void;
}

export default function AssinaturaCard({ assinatura: a, onEdit, onSaved }: Props) {
  const isUsd = a.original_currency === "USD";
  const scopeColor =
    a.scope === "personal" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700";

  async function handleCancel() {
    if (!confirm(`Cancelar a assinatura "${a.name}"?`)) return;
    await fetch(`/api/assinaturas/${a.id}`, { method: "DELETE" });
    onSaved();
  }

  return (
    <div
      className={`px-4 py-3 rounded-xl border ${
        !a.is_active
          ? "bg-gray-50 border-gray-100 opacity-60"
          : "bg-white border-gray-200"
      }`}
    >
      {/* Linha 1: ícone + nome + valor */}
      <div className="flex items-center gap-3">
        <span className="text-lg shrink-0 w-7 text-center">
          {a.category?.icon ?? "🔄"}
        </span>
        <p className="flex-1 text-sm font-medium text-gray-900 truncate">{a.name}</p>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-red-600">{formatCurrency(a.amount_brl)}/mês</p>
          {isUsd && (
            <p className="text-xs text-gray-400">US$ {a.amount_original.toFixed(2)}</p>
          )}
        </div>
      </div>

      {/* Linha 2: metadata + badges + ações */}
      <div className="flex items-center gap-2 mt-1.5 ml-10 min-w-0">
        <p className="flex-1 text-xs text-gray-400 truncate min-w-0">
          Dia {a.billing_day}
          {a.credit_card ? ` · ${a.credit_card.name}` : ""}
          {a.category ? ` · ${a.category.name}` : ""}
        </p>

        <div className="flex items-center gap-1 shrink-0">
          {isUsd && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-yellow-50 text-yellow-700">
              USD
            </span>
          )}

          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${scopeColor}`}>
            {a.scope === "personal" ? "Pessoal" : "Familiar"}
          </span>

          {a.is_active ? (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-green-50 text-green-700">
              Ativa
            </span>
          ) : (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
              Cancelada
            </span>
          )}

          <div className="flex items-center gap-0.5">
            {a.is_active && (
              <>
                <button
                  onClick={() => onEdit(a)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Editar"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
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
  );
}
