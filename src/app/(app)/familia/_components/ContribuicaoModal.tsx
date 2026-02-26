"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import { FamilyContribution, formatCurrency } from "./types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentContribution: FamilyContribution | null;
  currentMonth: string;
}

export default function ContribuicaoModal({
  isOpen,
  onClose,
  currentContribution,
  currentMonth,
}: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAmount(currentContribution ? String(currentContribution.amount) : "");
      setNotes(currentContribution?.notes ?? "");
      setError("");
    }
  }, [isOpen, currentContribution]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/familia/contribuicao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          notes: notes || null,
          mes: currentMonth,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <Modal
      title="Minha contribuição"
      onClose={onClose}
      footer={
        <>
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="contribuicao-form"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </>
      }
    >
      <form id="contribuicao-form" onSubmit={handleSubmit} className="space-y-4">
        {currentContribution && (
          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            Contribuição atual:{" "}
            <span className="font-medium text-gray-700">
              {formatCurrency(currentContribution.amount)}/mês
            </span>
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor mensal (R$)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="0.01"
            step="0.01"
            placeholder="0,00"
            autoFocus
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas{" "}
            <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Observações..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}
