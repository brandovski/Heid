"use client";

import { useState } from "react";
import { Archive, Pencil, RotateCcw, Trash2 } from "lucide-react";
import type { Category } from "@/types/database";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface Props {
  categoria: Category;
  onEdit: (cat: Category) => void;
  onSaved: () => void;
}

export default function CategoriaCard({ categoria, onEdit, onSaved }: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleToggleActive() {
    await fetch(`/api/categorias/${categoria.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !categoria.is_active }),
    });
    onSaved();
  }

  async function handleDelete() {
    const res = await fetch(`/api/categorias/${categoria.id}`, { method: "DELETE" });
    if (res.ok) {
      onSaved();
    } else {
      const { error } = await res.json();
      setDeleteError(error ?? "Erro ao excluir");
    }
    setShowDeleteConfirm(false);
  }

  const typeLabel = categoria.type === "income" ? "Receita" : categoria.type === "expense" ? "Despesa" : null;
  const typeBadgeClass = categoria.type === "income"
    ? "bg-green-50 text-green-700"
    : categoria.type === "expense"
    ? "bg-red-50 text-red-700"
    : null;

  return (
    <>
    <div
      className={`flex items-center justify-between p-4 rounded-xl border ${
        categoria.is_active
          ? "bg-surface border-brand-700/20"
          : "bg-brand-700/5 border-brand-700/10 opacity-60"
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
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-medium text-brand-700">{categoria.name}</p>
            {typeLabel && typeBadgeClass && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${typeBadgeClass}`}>
                {typeLabel}
              </span>
            )}
          </div>
          {categoria.color && (
            <div className="flex items-center gap-1 mt-0.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: categoria.color }}
              />
              <span className="text-xs text-brand-700/40">{categoria.color}</span>
            </div>
          )}
          {deleteError && (
            <p className="text-xs text-red-500 mt-0.5">{deleteError}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {categoria.is_active && (
          <button
            onClick={() => onEdit(categoria)}
            className="p-1.5 rounded-lg text-brand-700/40 hover:text-brand-700/70 hover:bg-brand-700/10 transition-colors"
            title="Editar"
          >
            <Pencil size={15} />
          </button>
        )}
        <button
          onClick={handleToggleActive}
          className="p-1.5 rounded-lg text-brand-700/40 hover:text-brand-700/70 hover:bg-brand-700/10 transition-colors"
          title={categoria.is_active ? "Arquivar" : "Reativar"}
        >
          {categoria.is_active ? <Archive size={15} /> : <RotateCcw size={15} />}
        </button>
        {!categoria.is_active && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 rounded-lg text-brand-700/40 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Excluir permanentemente"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>

    <ConfirmModal
      isOpen={showDeleteConfirm}
      onClose={() => setShowDeleteConfirm(false)}
      onConfirm={handleDelete}
      title="Excluir categoria"
      description={`Excluir permanentemente a categoria "${categoria.name}"? Esta ação não pode ser desfeita.`}
      confirmLabel="Excluir"
      variant="danger"
    />
    </>
  );
}
