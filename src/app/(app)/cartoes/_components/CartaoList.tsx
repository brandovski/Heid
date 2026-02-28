"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { CreditCard } from "@/types/database";
import CartaoCard from "./CartaoCard";
import CartaoModal from "./CartaoModal";
import FaturaDetalheModal from "./FaturaDetalheModal";

interface Props {
  initialData: CreditCard[];
}

export default function CartaoList({ initialData }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CreditCard | null>(null);
  const [viewingFatura, setViewingFatura] = useState<CreditCard | null>(null);
  const router = useRouter();

  function handleEdit(cartao: CreditCard) {
    setEditing(cartao);
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

  function handleViewFatura(cartao: CreditCard) {
    setViewingFatura(cartao);
  }

  const active = initialData.filter((c) => c.is_active);
  const inactive = initialData.filter((c) => !c.is_active);

  return (
    <div>
      <button
        onClick={() => setShowModal(true)}
        className="sm:hidden w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-semibold mb-4 hover:bg-brand-700 transition-colors"
      >
        <Plus size={16} /> Novo Cartão
      </button>
      <div className="hidden sm:flex justify-end mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus size={16} />
          Novo Cartão
        </button>
      </div>

      {active.length === 0 && inactive.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>Nenhum cartão cadastrado ainda.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {active.map((cartao) => (
          <CartaoCard
            key={cartao.id}
            cartao={cartao}
            onEdit={handleEdit}
            onSaved={handleSaved}
            onViewFatura={handleViewFatura}
          />
        ))}
      </div>

      {inactive.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-gray-400 mb-3">Desativados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactive.map((cartao) => (
              <CartaoCard
                key={cartao.id}
                cartao={cartao}
                onEdit={handleEdit}
                onSaved={handleSaved}
                onViewFatura={handleViewFatura}
              />
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <CartaoModal
          cartao={editing}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}

      {viewingFatura && (
        <FaturaDetalheModal
          isOpen
          onClose={() => setViewingFatura(null)}
          cartao={viewingFatura}
        />
      )}
    </div>
  );
}
