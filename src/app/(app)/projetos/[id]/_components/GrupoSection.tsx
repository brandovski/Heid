"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, MoreHorizontal, Plus } from "lucide-react";
import ItemCard from "./ItemCard";
import type { ProjectGroupWithItems, ProjectItemWithRelations, ProjectGroup, ProjectItem } from "../../_components/types";
import { formatCurrency } from "../../_components/types";

interface CreditCard { id: string; name: string; brand: string; }

interface Props {
  group: ProjectGroupWithItems;
  groups: ProjectGroup[];
  creditCards: CreditCard[];
  projectId: string;
  onEditGroup: (g: ProjectGroup) => void;
  onDeleteGroup: (id: string) => void;
  onAddItem: (groupId: string) => void;
  onEditItem: (item: ProjectItemWithRelations) => void;
  onConfirmItem: (item: ProjectItemWithRelations) => void;
  onPayItem: (item: ProjectItemWithRelations, date: string) => Promise<void>;
  onCancelItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
}

export default function GrupoSection({
  group,
  groups,
  creditCards,
  projectId,
  onEditGroup,
  onDeleteGroup,
  onAddItem,
  onEditItem,
  onConfirmItem,
  onPayItem,
  onCancelItem,
  onDeleteItem,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const activeItems = group.items.filter((i) => i.status !== "cancelled");
  const subtotal = activeItems.reduce((s, i) => s + (i.budget_amount ?? 0), 0);

  return (
    <div className="border border-brand-700/20 rounded-xl">
      {/* Group header */}
      <div className={`flex items-center gap-2 px-4 py-3 bg-brand-700/5 rounded-t-xl${!expanded ? " rounded-b-xl" : ""}`}>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-brand-700/40 hover:text-brand-700/70 transition-colors"
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        <span className="flex-1 text-sm font-semibold text-brand-700">{group.name}</span>

        {subtotal > 0 && (
          <span className="text-xs text-brand-700/50 mr-1">{formatCurrency(subtotal)}</span>
        )}

        <button
          type="button"
          onClick={() => onAddItem(group.id)}
          className="p-1.5 rounded-lg text-brand-700/40 hover:text-brand-600 hover:bg-brand-50 transition-colors"
          title="Adicionar item"
        >
          <Plus size={15} />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded-lg text-brand-700/40 hover:text-brand-700/70 hover:bg-brand-700/10 transition-colors"
          >
            <MoreHorizontal size={15} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-40 bg-surface rounded-xl shadow-lg border border-brand-700/10 py-1">
                <button
                  onClick={() => { setMenuOpen(false); onEditGroup(group); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-brand-700 hover:bg-brand-700/5"
                >
                  Editar grupo
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDeleteGroup(group.id); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-brand-700/5"
                >
                  Excluir grupo
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Items */}
      {expanded && (
        <div>
          {group.items.length === 0 ? (
            <div className="px-4 py-4 text-center text-sm text-brand-700/40">
              Nenhum item. <button type="button" onClick={() => onAddItem(group.id)} className="text-brand-600 hover:underline">Adicionar</button>
            </div>
          ) : (
            <div className="divide-y divide-brand-700/5">
              {group.items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  groups={groups}
                  creditCards={creditCards}
                  projectId={projectId}
                  onEdit={onEditItem}
                  onConfirm={onConfirmItem}
                  onPay={onPayItem}
                  onCancel={onCancelItem}
                  onDelete={onDeleteItem}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
