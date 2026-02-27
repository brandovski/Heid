"use client";

import { CreditCard, Pencil, PowerOff, RotateCcw } from "lucide-react";
import type { CreditCard as CreditCardType } from "@/types/database";

interface Props {
  cartao: CreditCardType;
  onEdit: (cartao: CreditCardType) => void;
  onSaved: () => void;
}

export default function CartaoCard({ cartao, onEdit, onSaved }: Props) {
  async function handleToggleActive() {
    await fetch(`/api/cartoes/${cartao.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !cartao.is_active }),
    });
    onSaved();
  }

  const scopeLabel = cartao.scope === "personal" ? "Pessoal" : "Familiar";
  const scopeColor =
    cartao.scope === "personal"
      ? "bg-purple-50 text-purple-700"
      : "bg-blue-50 text-blue-700";

  return (
    <div
      className={`rounded-xl border p-4 ${
        cartao.is_active
          ? "bg-white border-gray-200"
          : "bg-gray-50 border-gray-100 opacity-60"
      }`}
      style={cartao.color ? { borderLeftColor: cartao.color, borderLeftWidth: 4 } : {}}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-gray-400 shrink-0" />
          <span className="font-medium text-gray-900 text-sm">{cartao.name}</span>
          {cartao.last_four_digits && (
            <span className="text-xs text-gray-400">
              •••• {cartao.last_four_digits}
            </span>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${scopeColor}`}>
          {scopeLabel}
        </span>
      </div>

      <div className="text-xs text-gray-500 space-y-0.5 mb-3">
        <p>
          Bandeira:{" "}
          <span className="font-medium text-gray-700">{cartao.brand}</span>
        </p>
        <p>
          Fecha dia{" "}
          <span className="font-medium text-gray-700">{cartao.closing_day}</span>
          {" · "}Vence dia{" "}
          <span className="font-medium text-gray-700">{cartao.due_day}</span>
        </p>
        {cartao.credit_limit != null && (
          <p>
            Limite:{" "}
            <span className="font-medium text-gray-700">
              {cartao.credit_limit.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </p>
        )}
        {cartao.is_shared && cartao.scope === "personal" && (
          <p className="text-purple-600">Compartilhado</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-1">
        {cartao.is_active && (
          <button
            onClick={() => onEdit(cartao)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Editar"
          >
            <Pencil size={14} />
          </button>
        )}
        <button
          onClick={handleToggleActive}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title={cartao.is_active ? "Desativar" : "Reativar"}
        >
          {cartao.is_active ? <PowerOff size={14} /> : <RotateCcw size={14} />}
        </button>
      </div>
    </div>
  );
}
