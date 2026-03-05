import type { Project, ProjectGroup, ProjectItem } from "@/types/database";

export type { Project, ProjectGroup, ProjectItem };

export interface ProjectItemWithRelations extends ProjectItem {
  credit_card?: { id: string; name: string; brand: string; color: string | null } | null;
}

export interface ProjectGroupWithItems extends ProjectGroup {
  items: ProjectItemWithRelations[];
}

export interface ProjectWithStats extends Project {
  budget_previsto: number;   // soma de budget_amount dos itens não-cancelados
  gasto_real: number;        // soma de actual_amount dos itens paid
  progresso: number;         // 0-100
}

export function computeProjectStats(
  project: Project,
  items: ProjectItem[]
): ProjectWithStats {
  const activeItems = items.filter((i) => i.status !== "cancelled");
  const budget_previsto = activeItems.reduce((s, i) => s + (i.budget_amount ?? 0), 0);
  const depositosParciais = items
    .filter((i) => i.status === "confirmed" && (i.deposit_transaction_id || i.investment_deposit_id))
    .reduce((s, i) => s + (i.deposit_amount ?? 0), 0);
  const gasto_real =
    items.filter((i) => i.status === "paid").reduce((s, i) => s + (i.actual_amount ?? 0), 0) +
    depositosParciais;
  const progresso =
    project.total_budget > 0 ? Math.min((gasto_real / project.total_budget) * 100, 100) : 0;

  return { ...project, budget_previsto, gasto_real, progresso };
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(value: string | null): string {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export const STATUS_LABELS: Record<Project["status"], string> = {
  active: "Ativo",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export const STATUS_COLORS: Record<Project["status"], string> = {
  active: "bg-brand-100 text-brand-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export const ITEM_STATUS_LABELS: Record<ProjectItem["status"], string> = {
  considering: "Em análise",
  confirmed: "Confirmado",
  paid: "Pago",
  cancelled: "Cancelado",
};

export const ITEM_STATUS_COLORS: Record<ProjectItem["status"], string> = {
  considering: "bg-amber-100 text-amber-700",
  confirmed: "bg-brand-100 text-brand-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-400",
};

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  cash: "À Vista",
  card_installment: "Parcelado",
  deposit_remainder: "Sinal + Restante",
};
