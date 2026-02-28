"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Target } from "lucide-react";
import ProgressBar from "@/components/ui/ProgressBar";
import type { ProjectWithStats } from "./types";
import {
  formatCurrency,
  formatDate,
  STATUS_LABELS,
  STATUS_COLORS,
} from "./types";

interface Props {
  project: ProjectWithStats;
  onEdit: (p: ProjectWithStats) => void;
  onStatusChange: (id: string, status: "completed" | "cancelled" | "active") => void;
}

export default function ProjetoCard({ project, onEdit, onStatusChange }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isOver = project.gasto_real > project.total_budget;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-2 bg-brand-50 rounded-lg shrink-0">
          <Target size={16} className="text-brand-600" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Row 1 */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/projetos/${project.id}`}
              className="text-sm font-semibold text-gray-900 hover:text-brand-600 transition-colors truncate"
            >
              {project.name}
            </Link>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[project.status]}`}>
              {STATUS_LABELS[project.status]}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
              {project.scope === "family" ? "Familiar" : "Pessoal"}
            </span>
          </div>

          {/* Row 2 */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {formatCurrency(project.gasto_real)} gastos de {formatCurrency(project.total_budget)}
              </span>
              {project.target_date && (
                <span>Alvo: {formatDate(project.target_date)}</span>
              )}
            </div>
            <ProgressBar
              value={project.progresso}
              color={isOver ? "red" : "blue"}
            />
          </div>
        </div>

        {/* Actions menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <MoreHorizontal size={16} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1">
                <button
                  onClick={() => { setMenuOpen(false); onEdit(project); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Editar
                </button>
                {project.status === "active" && (
                  <>
                    <button
                      onClick={() => { setMenuOpen(false); onStatusChange(project.id, "completed"); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-green-700 hover:bg-gray-50"
                    >
                      Concluir
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); onStatusChange(project.id, "cancelled"); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </>
                )}
                {project.status !== "active" && (
                  <button
                    onClick={() => { setMenuOpen(false); onStatusChange(project.id, "active"); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-brand-600 hover:bg-gray-50"
                  >
                    Reativar
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
