"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import type { Category } from "@/types/database";

const PRESET_COLORS = [
  "#A8C5B5", "#C5DDD3", // sages (brand green family)
  "#E8D87A", "#F2E8A0", // dourados (accent family)
  "#E8C4A0", "#DDB896", // pêssego / terracota
  "#E8A8A8", "#D4A0A0", // rosa empoeirado / coral
  "#A8C5E8", "#B8D8E0", // periwinkle / azul pó
  "#C8B8E8", "#C8D8A8", // lavanda / lima suave
];

interface Props {
  categoria: Category | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function CategoriaModal({ categoria, onClose, onSaved }: Props) {
  const [name, setName] = useState(categoria?.name ?? "");
  const [icon, setIcon] = useState(categoria?.icon ?? "");
  const [color, setColor] = useState(categoria?.color ?? "");
  const [type, setType] = useState<'income' | 'expense' | null>(categoria?.type ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nome obrigatório");
      return;
    }

    setLoading(true);
    setError("");

    const url = categoria ? `/api/categorias/${categoria.id}` : "/api/categorias";
    const method = categoria ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), icon: icon || null, color: color || null, type: type ?? null }),
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
      title={categoria ? "Editar Categoria" : "Nova Categoria"}
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
              form="categoria-form"
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      }
    >
      <form id="categoria-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Alimentação"
            className="w-full px-3 py-2.5 border border-brand-700/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-700 mb-2">Tipo</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: null, label: "Ambos" },
              { value: "income" as const, label: "Receita" },
              { value: "expense" as const, label: "Despesa" },
            ] as const).map(({ value, label }) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => setType(value)}
                className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  type === value
                    ? "bg-brand-50 border-brand-500 text-brand-700"
                    : "bg-surface border-brand-700/30 text-brand-700 hover:bg-brand-700/5"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">
            Ícone (emoji)
          </label>
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="🍔"
            className="w-full px-3 py-2.5 border border-brand-700/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-700 mb-2">
            Cor
          </label>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setColor("")}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                !color ? "border-brand-500 scale-110" : "border-brand-700/20"
              } bg-brand-700/10`}
              title="Sem cor"
            />
            {PRESET_COLORS.map((c) => (
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
          {color && (
            <p className="text-xs text-brand-700/40 mt-1">Selecionada: {color}</p>
          )}
        </div>
      </form>
    </Modal>
  );
}
