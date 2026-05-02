"use client";

import ProgressBar from "@/components/ui/ProgressBar";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BudgetWithStats, formatCurrency } from "./types";

interface Props {
  budget: BudgetWithStats;
  onEdit: (budget: BudgetWithStats) => void;
}

export default function OrcamentoCard({ budget, onEdit }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { stats, planned_amount, category } = budget;
  const progressValue = Math.min(stats.percentage, 100);
  const color = stats.isOverBudget ? "red" : "blue";

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    await fetch(`/api/orcamento/${budget.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div
      className={`bg-surface rounded-xl border p-4 transition-shadow hover:shadow-sm ${
        stats.isOverBudget ? "border-red-200" : "border-brand-700/10"
      }`}
    >
      {/* Linha 1: ícone + nome + badges + ações */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {category?.icon && (
            <span className="text-xl shrink-0">{category.icon}</span>
          )}
          <span className="font-medium text-brand-700 truncate">
            {category?.name ?? "Categoria"}
          </span>
          {stats.isOverBudget && (
            <span className="shrink-0 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              Acima do limite
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(budget)}
            className="p-1.5 text-brand-700/40 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`p-1.5 rounded-lg transition-colors ${
              confirmDelete
                ? "text-red-600 bg-red-50 hover:bg-red-100"
                : "text-brand-700/40 hover:text-red-600 hover:bg-red-50"
            }`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Barra de progresso */}
      <ProgressBar value={progressValue} color={color} className="mb-2" />

      {/* Linha 2: valores */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-700/50">
        <span>
          <span className="text-brand-700/40">Pago</span>{" "}
          <span className="font-medium text-brand-700">
            {formatCurrency(stats.spent)}
          </span>
        </span>
        {stats.committed > 0 && (
          <span>
            <span className="text-brand-700/40">Comprometido</span>{" "}
            <span className="font-medium text-amber-600">
              {formatCurrency(stats.committed)}
            </span>
          </span>
        )}
        <span className="ml-auto">
          <span className="text-brand-700/40">Planejado</span>{" "}
          <span className={`font-semibold ${stats.isOverBudget ? "text-red-600" : "text-brand-700"}`}>
            {formatCurrency(planned_amount)}
          </span>
        </span>
      </div>

      {/* Confirmação de exclusão */}
      {confirmDelete && (
        <p className="mt-2 text-xs text-red-600">
          Clique em{" "}
          <button
            className="underline font-medium"
            onClick={handleDelete}
            disabled={deleting}
          >
            excluir novamente
          </button>{" "}
          para confirmar, ou{" "}
          <button
            className="underline"
            onClick={() => setConfirmDelete(false)}
          >
            cancele
          </button>
          .
        </p>
      )}
    </div>
  );
}
