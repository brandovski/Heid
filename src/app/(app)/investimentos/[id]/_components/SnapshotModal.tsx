"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import DatePicker from "@/components/ui/DatePicker";

interface Props {
  investmentId: string;
  investmentName: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function SnapshotModal({ investmentId, investmentName, onClose, onSaved }: Props) {
  const [value, setValue] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (value === "" || parseFloat(value) < 0) { setError("Valor deve ser não-negativo"); return; }
    if (!date) { setError("Data é obrigatória"); return; }

    setSaving(true);
    setError("");

    const res = await fetch(`/api/investimentos/${investmentId}/snapshots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: parseFloat(value), date, notes: notes || null }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Erro ao salvar");
      setSaving(false);
      return;
    }

    onSaved();
    onClose();
  }

  return (
    <Modal
      title="Atualizar Saldo"
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-brand-700 bg-brand-700/10 rounded-lg hover:bg-brand-700/20 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-60 transition-colors">
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <p className="text-sm text-brand-700/50">
          Informe o saldo atual de <strong>{investmentName}</strong> conforme exibido na corretora.
        </p>

        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">Saldo Atual (R$) *</label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            min="0"
            step="0.01"
            placeholder="0,00"
            className="w-full px-3 py-2.5 border border-brand-700/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">Data *</label>
          <DatePicker value={date} onChange={setDate} placeholder="Selecione a data" />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">Notas</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Opcional"
            className="w-full px-3 py-2.5 border border-brand-700/30 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-700/30"
          />
        </div>
      </div>
    </Modal>
  );
}
