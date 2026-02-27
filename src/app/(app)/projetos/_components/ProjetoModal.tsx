"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import DatePicker from "@/components/ui/DatePicker";
import type { Project } from "./types";

interface Props {
  onClose: () => void;
  onSaved: () => void;
  project?: Project;
}

export default function ProjetoModal({ onClose, onSaved, project }: Props) {
  const editing = !!project;
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [totalBudget, setTotalBudget] = useState(
    project?.total_budget != null ? String(project.total_budget) : ""
  );
  const [targetDate, setTargetDate] = useState(project?.target_date ?? "");
  const [scope, setScope] = useState<"family" | "personal">(project?.scope ?? "family");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name.trim()) { setError("Nome é obrigatório"); return; }
    if (!totalBudget || parseFloat(totalBudget) < 0) { setError("Orçamento inválido"); return; }

    setSaving(true);
    setError("");

    const payload = { name, description, total_budget: parseFloat(totalBudget), target_date: targetDate || null, scope };
    const url = editing ? `/api/projetos/${project!.id}` : "/api/projetos";
    const method = editing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
      title={editing ? "Editar Projeto" : "Novo Projeto"}
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
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {saving ? "Salvando..." : editing ? "Salvar" : "Criar"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Casamento, Viagem Europa..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Opcional"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento Total (R$) *</label>
          <input
            type="number"
            value={totalBudget}
            onChange={(e) => setTotalBudget(e.target.value)}
            min="0"
            step="0.01"
            placeholder="0,00"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data Alvo</label>
          <DatePicker value={targetDate} onChange={setTargetDate} placeholder="Selecione uma data" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Escopo</label>
          <div className="flex gap-2">
            {(["family", "personal"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  scope === s
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                }`}
              >
                {s === "family" ? "Familiar" : "Pessoal"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
