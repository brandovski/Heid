"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Copy } from "lucide-react";
import OrcamentoCard from "./OrcamentoCard";
import OrcamentoModal from "./OrcamentoModal";
import {
  BudgetEntry,
  BudgetWithStats,
  TransactionRow,
  computeStats,
  formatCurrency,
  formatMonth,
  shiftMonth,
} from "./types";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface Props {
  budgets: BudgetEntry[];
  transactions: TransactionRow[];
  categories: Category[];
  currentMonth: string;
  userId: string;
}

export default function OrcamentoList({
  budgets,
  transactions,
  categories,
  currentMonth,
  userId,
}: Props) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetWithStats | null>(null);
  const [cloning, setCloning] = useState(false);
  const [cloneError, setCloneError] = useState("");

  // Computa stats para cada budget
  const budgetsWithStats: BudgetWithStats[] = budgets.map((b) =>
    computeStats(b, transactions)
  );

  // Totais do mês
  const totalPlanned = budgetsWithStats.reduce((s, b) => s + b.planned_amount, 0);
  const totalSpent = budgetsWithStats.reduce((s, b) => s + b.stats.spent, 0);
  const totalCommitted = budgetsWithStats.reduce((s, b) => s + b.stats.committed, 0);
  const totalAvailable = totalPlanned - totalSpent - totalCommitted;

  // Categorias já orçadas neste mês
  const budgetedCategoryIds = new Set(budgets.map((b) => b.category_id));

  function navigate(delta: number) {
    const newMonth = shiftMonth(currentMonth, delta);
    router.push(`/orcamento?mes=${newMonth}`);
  }

  function openCreate() {
    setEditing(null);
    setIsModalOpen(true);
  }

  function openEdit(budget: BudgetWithStats) {
    setEditing(budget);
    setIsModalOpen(true);
  }

  async function handleClone() {
    setCloning(true);
    setCloneError("");
    try {
      const res = await fetch("/api/orcamento/clonar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference_month: currentMonth, scope: "personal" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao clonar");
      router.refresh();
    } catch (err) {
      setCloneError(err instanceof Error ? err.message : "Erro ao clonar");
    } finally {
      setCloning(false);
    }
  }

  const isEmpty = budgetsWithStats.length === 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Orçamento Pessoal</h1>
      </div>

      {/* Navegação de mês */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-base font-semibold text-gray-800 capitalize">
          {formatMonth(currentMonth)}
        </span>
        <button
          onClick={() => navigate(1)}
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Card de totais */}
      {!isEmpty && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Planejado", value: totalPlanned, color: "text-gray-900" },
            { label: "Pago", value: totalSpent, color: "text-green-600" },
            { label: "Comprometido", value: totalCommitted, color: "text-amber-600" },
            {
              label: "Disponível",
              value: totalAvailable,
              color: totalAvailable < 0 ? "text-red-600" : "text-brand-600",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-gray-100 p-3 text-center"
            >
              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
              <p className={`text-sm font-bold ${color}`}>{formatCurrency(value)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {isEmpty ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <p className="text-gray-500 text-sm mb-1">
            Nenhum orçamento para{" "}
            <span className="font-medium capitalize">{formatMonth(currentMonth)}</span>
          </p>
          <p className="text-gray-400 text-xs mb-6">
            Crie do zero ou clone os valores do mês anterior
          </p>
          {cloneError && (
            <p className="text-xs text-red-600 mb-3">{cloneError}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleClone}
              disabled={cloning}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors disabled:opacity-50"
            >
              <Copy size={15} />
              {cloning ? "Clonando..." : "Clonar do mês anterior"}
            </button>
            <button
              onClick={openCreate}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors"
            >
              <Plus size={15} />
              Criar do zero
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Lista de cards */}
          <div className="space-y-3">
            {budgetsWithStats.map((b) => (
              <OrcamentoCard key={b.id} budget={b} onEdit={openEdit} />
            ))}
          </div>

          {/* Botão adicionar categoria */}
          <button
            onClick={openCreate}
            disabled={budgetedCategoryIds.size >= categories.length}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-500 border-2 border-dashed border-gray-200 rounded-xl hover:border-brand-300 hover:text-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            Adicionar categoria
          </button>
        </>
      )}

      <OrcamentoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditing(null);
        }}
        editing={editing}
        referenceMonth={currentMonth}
        categories={categories}
        budgetedCategoryIds={budgetedCategoryIds}
      />
    </div>
  );
}
