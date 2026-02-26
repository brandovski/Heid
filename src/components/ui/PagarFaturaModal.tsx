"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import DatePicker from "@/components/ui/DatePicker";

function formatCurrencyLocal(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  cartaoNome: string;
  totalAmount: number;
  creditCardId: string;
  referenceMonth: string;
}

export default function PagarFaturaModal({
  isOpen,
  onClose,
  onSaved,
  cartaoNome,
  totalAmount,
  creditCardId,
  referenceMonth,
}: Props) {
  const [payType, setPayType] = useState<"total" | "partial">("total");
  const [partialStr, setPartialStr] = useState("");
  const [paidAt, setPaidAt] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const amountToPay = payType === "total" ? totalAmount : parseFloat(partialStr || "0");
  const canSubmit = payType === "total" ? true : partialStr.length > 0 && parseFloat(partialStr) > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/faturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credit_card_id: creditCardId,
          reference_month: referenceMonth,
          amount_paid: amountToPay,
          notes: notes.trim() || null,
          paid_at: paidAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao registrar pagamento");
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar pagamento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title={`Pagar Fatura — ${cartaoNome}`}
      onClose={onClose}
      footer={
        <div className="flex items-center gap-3">
          {error && <p className="text-xs text-red-600 flex-1">{error}</p>}
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="pagar-fatura-form"
              disabled={loading || !canSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {loading ? "Salvando..." : "Confirmar Pagamento"}
            </button>
          </div>
        </div>
      }
    >
      <form id="pagar-fatura-form" onSubmit={handleSubmit} className="space-y-4">

        {/* Tipo de pagamento */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Valor do pagamento</label>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
            <input
              type="radio"
              name="pay-type"
              value="total"
              checked={payType === "total"}
              onChange={() => setPayType("total")}
              className="accent-blue-600"
            />
            <div className="flex items-center justify-between flex-1">
              <span className="text-sm font-medium text-gray-800">Valor total</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrencyLocal(totalAmount)}
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
            <input
              type="radio"
              name="pay-type"
              value="partial"
              checked={payType === "partial"}
              onChange={() => setPayType("partial")}
              className="accent-blue-600 mt-0.5"
            />
            <div className="flex-1 space-y-2">
              <span className="text-sm font-medium text-gray-800">Valor parcial</span>
              {payType === "partial" && (
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={partialStr}
                  onChange={(e) => setPartialStr(e.target.value)}
                  placeholder="0,00"
                  autoFocus
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          </label>
        </div>

        {/* Data do pagamento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Data do pagamento
          </label>
          <DatePicker
            value={paidAt}
            onChange={setPaidAt}
            placeholder="Pagamento hoje"
          />
        </div>

        {/* Observações */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Observações <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: débito automático"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>
    </Modal>
  );
}
