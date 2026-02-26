export type ViewType = "familiar" | "pessoal";

export interface FamilyMember {
  id: string;
  full_name: string | null;
}

export interface FamilyContribution {
  id: string;
  user_id: string;
  amount: number;
  effective_from: string;
  notes: string | null;
  created_at: string;
}

export interface FamilyTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: string;
  status: string;
  category: {
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
}

export interface SharedFixedIncome {
  id: string;
  description: string;
  amount: number;
  day_of_month: number;
  user_id: string;
  category: { name: string; icon: string | null } | null;
}

export interface SharedFixedExpense {
  id: string;
  description: string;
  amount: number;
  day_of_month: number;
  user_id: string;
  category: { name: string; icon: string | null } | null;
}

export interface SharedSubscription {
  id: string;
  name: string;
  amount_brl: number;
  original_currency: "BRL" | "USD";
  amount_original: number;
  billing_day: number;
  user_id: string;
  category: { name: string; icon: string | null } | null;
}

export interface SharedCreditCard {
  id: string;
  name: string;
  brand: string;
  user_id: string;
}

const EXPENSE_TYPES = new Set([
  "expense",
  "fixed_expense",
  "installment",
  "subscription",
]);

const INCOME_TYPES = new Set(["income", "fixed_income"]);

export function getActiveContribution(
  contributions: FamilyContribution[],
  userId: string,
  lastDay: string
): FamilyContribution | null {
  const sorted = contributions
    .filter((c) => c.user_id === userId && c.effective_from <= lastDay)
    .sort((a, b) => b.effective_from.localeCompare(a.effective_from));
  return sorted[0] ?? null;
}

export function computeLastDay(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  return `${mes}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;
}

export function computeCaixaFamiliar(
  contributions: FamilyContribution[],
  members: FamilyMember[],
  familyTransactions: FamilyTransaction[],
  lastDay: string
) {
  const activeContribs = new Map<string, FamilyContribution | null>();
  for (const member of members) {
    activeContribs.set(
      member.id,
      getActiveContribution(contributions, member.id, lastDay)
    );
  }

  const totalContribuicoes = Array.from(activeContribs.values()).reduce(
    (sum, c) => sum + (c?.amount ?? 0),
    0
  );

  const totalGasto = familyTransactions
    .filter((t) => EXPENSE_TYPES.has(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalReceita = familyTransactions
    .filter((t) => INCOME_TYPES.has(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  const saldoLivre = totalContribuicoes - totalGasto + totalReceita;

  return { activeContribs, totalContribuicoes, totalGasto, totalReceita, saldoLivre };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}
