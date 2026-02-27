import type { Subscription } from "@/types/database";

export interface SubscriptionWithRelations extends Subscription {
  credit_card: { id: string; name: string; brand: string } | null;
  category: { id: string; name: string; icon: string | null; color: string | null } | null;
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
