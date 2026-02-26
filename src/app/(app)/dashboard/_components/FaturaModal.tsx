"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import { CreditCardRow, formatCurrency } from "./types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  card: CreditCardRow;
  referenceMonth: string;
  defaultAmount: number;
}

export default function FaturaModal({
  isOpen,
  onClose,
  card,
  referenceMonth,
  defaultAmount,
}: Props) {
  const router = useRouter();
  const [amountStr, setAmountStr] = useState(defaultAmount.toFixed(2));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/faturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credit_card_id: card.id,
          reference_month: referenceMonth,
          amount_paid: parseFloat(amountStr),
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao registrar pagamento");
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar pagamento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title={`Pagamento — ${card.name}`}
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
              form="fatura-form"
              disabled={loading || !amountStr}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {loading ? "Salvando..." : "Registrar"}
            </button>
          </div>
        </div>
      }
    >
      <form id="fatura-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Valor pago (R$)
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            required
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Total comprometido no mês: {formatCurrency(defaultAmount)}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Observações{" "}
            <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Ex: pago no débito automático"
          />
        </div>
      </form>
    </Modal>
  );
}
