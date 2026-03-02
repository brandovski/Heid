"use client";

import { useState } from "react";
import { Plus, CheckCircle } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import GrupoSection from "./GrupoSection";
import GrupoModal from "./GrupoModal";
import ItemModal from "./ItemModal";
import ProjetoModal from "../../_components/ProjetoModal";
import type {
  Project,
  ProjectGroup,
  ProjectItem,
  ProjectGroupWithItems,
  ProjectItemWithRelations,
} from "../../_components/types";
import {
  formatCurrency,
  STATUS_LABELS,
  STATUS_COLORS,
} from "../../_components/types";
import type { Investment } from "@/app/(app)/investimentos/_components/types";

interface CreditCard { id: string; name: string; brand: string; color: string | null; }

interface Props {
  project: Project;
  groups: ProjectGroupWithItems[];
  creditCards: CreditCard[];
  eligibleInvestments: Investment[];
}

type ModalState =
  | { type: "none" }
  | { type: "projeto" }
  | { type: "grupo"; group?: ProjectGroup }
  | { type: "item"; item?: ProjectItemWithRelations; defaultGroupId?: string; mode?: "create" | "edit" | "confirm" };

export default function ProjetoDetalhe({
  project: initialProject,
  groups: initialGroups,
  creditCards,
  eligibleInvestments,
}: Props) {
  const [project, setProject] = useState<Project>(initialProject);
  const [groups, setGroups] = useState<ProjectGroupWithItems[]>(initialGroups);
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Compute summary stats
  const allItems = groups.flatMap((g) => g.items);
  const activeItems = allItems.filter((i) => i.status !== "cancelled");
  const paidItems = allItems.filter((i) => i.status === "paid");
  const budgetPrevisto = activeItems.reduce((s, i) => s + (i.budget_amount ?? 0), 0);
  const gastoReal = paidItems.reduce((s, i) => s + (i.actual_amount ?? 0), 0);
  const saldoEstimado = project.total_budget - budgetPrevisto;
  const saldoReal = project.total_budget - gastoReal;

  // Banner: all non-cancelled items are paid
  const nonCancelled = allItems.filter((i) => i.status !== "cancelled");
  const allPaid = nonCancelled.length > 0 && nonCancelled.every((i) => i.status === "paid");

  async function handleStatusChange(status: "active" | "completed" | "cancelled") {
    const res = await fetch(`/api/projetos/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProject((p) => ({ ...p, ...updated }));
    }
  }

  function handleGrupoSaved(group: ProjectGroup) {
    setGroups((prev) => {
      const exists = prev.find((g) => g.id === group.id);
      if (exists) {
        return prev.map((g) => g.id === group.id ? { ...g, ...group } : g);
      }
      return [...prev, { ...group, items: [] }];
    });
  }

  function handleDeleteGroup(id: string) {
    setPendingDeleteId(id);
  }

  async function doDeleteGroup() {
    if (!pendingDeleteId) return;
    const res = await fetch(`/api/projetos/grupos/${pendingDeleteId}`, { method: "DELETE" });
    if (res.ok) {
      setGroups((prev) => prev.filter((g) => g.id !== pendingDeleteId));
    }
    setPendingDeleteId(null);
  }

  function handleItemSaved(item: ProjectItem) {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== item.project_group_id) return g;
        const exists = g.items.find((i) => i.id === item.id);
        if (exists) {
          return { ...g, items: g.items.map((i) => i.id === item.id ? { ...i, ...item } : i) };
        }
        return { ...g, items: [...g.items, item as ProjectItemWithRelations] };
      })
    );
  }

  async function handlePayItem(item: ProjectItemWithRelations) {
    const res = await fetch(`/api/projetos/itens/${item.id}/pagar`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          items: g.items.map((i) => {
            if (i.id !== item.id) return i;
            if (data.step === "deposit") {
              return { ...i, deposit_transaction_id: data.deposit_transaction_id };
            }
            return { ...i, status: "paid" as const };
          }),
        }))
      );
    }
  }

  async function handleCancelItem(id: string) {
    const res = await fetch(`/api/projetos/itens/${id}`, { method: "DELETE" });
    if (res.ok) {
      const updated = await res.json();
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          items: g.items.map((i) => i.id === id ? { ...i, status: updated.status } : i),
        }))
      );
    }
  }

  async function handleDeleteItem(id: string) {
    const res = await fetch(`/api/projetos/itens/${id}?permanent=true`, { method: "DELETE" });
    if (res.ok) {
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          items: g.items.filter((i) => i.id !== id),
        }))
      );
    }
  }

  const plainGroups: ProjectGroup[] = groups.map(({ items: _items, ...g }) => g);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[project.status]}`}>
              {STATUS_LABELS[project.status]}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
              {project.scope === "family" ? "Familiar" : "Pessoal"}
            </span>
          </div>
          {project.description && (
            <p className="text-sm text-gray-500 mt-1">{project.description}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setModal({ type: "projeto" })}
            className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Editar
          </button>
          {project.status === "active" && (
            <button
              type="button"
              onClick={() => handleStatusChange("completed")}
              className="px-3 py-1.5 text-sm text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
            >
              Concluir
            </button>
          )}
        </div>
      </div>

      {/* Completion banner */}
      {allPaid && project.status === "active" && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle size={18} className="text-green-600 shrink-0" />
          <p className="text-sm text-green-800 flex-1">
            Todos os itens foram pagos. Deseja marcar o projeto como concluído?
          </p>
          <button
            type="button"
            onClick={() => handleStatusChange("completed")}
            className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            Concluir
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Orçamento Total</p>
          <p className="text-base font-bold text-gray-900">{formatCurrency(project.total_budget)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Previsto</p>
          <p className="text-base font-bold text-gray-900">{formatCurrency(budgetPrevisto)}</p>
          <p className={`text-xs mt-0.5 ${saldoEstimado < 0 ? "text-red-500" : "text-gray-400"}`}>
            Saldo: {formatCurrency(saldoEstimado)}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Gasto Real</p>
          <p className="text-base font-bold text-gray-900">{formatCurrency(gastoReal)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Saldo Real</p>
          <p className={`text-base font-bold ${saldoReal < 0 ? "text-red-600" : "text-green-700"}`}>
            {formatCurrency(saldoReal)}
          </p>
        </div>
      </div>

      {/* Groups */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Grupos de Gasto</h2>
          <button
            type="button"
            onClick={() => setModal({ type: "grupo" })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors"
          >
            <Plus size={14} />
            Adicionar grupo
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-sm">Nenhum grupo ainda.</p>
            <button
              type="button"
              onClick={() => setModal({ type: "grupo" })}
              className="mt-2 text-sm text-brand-600 hover:underline"
            >
              Criar primeiro grupo
            </button>
          </div>
        ) : (
          groups.map((group) => (
            <GrupoSection
              key={group.id}
              group={group}
              groups={plainGroups}
              creditCards={creditCards}
              projectId={project.id}
              onEditGroup={(g) => setModal({ type: "grupo", group: g })}
              onDeleteGroup={handleDeleteGroup}
              onAddItem={(groupId) => setModal({ type: "item", defaultGroupId: groupId })}
              onEditItem={(item) => setModal({ type: "item", item, mode: "edit" })}
              onConfirmItem={(item) => setModal({ type: "item", item, mode: "confirm" })}
              onPayItem={handlePayItem}
              onCancelItem={handleCancelItem}
              onDeleteItem={handleDeleteItem}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {modal.type === "projeto" && (
        <ProjetoModal
          project={project}
          onClose={() => setModal({ type: "none" })}
          onSaved={() => window.location.reload()}
        />
      )}

      {modal.type === "grupo" && (
        <GrupoModal
          projectId={project.id}
          group={modal.group}
          onClose={() => setModal({ type: "none" })}
          onSaved={(g) => { handleGrupoSaved(g); setModal({ type: "none" }); }}
        />
      )}

      {modal.type === "item" && (
        <ItemModal
          projectId={project.id}
          groups={plainGroups}
          creditCards={creditCards}
          eligibleInvestments={eligibleInvestments}
          item={modal.item}
          defaultGroupId={modal.defaultGroupId}
          mode={modal.mode}
          onClose={() => setModal({ type: "none" })}
          onSaved={(item) => { handleItemSaved(item); setModal({ type: "none" }); }}
        />
      )}

      <ConfirmModal
        isOpen={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={doDeleteGroup}
        title="Excluir grupo"
        description="Excluir este grupo e todos os seus itens? Esta ação não pode ser desfeita."
        confirmLabel="Excluir grupo"
        variant="danger"
      />
    </div>
  );
}
