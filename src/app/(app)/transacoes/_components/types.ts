import type { Transaction, Category, CreditCard } from "@/types/database";

export type TransactionWithRelations = Transaction & {
  category: Pick<Category, "id" | "name" | "icon" | "color"> | null;
  credit_card: Pick<CreditCard, "id" | "name" | "brand"> | null;
};

export const INCOME_TYPES = [
  "income",
  "fixed_income",
  "investment_withdrawal",
] as const;

export const EXPENSE_TYPES = [
  "expense",
  "fixed_expense",
  "installment",
  "subscription",
  "investment_deposit",
] as const;

export function isIncome(type: string): boolean {
  return INCOME_TYPES.includes(type as (typeof INCOME_TYPES)[number]);
}

export const TYPE_LABELS: Record<string, string> = {
  income: "Receita",
  expense: "Despesa",
  installment: "Parcela",
  subscription: "Assinatura",
  fixed_income: "Fixa",
  fixed_expense: "Fixa",
  investment_deposit: "Aporte",
  investment_withdrawal: "Resgate",
};

export const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function prevMonth(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function nextMonth(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export function formatMonthLabel(mes: string): string {
  const [year, month] = mes.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
