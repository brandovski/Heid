export type EscopoType = "personal" | "parceiro";

export interface TransactionRow {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: string;
  status: string;
  scope: string;
  user_id: string | null;
  category_id: string | null;
  credit_card_id: string | null;
  category: { name: string; icon: string | null; color: string | null } | null;
}

export interface HistoricalTxRow {
  amount: number;
  date: string;
  type: string;
  status: string;
}

export interface UpcomingRow {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: string;
  category: { name: string; icon: string | null; color: string | null } | null;
}

export interface BudgetRow {
  id: string;
  category_id: string;
  planned_amount: number;
  category: { name: string; icon: string | null; color: string | null } | null;
}

export interface CreditCardRow {
  id: string;
  name: string;
  color: string | null;
  due_day: number;
  scope: string;
  user_id: string | null;
  is_shared: boolean;
}

export interface InvoicePaymentRow {
  id: string;
  credit_card_id: string;
  reference_month: string;
  amount_paid: number;
  paid_at: string;
  notes: string | null;
}

export interface DashboardSummary {
  income: number;
  expense: number;
  balance: number;
  pendingIncome: number;
  pendingExpense: number;
}

export interface MonthlyTotal {
  Mês: string;
  Receitas: number;
  Despesas: number;
}

export interface CategoryAmount {
  name: string;
  amount: number;
}

export interface BudgetWithStats extends BudgetRow {
  spent: number;
  committed: number;
  percentage: number;
  isOverBudget: boolean;
}

export interface InvoiceCardData {
  card: CreditCardRow;
  monthTotal: number;
  payment: InvoicePaymentRow | null;
}

// ── Tipos de transação ─────────────────────────────────────────────────────────
const INCOME_TYPES = ["income", "fixed_income"];
const EXPENSE_TYPES = ["expense", "fixed_expense", "installment", "subscription"];

// ── Computações ────────────────────────────────────────────────────────────────

export function computeSummary(transactions: TransactionRow[]): DashboardSummary {
  const income = transactions
    .filter((t) => INCOME_TYPES.includes(t.type) && t.status === "paid")
    .reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => EXPENSE_TYPES.includes(t.type) && t.status === "paid")
    .reduce((s, t) => s + t.amount, 0);
  const pendingIncome = transactions
    .filter((t) => INCOME_TYPES.includes(t.type) && t.status === "pending")
    .reduce((s, t) => s + t.amount, 0);
  const pendingExpense = transactions
    .filter((t) => EXPENSE_TYPES.includes(t.type) && t.status === "pending")
    .reduce((s, t) => s + t.amount, 0);
  return { income, expense, balance: income - expense, pendingIncome, pendingExpense };
}

export function computeMonthlyTotals(
  transactions: HistoricalTxRow[],
  months: string[]
): MonthlyTotal[] {
  return months.map((month) => {
    const txs = transactions.filter(
      (t) => t.date.startsWith(month) && t.status !== "cancelled"
    );
    const receitas = txs
      .filter((t) => INCOME_TYPES.includes(t.type))
      .reduce((s, t) => s + t.amount, 0);
    const despesas = txs
      .filter((t) => EXPENSE_TYPES.includes(t.type))
      .reduce((s, t) => s + t.amount, 0);
    return { Mês: formatMonthShort(month), Receitas: receitas, Despesas: despesas };
  });
}

export function computeCategoryDistribution(
  transactions: TransactionRow[]
): CategoryAmount[] {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (!EXPENSE_TYPES.includes(t.type) || t.status === "cancelled") continue;
    const name = t.category?.name ?? "Sem categoria";
    map.set(name, (map.get(name) ?? 0) + t.amount);
  }
  return Array.from(map.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function computeBudgetStats(
  budgets: BudgetRow[],
  transactions: TransactionRow[]
): BudgetWithStats[] {
  return budgets.map((b) => {
    const txs = transactions.filter(
      (t) => t.category_id === b.category_id && EXPENSE_TYPES.includes(t.type)
    );
    const spent = txs
      .filter((t) => t.status === "paid")
      .reduce((s, t) => s + t.amount, 0);
    const committed = txs
      .filter((t) => t.status === "pending")
      .reduce((s, t) => s + t.amount, 0);
    const total = spent + committed;
    const percentage = b.planned_amount > 0 ? (total / b.planned_amount) * 100 : 0;
    return { ...b, spent, committed, percentage, isOverBudget: total > b.planned_amount };
  });
}

export function computeInvoiceCards(
  cards: CreditCardRow[],
  transactions: TransactionRow[],
  invoicePayments: InvoicePaymentRow[]
): InvoiceCardData[] {
  return cards
    .map((card) => {
      const cardTxs = transactions.filter(
        (t) =>
          t.credit_card_id === card.id &&
          EXPENSE_TYPES.includes(t.type) &&
          t.status !== "cancelled"
      );
      const monthTotal = cardTxs.reduce((s, t) => s + t.amount, 0);
      const payment = invoicePayments.find((p) => p.credit_card_id === card.id) ?? null;
      return { card, monthTotal, payment };
    })
    .filter((d) => d.monthTotal > 0 || d.payment !== null);
}

// ── Formatação ─────────────────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function formatMonthShort(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1)
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "")
    .toUpperCase()
    .slice(0, 3);
}

export function formatDate(date: string): string {
  const [y, mo, d] = date.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function last6Months(currentMonth: string): string[] {
  return Array.from({ length: 6 }, (_, i) => shiftMonth(currentMonth, i - 5));
}
