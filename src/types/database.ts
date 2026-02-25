export type TransactionType =
  | "income"
  | "expense"
  | "installment"
  | "subscription"
  | "fixed_income"
  | "fixed_expense";

export type TransactionStatus = "pending" | "paid" | "cancelled";

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
