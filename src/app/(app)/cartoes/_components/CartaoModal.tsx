"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import type { CreditCard } from "@/types/database";

const CARD_BRANDS = [
  "Visa",
  "Mastercard",
  "Elo",
  "American Express",
  "Hipercard",
  "Outro",
];

const CARD_COLORS = [
  "#1a1a2e",
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#f97316",
  "#8b5cf6",
  "#6b7280",
];

interface Props {
  cartao: CreditCard | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function CartaoModal({ cartao, onClose, onSaved }: Props) {
  const [name, setName] = useState(cartao?.name ?? "");
  const [brand, setBrand] = useState(cartao?.brand ?? "Visa");
  const [closingDay, setClosingDay] = useState(cartao?.closing_day?.toString() ?? "");
  const [dueDay, setDueDay] = useState(cartao?.due_day?.toString() ?? "");
  const [creditLimit, setCreditLimit] = useState(cartao?.credit_limit?.toString() ?? "");
  const [lastFour, setLastFour] = useState(cartao?.last_four_digits ?? "");
  const [color, setColor] = useState(cartao?.color ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !closingDay || !dueDay) {
      setError("Nome, dia de fechamento e vencimento são obrigatórios");
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      name: name.trim(),
      brand,
      closing_day: parseInt(closingDay),
      due_day: parseInt(dueDay),
      credit_limit: creditLimit ? parseFloat(creditLimit) : null,
      last_four_digits: lastFour || null,
      color: color || null,
      scope: "personal",
      is_shared: false,
    };

    const url = cartao ? `/api/cartoes/${cartao.id}` : "/api/cartoes";
    const method = cartao ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (!res.ok) {
      const { error: msg } = await res.json();
      setError(msg ?? "Erro ao salvar");
      return;
    }
    onSaved();
  }

  return (
    <Modal
      title={cartao ? "Editar Cartão" : "Novo Cartão"}
      onClose={onClose}
      footer={
        <div>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-brand-700/30 rounded-lg text-sm font-medium text-brand-700 hover:bg-brand-700/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="cartao-form"
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      }
    >
      <form id="cartao-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Nubank"
            className="w-full px-3 py-2.5 border border-brand-700/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">
            Bandeira <span className="text-red-500">*</span>
          </label>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="w-full px-3 py-2.5 border border-brand-700/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/30"
          >
            {CARD_BRANDS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-brand-700 mb-1">
              Fechamento <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={31}
              value={closingDay}
              onChange={(e) => setClosingDay(e.target.value)}
              placeholder="Dia"
              className="w-full px-3 py-2.5 border border-brand-700/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-700 mb-1">
              Vencimento <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={31}
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              placeholder="Dia"
              className="w-full px-3 py-2.5 border border-brand-700/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-brand-700 mb-1">
              Limite (R$)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              placeholder="Ex: 5000"
              className="w-full px-3 py-2.5 border border-brand-700/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-700 mb-1">
              Últimos 4 dígitos
            </label>
            <input
              type="text"
              maxLength={4}
              value={lastFour}
              onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ""))}
              placeholder="1234"
              className="w-full px-3 py-2.5 border border-brand-700/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-700 mb-2">
            Cor do cartão
          </label>
          <div className="flex gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setColor("")}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                !color ? "border-brand-500 scale-110" : "border-brand-700/20"
              } bg-brand-700/10`}
              title="Sem cor"
            />
            {CARD_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  color === c ? "border-brand-500 scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>

      </form>
    </Modal>
  );
}
