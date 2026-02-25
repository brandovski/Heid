"use client";

import { Archive, Pencil, RotateCcw } from "lucide-react";
import type { Category } from "@/types/database";

interface Props {
  categoria: Category;
  onEdit: (cat: Category) => void;
  onSaved: () => void;
}

export default function CategoriaCard({ categoria, onEdit, onSaved }: Props) {
  async function handleToggleActive() {
    await fetch(`/api/categorias/${categoria.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !categoria.is_active }),
    });
    onSaved();
  }

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border ${
        categoria.is_active
          ? "bg-white border-gray-200"
          : "bg-gray-50 border-gray-100 opacity-60"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
          style={{
            backgroundColor: categoria.color ? `${categoria.color}25` : "#f3f4f6",
          }}
        >
          {categoria.icon ?? "📁"}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{categoria.name}</p>
          {categoria.color && (
            <div className="flex items-center gap-1 mt-0.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: categoria.color }}
              />
              <span className="text-xs text-gray-400">{categoria.color}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {categoria.is_active && (
          <button
            onClick={() => onEdit(categoria)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Editar"
          >
            <Pencil size={15} />
          </button>
        )}
        <button
          onClick={handleToggleActive}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title={categoria.is_active ? "Arquivar" : "Reativar"}
        >
          {categoria.is_active ? <Archive size={15} /> : <RotateCcw size={15} />}
        </button>
      </div>
    </div>
  );
}
