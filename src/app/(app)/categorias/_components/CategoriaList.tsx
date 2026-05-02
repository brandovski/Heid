"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { Category } from "@/types/database";
import CategoriaCard from "./CategoriaCard";
import CategoriaModal from "./CategoriaModal";

interface Props {
  initialData: Category[];
}

export default function CategoriaList({ initialData }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const router = useRouter();

  function handleEdit(cat: Category) {
    setEditing(cat);
    setShowModal(true);
  }

  function handleClose() {
    setShowModal(false);
    setEditing(null);
  }

  function handleSaved() {
    handleClose();
    router.refresh();
  }

  const active = initialData.filter((c) => c.is_active);
  const inactive = initialData.filter((c) => !c.is_active);

  const activeIncome = active.filter((c) => c.type === "income");
  const activeExpense = active.filter((c) => c.type === "expense");
  const activeBoth = active.filter((c) => c.type == null);

  return (
    <div>
      <button
        onClick={() => setShowModal(true)}
        className="sm:hidden w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-semibold mb-4 hover:bg-brand-700 transition-colors"
      >
        <Plus size={16} /> Nova Categoria
      </button>
      <div className="hidden sm:flex justify-end mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus size={16} />
          Nova Categoria
        </button>
      </div>

      {active.length === 0 && inactive.length === 0 && (
        <div className="text-center py-12 text-brand-700/40">
          <p>Nenhuma categoria cadastrada ainda.</p>
        </div>
      )}

      {activeIncome.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">Receitas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeIncome.map((cat) => (
              <CategoriaCard key={cat.id} categoria={cat} onEdit={handleEdit} onSaved={handleSaved} />
            ))}
          </div>
        </div>
      )}

      {activeExpense.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">Despesas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeExpense.map((cat) => (
              <CategoriaCard key={cat.id} categoria={cat} onEdit={handleEdit} onSaved={handleSaved} />
            ))}
          </div>
        </div>
      )}

      {activeBoth.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-brand-700/50 uppercase tracking-wider mb-2">Receita ou Despesa</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeBoth.map((cat) => (
              <CategoriaCard key={cat.id} categoria={cat} onEdit={handleEdit} onSaved={handleSaved} />
            ))}
          </div>
        </div>
      )}

      {inactive.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-brand-700/40 mb-3">Arquivadas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {inactive.map((cat) => (
              <CategoriaCard
                key={cat.id}
                categoria={cat}
                onEdit={handleEdit}
                onSaved={handleSaved}
              />
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <CategoriaModal
          categoria={editing}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
