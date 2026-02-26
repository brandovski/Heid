"use client";

import { Pencil, PowerOff, RotateCcw, Receipt } from "lucide-react";
import type { CreditCard as CreditCardType } from "@/types/database";

interface Props {
  cartao: CreditCardType;
  onEdit: (cartao: CreditCardType) => void;
  onSaved: () => void;
  onViewFatura: (cartao: CreditCardType) => void;
}

export default function CartaoCard({ cartao, onEdit, onSaved, onViewFatura }: Props) {
  async function handleToggleActive() {
    await fetch(`/api/cartoes/${cartao.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !cartao.is_active }),
    });
    onSaved();
  }

  const bgColor = cartao.color ?? "#334155";

  return (
    <div className={cartao.is_active ? "" : "opacity-60 grayscale"}>

      {/* ── Visual do cartão ── */}
      <div
        className="relative rounded-2xl overflow-hidden aspect-[8/5] select-none"
        style={{
          backgroundColor: bgColor,
          backgroundImage:
            "linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(0,0,0,0.22) 100%)",
        }}
      >
        {/* Círculos decorativos */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute right-2 top-8 w-28 h-28 rounded-full bg-white/10" />

        {/* Conteúdo */}
        <div className="absolute inset-0 p-5 flex flex-col justify-between">

          {/* Topo: Chip + Bandeira */}
          <div className="flex items-start justify-between">
            {/* Chip EMV */}
            <div className="w-9 h-7 rounded bg-yellow-300/85 grid grid-cols-2 grid-rows-2 gap-px p-1">
              <div className="bg-yellow-600/40 rounded-sm" />
              <div className="bg-yellow-600/40 rounded-sm" />
              <div className="bg-yellow-600/40 rounded-sm" />
              <div className="bg-yellow-600/40 rounded-sm" />
            </div>
            {/* Bandeira */}
            <span className="text-white/90 font-bold text-sm tracking-widest uppercase">
              {cartao.brand}
            </span>
          </div>

          {/* Meio: Número */}
          <div className="font-mono text-white/70 text-sm tracking-[0.2em]">
            {cartao.last_four_digits
              ? `•••• •••• •••• ${cartao.last_four_digits}`
              : "•••• •••• •••• ••••"}
          </div>

          {/* Baixo: Nome + Datas */}
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-white/50 text-[9px] uppercase tracking-widest mb-0.5">
                Titular
              </p>
              <p className="text-white font-semibold text-sm uppercase tracking-wide truncate">
                {cartao.name}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-white/50 text-[9px] uppercase tracking-widest mb-0.5">
                Fecha · Vence
              </p>
              <p className="text-white/80 text-xs">
                dia {cartao.closing_day} · dia {cartao.due_day}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Linha inferior: badges + ações ── */}
      <div className="flex items-center justify-between mt-3 px-0.5">

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              cartao.scope === "personal"
                ? "bg-purple-50 text-purple-700"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {cartao.scope === "personal" ? "Pessoal" : "Familiar"}
          </span>
          {cartao.is_shared && cartao.scope === "personal" && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-50 text-purple-600">
              Compartilhado
            </span>
          )}
          {cartao.credit_limit != null && (
            <span className="text-xs text-gray-400">
              {cartao.credit_limit.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
                maximumFractionDigits: 0,
              })}
            </span>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex items-center gap-1 shrink-0">
          {cartao.is_active && (
            <>
              <button
                onClick={() => onViewFatura(cartao)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                title="Ver Fatura"
              >
                <Receipt size={13} />
                Ver Fatura
              </button>
              <button
                onClick={() => onEdit(cartao)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Editar"
              >
                <Pencil size={14} />
              </button>
            </>
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
    </div>
  );
}
