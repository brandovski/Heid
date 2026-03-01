export type TransactionType =
  | "income"
  | "expense"
  | "installment"
  | "subscription"
  | "fixed_income"
  | "fixed_expense"
  | "investment_deposit"
  | "investment_withdrawal";

export type TransactionStatus = "pending" | "paid" | "cancelled";

export type Scope = "personal" | "family";

export interface Profile {
  id: string;
  family_id: string | null;
  full_name: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  family_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
}

export interface CreditCard {
  id: string;
  family_id: string;
  name: string;
  brand: string;
  closing_day: number;
  due_day: number;
  credit_limit: number | null;
  last_four_digits: string | null;
  color: string | null;
  is_active: boolean;
  // Escopo (migration 013)
  scope: Scope;
  user_id: string | null;
  is_shared: boolean;
  created_at: string;
}

export interface FixedIncome {
  id: string;
  family_id: string;
  description: string;
  amount: number;
  day_of_month: number;
  category_id: string | null;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  // Escopo (migration 013)
  scope: Scope;
  user_id: string | null;
  is_shared: boolean;
  created_at: string;
}

export interface FixedExpense {
  id: string;
  family_id: string;
  description: string;
  amount: number;
  day_of_month: number;
  category_id: string | null;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  payment_method: "account" | "credit_card";
  credit_card_id: string | null;
  // Escopo (migration 013)
  scope: Scope;
  user_id: string | null;
  is_shared: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  family_id: string;
  name: string;
  original_currency: "BRL" | "USD";
  amount_original: number;
  amount_brl: number;
  billing_day: number;
  credit_card_id: string;
  category_id: string | null;
  start_date: string;
  cancelled_at: string | null;
  notes: string | null;
  is_active: boolean;
  // Escopo (migration 013)
  scope: Scope;
  user_id: string | null;
  is_shared: boolean;
  created_at: string;
}

export interface InstallmentGroup {
  id: string;
  family_id: string;
  description: string;
  total_amount: number;
  installments_count: number;
  first_installment_date: string;
  credit_card_id: string;
  category_id: string | null;
  notes: string | null;
  // Escopo (migration 013)
  scope: Scope;
  user_id: string | null;
  is_shared: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  family_id: string;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  status: TransactionStatus;
  category_id: string | null;
  credit_card_id: string | null;
  installment_group_id: string | null;
  subscription_id: string | null;
  fixed_income_id: string | null;
  fixed_expense_id: string | null;
  exchange_rate: number | null;
  original_amount: number | null;
  original_currency: string | null;
  exchange_estimated: boolean;
  auto_generated: boolean;
  paid_at: string | null;
  notes: string | null;
  // Escopo (migration 013)
  scope: Scope;
  user_id: string | null;
  is_shared: boolean;
  // Investimento vinculado (migration 018 — diferida para Fase 10)
  investment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  family_id: string;
  reference_month: string;
  category_id: string;
  planned_amount: number;
  notes: string | null;
  // Escopo (migration 013)
  scope: Scope;
  user_id: string | null;
  created_at: string;
}

export interface InvoicePayment {
  id: string;
  family_id: string;
  credit_card_id: string;
  reference_month: string;
  amount_paid: number;
  paid_at: string;
  notes: string | null;
  created_at: string;
}

// --- Migration 014: Caixa Familiar ---

export interface FamilyContribution {
  id: string;
  family_id: string;
  user_id: string;
  amount: number;
  effective_from: string;  // DATE — 'YYYY-MM-DD'
  notes: string | null;
  created_at: string;
}

// --- Migration 015: Projetos ---

export type ProjectStatus = "active" | "completed" | "cancelled";

export type ProjectItemStatus = "considering" | "confirmed" | "paid" | "cancelled";

export type PaymentType = "cash" | "card_installment" | "deposit_remainder";

export type PaymentOrigin = "personal" | "family" | "investment";

export type CashPaymentMethod = "debit" | "pix" | "cash" | "transfer";

export interface Project {
  id: string;
  family_id: string;
  user_id: string;
  scope: Scope;
  name: string;
  description: string | null;
  total_budget: number;
  target_date: string | null;  // DATE
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface ProjectGroup {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  order: number;
  created_at: string;
}

export interface ProjectItem {
  id: string;
  project_group_id: string;
  project_id: string;
  name: string;
  description: string | null;
  budget_amount: number | null;
  actual_amount: number | null;
  // Tipo de pagamento
  payment_type: PaymentType | null;
  payment_origin: PaymentOrigin | null;
  payment_user_id: string | null;
  // cash
  payment_method: CashPaymentMethod | null;
  // card_installment
  credit_card_id: string | null;
  installments_count: number | null;
  // deposit_remainder
  deposit_amount: number | null;
  remainder_date: string | null;  // DATE
  // Categoria e notas
  category_id: string | null;
  notes: string | null;
  status: ProjectItemStatus;
  // Investimento vinculado (migration 017)
  investment_id: string | null;
  expected_payment_date: string | null;  // DATE
  // Links para transações geradas
  transaction_id: string | null;
  deposit_transaction_id: string | null;
  remainder_transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

// --- Migration 017: Investimentos ---

export type InvestmentType =
  | "cofrinho"
  | "cdb"
  | "lci_lca"
  | "tesouro_direto"
  | "renda_variavel"
  | "fii"
  | "fundo"
  | "previdencia"
  | "cripto"
  | "outro";

export type InvestmentTransactionType = "deposit" | "withdrawal";

export interface Investment {
  id: string;
  family_id: string;
  user_id: string;  // NOT NULL — dono do investimento e dos aportes automáticos
  scope: Scope;
  name: string;
  description: string | null;
  type: InvestmentType;
  goal_amount: number | null;
  monthly_contribution_amount: number | null;
  monthly_contribution_day: number | null;  // 1–28
  partner_contribution_amount: number | null;
  partner_contribution_day: number | null;  // 1–28
  is_eligible_for_projects: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvestmentTransaction {
  id: string;
  investment_id: string;
  family_id: string;
  type: InvestmentTransactionType;
  amount: number;
  date: string;  // DATE
  notes: string | null;
  transaction_id: string | null;  // transação financeira vinculada
  auto_generated: boolean;
  contributor_user_id: string | null;
  created_at: string;
}

export interface InvestmentSnapshot {
  id: string;
  investment_id: string;
  family_id: string;
  value: number;
  date: string;  // DATE
  notes: string | null;
  created_at: string;
  // Sem updated_at: tabela append-only
}
