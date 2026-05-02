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
      : "bg-brand-50 text-brand-700";
  const amountColor = tab === "receitas" ? "text-green-600" : "text-red-600";

  return (
    <div
      className={`px-4 py-3 rounded-xl border ${
        item.is_active
          ? "bg-surface border-brand-700/20"
          : "bg-brand-700/5 border-brand-700/10 opacity-60"
      }`}
    >
      {/* Linha 1: ícone + descrição + valor */}
      <div className="flex items-center gap-3">
        <span className="text-lg shrink-0 w-7 text-center">
          {categoria?.icon ?? "📁"}
        </span>
        <p className="flex-1 text-sm font-medium text-brand-700 truncate">
          {item.description}
        </p>
        <span className={`text-sm font-semibold shrink-0 ${amountColor}`}>
          {item.amount.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </span>
      </div>

      {/* Linha 2: metadata + badge + ações */}
      <div className="flex items-center gap-2 mt-1.5 ml-10">
        <p className="flex-1 text-xs text-brand-700/40 truncate">
          Dia {item.day_of_month}
          {categoria ? ` · ${categoria.name}` : ""}
        </p>
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${scopeColor}`}>
          {scopeLabel}
        </span>
        <div className="flex items-center gap-0.5 shrink-0">
          {item.is_active && (
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-lg text-brand-700/40 hover:text-brand-700/70 hover:bg-brand-700/10 transition-colors"
              title="Editar"
            >
              <Pencil size={14} />
            </button>
          )}
          <button
            onClick={handleToggleActive}
            className="p-1.5 rounded-lg text-brand-700/40 hover:text-brand-700/70 hover:bg-brand-700/10 transition-colors"
            title={item.is_active ? "Desativar" : "Reativar"}
          >
            {item.is_active ? <PowerOff size={14} /> : <RotateCcw size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
