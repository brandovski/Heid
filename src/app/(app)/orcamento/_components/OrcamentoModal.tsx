"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import { BudgetEntry, BudgetWithStats } from "./types";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editing: BudgetWithStats | null;
  referenceMonth: string;
  categories: Category[];
  budgetedCategoryIds: Set<string>;
}

export default function OrcamentoModal({
  isOpen,
  onClose,
  editing,
  referenceMonth,
  categories,
  budgetedCategoryIds,
}: Props) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState("");
  const [plannedAmount, setPlannedAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editing) {
      setCategoryId(editing.category_id);
      setPlannedAmount(String(editing.planned_amount));
      setNotes(editing.notes ?? "");
    } else {
      setCategoryId("");
      setPlannedAmount("");
      setNotes("");
    }
    setError("");
  }, [editing, isOpen]);

  // Categorias disponíveis para criação (exclui as já orçadas, exceto a que está sendo editada)
  const availableCategories = categories.filter(
    (c) => !budgetedCategoryIds.has(c.id) || c.id === editing?.category_id
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (editing) {
        const res = await fetch(`/api/orcamento/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planned_amount: parseFloat(plannedAmount),
            notes: notes || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Erro ao salvar");
        }
      } else {
        const res = await fetch("/api/orcamento", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference_month: referenceMonth,
            category_id: categoryId,
            planned_amount: parseFloat(plannedAmount),
            notes: notes || null,
            scope: "personal",
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Erro ao criar");
        }
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <Modal
      onClose={onClose}
      title={editing ? "Editar orçamento" : "Adicionar categoria"}
      footer={
        <>
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="orcamento-form"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Salvando..." : editing ? "Salvar" : "Adicionar"}
            </button>
          </div>
        </>
      }
    >
      <form id="orcamento-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoria
          </label>
          {editing ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
              <span>{editing.category?.icon}</span>
              <span className="text-sm text-gray-700">{editing.category?.name}</span>
            </div>
          ) : (
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Selecionar categoria...</option>
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon ? `${c.icon} ` : ""}{c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Valor planejado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor planejado (R$)
          </label>
          <input
            type="number"
            value={plannedAmount}
            onChange={(e) => setPlannedAmount(e.target.value)}
            required
            min="0.01"
            step="0.01"
            placeholder="0,00"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Observações..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}
