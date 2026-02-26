export type EscopoType = "personal" | "family";

export interface BudgetEntry {
  id: string;
  family_id: string;
  reference_month: string;
  category_id: string;
  planned_amount: number;
  notes: string | null;
  scope: EscopoType;
  user_id: string | null;
  created_at: string;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
}

export interface TransactionRow {
  amount: number;
  status: string;
  category_id: string | null;
  type: string;
  scope: string;
  user_id: string | null;
}

export interface CategoryStats {
  spent: number;       // transações paid
  committed: number;   // transações pending
  total: number;       // spent + committed
  percentage: number;  // total / planned_amount × 100
  isOverBudget: boolean;
}

export interface BudgetWithStats extends BudgetEntry {
  stats: CategoryStats;
}

export function computeStats(
  budget: BudgetEntry,
  transactions: TransactionRow[]
): BudgetWithStats {
  const categoryTxs = transactions.filter(
    (t) => t.category_id === budget.category_id
  );
  const spent = categoryTxs
    .filter((t) => t.status === "paid")
    .reduce((sum, t) => sum + t.amount, 0);
  const committed = categoryTxs
    .filter((t) => t.status === "pending")
    .reduce((sum, t) => sum + t.amount, 0);
  const total = spent + committed;
  const percentage =
    budget.planned_amount > 0 ? (total / budget.planned_amount) * 100 : 0;

  return {
    ...budget,
    stats: { spent, committed, total, percentage, isOverBudget: total > budget.planned_amount },
  };
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
