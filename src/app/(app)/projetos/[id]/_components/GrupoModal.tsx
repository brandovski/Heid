"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import type { ProjectGroup } from "../../_components/types";

interface Props {
  projectId: string;
  group?: ProjectGroup;
  onClose: () => void;
  onSaved: (group: ProjectGroup) => void;
}

export default function GrupoModal({ projectId, group, onClose, onSaved }: Props) {
  const editing = !!group;
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name.trim()) { setError("Nome é obrigatório"); return; }

    setSaving(true);
    setError("");

    const url = editing
      ? `/api/projetos/grupos/${group!.id}`
      : `/api/projetos/${projectId}/grupos`;
    const method = editing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Erro ao salvar");
      setSaving(false);
      return;
    }

    const saved = await res.json();
    onSaved(saved);
    onClose();
  }

  return (
    <Modal
      title={editing ? "Editar Grupo" : "Novo Grupo"}
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
            placeholder="Ex: Buffet e Decoração, Lua de Mel..."
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
      </div>
    </Modal>
  );
}
