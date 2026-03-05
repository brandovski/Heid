"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import type { FixedIncome, FixedExpense, Category, CreditCard } from "@/types/database";
import FixaCard from "./FixaCard";
import FixaModal from "./FixaModal";

export type FixaTab = "receitas" | "despesas";
type FixaItem = FixedIncome | FixedExpense;

interface Props {
  receitas: FixedIncome[];
  despesas: FixedExpense[];
  categorias: Pick<Category, "id" | "name" | "icon" | "color" | "type">[];
  cartoes: Pick<CreditCard, "id" | "name" | "brand">[];
}

export default function FixaList({
  receitas,
  despesas,
  categorias,
  cartoes,
}: Props) {
  const [tab, setTab] = useState<FixaTab>("receitas");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FixaItem | null>(null);
  const router = useRouter();

  function handleEdit(item: FixaItem) {
    setEditing(item);
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

  const items = tab === "receitas" ? receitas : despesas;
  const active = items.filter((i) => i.is_active);
  const inactive = items.filter((i) => !i.is_active);

  const receitasAtivas = receitas.filter((r) => r.is_active).length;
  const despesasAtivas = despesas.filter((d) => d.is_active).length;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-full sm:w-fit">
        <button
          onClick={() => setTab("receitas")}
          className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "receitas"
              ? "bg-white text-green-700 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <TrendingUp size={16} />
          Receitas ({receitasAtivas})
        </button>
        <button
          onClick={() => setTab("despesas")}
          className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "despesas"
              ? "bg-white text-red-700 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <TrendingDown size={16} />
          Despesas ({despesasAtivas})
        </button>
      </div>

      {/* Botão de ação */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus size={16} />
          {tab === "receitas" ? "Nova Receita" : "Nova Despesa"}
        </button>
      </div>

      {/* Lista */}
      {active.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>
            Nenhum
            {tab === "receitas" ? "a receita" : "a despesa"} recorrente cadastrada.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {active.map((item) => (
          <FixaCard
            key={item.id}
            item={item}
            tab={tab}
            categorias={categorias}
            onEdit={handleEdit}
            onSaved={handleSaved}
          />
        ))}
      </div>

      {inactive.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-gray-400 mb-3">
            Desativadas
          </h2>
          <div className="space-y-2">
            {inactive.map((item) => (
              <FixaCard
                key={item.id}
                item={item}
                tab={tab}
                categorias={categorias}
                onEdit={handleEdit}
                onSaved={handleSaved}
              />
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <FixaModal
          item={editing}
          tab={tab}
          categorias={categorias}
          cartoes={cartoes}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
