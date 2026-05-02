"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import ProjetoCard from "./ProjetoCard";
import ProjetoModal from "./ProjetoModal";
import type { ProjectWithStats, Project } from "./types";
import { formatCurrency } from "./types";

type FilterTab = "active" | "completed" | "cancelled" | "all";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "active", label: "Ativos" },
  { key: "completed", label: "Concluídos" },
  { key: "cancelled", label: "Cancelados" },
  { key: "all", label: "Todos" },
];

interface Props {
  initialProjects: ProjectWithStats[];
}

export default function ProjetoList({ initialProjects }: Props) {
  const [projects, setProjects] = useState<ProjectWithStats[]>(initialProjects);
  const [tab, setTab] = useState<FilterTab>("active");
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();

  const filtered = tab === "all" ? projects : projects.filter((p) => p.status === tab);
  const activeProjects = projects.filter((p) => p.status === "active");
  const totalBudget = activeProjects.reduce((s, p) => s + p.total_budget, 0);

  async function handleStatusChange(id: string, status: "completed" | "cancelled" | "active") {
    const res = await fetch(`/api/projetos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );
  }

  function handleSaved() {
    // Reload page to get fresh data
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      {/* Mobile full-width button */}
      <button
        type="button"
        onClick={() => { setEditingProject(undefined); setShowModal(true); }}
        className="sm:hidden w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
      >
        <Plus size={16} /> Novo Projeto
      </button>

      {/* Header desktop */}
      <div className="hidden sm:flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-700">Projetos</h1>
          {activeProjects.length > 0 && (
            <p className="text-sm text-brand-700/50 mt-0.5">
              {activeProjects.length} ativo{activeProjects.length !== 1 ? "s" : ""} ·{" "}
              {formatCurrency(totalBudget)} orçados
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => { setEditingProject(undefined); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          <Plus size={16} />
          Novo Projeto
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-700/10 rounded-xl p-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
              tab === key
                ? "bg-surface text-brand-700 shadow-sm"
                : "text-brand-700/50 hover:text-brand-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-brand-700/40">
          <p className="text-sm">Nenhum projeto encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((project) => (
            <ProjetoCard
              key={project.id}
              project={project}
              onEdit={(p) => { setEditingProject(p); setShowModal(true); }}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {showModal && (
        <ProjetoModal
          project={editingProject}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
