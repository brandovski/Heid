export type FluxoItemKind =
  | "transaction"
  | "fatura"
  | "investment_projected"
  | "fixed_projected"
  | "project_item";

export interface FluxoItem {
  id: string;
  date: string;          // YYYY-MM-DD — chave de agrupamento
  kind: FluxoItemKind;
  description: string;
  amount: number;        // positivo = entrada, negativo = saída
  badge: string;         // "fixo" | "assinatura" | "parcela" | "investimento" | "projeto" | "avulso"
  icon?: string;         // category.icon (emoji)
  color?: string;        // category.color (hex)
}

export type ScopeFilter = "personal" | "partner";

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

export function formatMonthLabel(mes: string): string {
  const [year, month] = mes.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDayHeader(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return `${weekDays[date.getDay()]}, ${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
}

export const INCOME_TYPES = [
  "income",
  "fixed_income",
] as const;

export function isIncomeType(type: string): boolean {
  return INCOME_TYPES.includes(type as (typeof INCOME_TYPES)[number]);
}

export function typeToBadge(type: string): string {
  switch (type) {
    case "fixed_income":
    case "fixed_expense":
      return "fixo";
    case "subscription":
      return "assinatura";
    case "installment":
      return "parcela";
    case "investment_deposit":
      return "investimento";
    default:
      return "avulso";
  }
}
