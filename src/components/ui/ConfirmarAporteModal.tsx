"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import DatePicker from "@/components/ui/DatePicker";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  investment: { id: string; name: string };
  expectedAmount: number;
  scheduledDay: number;
  currentMonth: string; // "YYYY-MM"
}

function defaultDate(currentMonth: string, scheduledDay: number): string {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const [year, month] = currentMonth.split("-").map(Number);
  // Clamp scheduledDay to last day of month
  const lastDay = new Date(year, month, 0).getDate();
  const day = Math.min(scheduledDay, lastDay);
  const scheduled = `${currentMonth}-${String(day).padStart(2, "0")}`;
  return scheduled > todayStr ? todayStr : scheduled;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function ConfirmarAporteModal({
  isOpen,
  onClose,
  onSaved,
  investment,
  expectedAmount,
  scheduledDay,
  currentMonth,
}: Props) {
  const [useIntegral, setUseIntegral] = useState(true);
  const [customAmount, setCustomAmount] = useState("");
  const [date, setDate] = useState(() => defaultDate(currentMonth, scheduledDay));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const amount = useIntegral ? expectedAmount : parseFloat(customAmount || "0");

  async function handleConfirm() {
    if (!useIntegral && (!customAmount || parseFloat(customAmount) <= 0)) {
      setError("Informe o valor do aporte");
      return;
    }
    if (!date) {
      setError("Data é obrigatória");
      return;
    }

    setSaving(true);
    setError("");

    const res = await fetch(`/api/investimentos/${investment.id}/transacoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "deposit",
        amount,
        date,
        notes: notes.trim() || null,
      }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Erro ao confirmar aporte");
      setSaving(false);
      return;
    }

    onSaved();
    onClose();
  }

  return (
    <Modal
      title="Confirmar Aporte"
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {saving ? "Confirmando..." : "Confirmar"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">{investment.name}</p>
          <p className="text-xs text-gray-400">
            Aporte programado para o dia {scheduledDay}
          </p>
        </div>

        {/* Valor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Valor</label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                checked={useIntegral}
                onChange={() => setUseIntegral(true)}
                className="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-700">
                Valor integral ({formatCurrency(expectedAmount)})
              </span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                checked={!useIntegral}
                onChange={() => setUseIntegral(false)}
                className="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-700">Outro valor</span>
            </label>
          </div>
          {!useIntegral && (
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              min="0.01"
              step="0.01"
              placeholder="Valor (R$)"
              className="mt-2 w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          )}
        </div>

        {/* Data */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
          <DatePicker value={date} onChange={setDate} placeholder="Selecione a data" />
        </div>

        {/* Observações */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observações <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Ex: aporte feito via Pix"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
    </Modal>
  );
}
