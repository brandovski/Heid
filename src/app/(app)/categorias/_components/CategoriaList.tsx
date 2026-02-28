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

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus size={16} />
          Nova Categoria
        </button>
      </div>

      {active.length === 0 && inactive.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>Nenhuma categoria cadastrada ainda.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {active.map((cat) => (
          <CategoriaCard
            key={cat.id}
            categoria={cat}
            onEdit={handleEdit}
            onSaved={handleSaved}
          />
        ))}
      </div>

      {inactive.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-gray-400 mb-3">Arquivadas</h2>
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
