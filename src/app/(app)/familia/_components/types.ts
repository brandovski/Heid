export interface FamilyMember {
  id: string;
  full_name: string | null;
}

export interface FamilyContribution {
  id: string;
  user_id: string;
  amount: number;
  date: string;
  transaction_id: string | null;
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
  auto_generated: boolean;
  category_id: string | null;
  credit_card_id: string | null;
  category: {
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
}

const EXPENSE_TYPES = new Set([
  "expense",
  "fixed_expense",
  "installment",
  "subscription",
]);

const INCOME_TYPES = new Set(["income", "fixed_income"]);

export function computeCaixaFamiliar(
  contributions: FamilyContribution[],
  members: FamilyMember[],
  familyTransactions: FamilyTransaction[]
) {
  // Total aportado no mês por membro
  const memberContribs = new Map<string, number>();
  for (const member of members) {
    const total = contributions
      .filter((c) => c.user_id === member.id)
      .reduce((sum, c) => sum + c.amount, 0);
    memberContribs.set(member.id, total);
  }

  const totalContribuicoes = Array.from(memberContribs.values()).reduce(
    (sum, v) => sum + v,
    0
  );

  const totalGasto = familyTransactions
    .filter((t) => EXPENSE_TYPES.has(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalReceita = familyTransactions
    .filter((t) => INCOME_TYPES.has(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  const saldoLivre = totalContribuicoes - totalGasto + totalReceita;

  return { memberContribs, totalContribuicoes, totalGasto, totalReceita, saldoLivre };
}

export function computeLastDay(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  return `${mes}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;
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
