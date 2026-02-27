import type { InstallmentGroup, Scope } from "@/types/database";

export interface InstallmentGroupWithRelations extends InstallmentGroup {
  credit_card: { id: string; name: string; brand: string } | null;
  category: { id: string; name: string; icon: string | null; color: string | null } | null;
}

export interface InstallmentSummary {
  total: number;
  paid: number;
  pending: number;
  cancelled: number;
  amountPaid: number;
  amountPending: number;
  nextDate: string | null; // next pending date
}

export function computeSummary(
  transactions: Array<{ id: string; status: string; amount: number; date: string; installment_group_id: string | null }>,
  groupId: string
): InstallmentSummary {
  const mine = transactions.filter((t) => t.installment_group_id === groupId);
  const paid = mine.filter((t) => t.status === "paid");
  const pending = mine.filter((t) => t.status === "pending").sort((a, b) => a.date.localeCompare(b.date));
  const cancelled = mine.filter((t) => t.status === "cancelled");
  return {
    total: mine.length,
    paid: paid.length,
    pending: pending.length,
    cancelled: cancelled.length,
    amountPaid: paid.reduce((s, t) => s + t.amount, 0),
    amountPending: pending.reduce((s, t) => s + t.amount, 0),
    nextDate: pending[0]?.date ?? null,
  };
}

export function groupStatus(summary: InstallmentSummary): "done" | "cancelled" | "active" {
  if (summary.pending === 0 && summary.paid > 0) return "done";
  if (summary.pending === 0 && summary.paid === 0) return "cancelled";
  return "active";
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export type { Scope };
