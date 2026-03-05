import type { Transaction, Category, CreditCard } from "@/types/database";

export type TransactionWithRelations = Transaction & {
  category: Pick<Category, "id" | "name" | "icon" | "color"> | null;
  credit_card: Pick<CreditCard, "id" | "name" | "brand" | "color"> | null;
};

export interface InvoicePaymentSimple {
  id: string;
  credit_card_id: string;
  amount_paid: number;
  paid_at: string;
}

export interface FaturaGrupo {
  cartaoId: string;
  cartaoNome: string;
  cartaoBrand: string;
  cartaoColor: string | null;
  transactions: TransactionWithRelations[];
  total: number;
  isPaid: boolean;
  payment: InvoicePaymentSimple | null;
}

export const INCOME_TYPES = [
  "income",
  "fixed_income",
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
  fixed_income: "Recorrente",
  fixed_expense: "Recorrente",
  investment_deposit: "Aporte",
};

export function getTypeLabel(type: string, investmentId: string | null): string {
  if (type === "income" && investmentId) return "Resgate";
  return TYPE_LABELS[type] ?? type;
}

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
