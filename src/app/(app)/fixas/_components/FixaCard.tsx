"use client";

import { Pencil, PowerOff, RotateCcw } from "lucide-react";
import type { FixedIncome, FixedExpense, Category } from "@/types/database";
import type { FixaTab } from "./FixaList";

type FixaItem = FixedIncome | FixedExpense;

interface Props {
  item: FixaItem;
  tab: FixaTab;
  categorias: Pick<Category, "id" | "name" | "icon">[];
  onEdit: (item: FixaItem) => void;
  onSaved: () => void;
}

export default function FixaCard({ item, tab, categorias, onEdit, onSaved }: Props) {
  const categoria = categorias.find((c) => c.id === item.category_id);

  async function handleToggleActive() {
    const path = tab === "receitas" ? "receitas-fixas" : "despesas-fixas";
    await fetch(`/api/${path}/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !item.is_active }),
    });
    onSaved();
  }

  const scopeLabel = item.scope === "personal" ? "Pessoal" : "Familiar";
  const scopeColor =
    item.scope === "personal"
      ? "bg-purple-50 text-purple-700"
      : "bg-blue-50 text-blue-700";
  const amountColor = tab === "receitas" ? "text-green-600" : "text-red-600";

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
        item.is_active
          ? "bg-white border-gray-200"
          : "bg-gray-50 border-gray-100 opacity-60"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {categoria && (
          <span className="text-lg shrink-0">{categoria.icon ?? "📁"}</span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {item.description}
          </p>
          <p className="text-xs text-gray-400">
            Dia {item.day_of_month}
            {categoria ? ` · ${categoria.name}` : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-3">
        <span className={`text-sm font-semibold ${amountColor}`}>
          {item.amount.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${scopeColor}`}
        >
          {scopeLabel}
        </span>
        <div className="flex items-center gap-1">
          {item.is_active && (
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Editar"
            >
              <Pencil size={14} />
            </button>
          )}
          <button
            onClick={handleToggleActive}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title={item.is_active ? "Desativar" : "Reativar"}
          >
            {item.is_active ? <PowerOff size={14} /> : <RotateCcw size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
