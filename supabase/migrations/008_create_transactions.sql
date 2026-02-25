CREATE TYPE transaction_type AS ENUM (
  'income',
  'expense',
  'installment',
  'subscription',
  'fixed_income',
  'fixed_expense'
);

CREATE TYPE transaction_status AS ENUM ('pending', 'paid', 'cancelled');

CREATE TABLE transactions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id            UUID NOT NULL,
  description          TEXT NOT NULL,
  amount               NUMERIC(12,2) NOT NULL,
  date                 DATE NOT NULL,
  type                 transaction_type NOT NULL,
  status               transaction_status NOT NULL DEFAULT 'pending',
  category_id          UUID REFERENCES categories(id) ON DELETE SET NULL,
  credit_card_id       UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
  installment_group_id UUID REFERENCES installment_groups(id) ON DELETE SET NULL,
  subscription_id      UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  fixed_income_id      UUID REFERENCES fixed_incomes(id) ON DELETE SET NULL,
  fixed_expense_id     UUID REFERENCES fixed_expenses(id) ON DELETE SET NULL,
  exchange_rate        NUMERIC(10,4),
  original_amount      NUMERIC(12,2),
  original_currency    TEXT,
  exchange_estimated   BOOLEAN DEFAULT false,
  auto_generated       BOOLEAN DEFAULT false,
  paid_at              TIMESTAMPTZ,
  notes                TEXT,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- Índices de performance
CREATE INDEX idx_transactions_family_date   ON transactions(family_id, date);
CREATE INDEX idx_transactions_family_status ON transactions(family_id, status);
CREATE INDEX idx_transactions_credit_card   ON transactions(credit_card_id, date);
CREATE INDEX idx_transactions_category      ON transactions(category_id, date);

-- Função IMMUTABLE helper para os índices de idempotência.
-- date_trunc() e expressões com date::text são STABLE no Postgres,
-- então não podem ser usados diretamente em índices.
-- Declarar a função como IMMUTABLE é o padrão recomendado para
-- extrações de datas sem fuso horário (DATE é timezone-free).
CREATE OR REPLACE FUNCTION year_month_key(d DATE)
RETURNS TEXT
LANGUAGE sql IMMUTABLE STRICT
AS $$
  SELECT TO_CHAR(d, 'YYYY-MM')
$$;

-- Índices de idempotência: evitam duplicatas nos cron jobs
CREATE UNIQUE INDEX idx_transactions_fixed_income_month
  ON transactions(fixed_income_id, year_month_key(date))
  WHERE fixed_income_id IS NOT NULL;

CREATE UNIQUE INDEX idx_transactions_fixed_expense_month
  ON transactions(fixed_expense_id, year_month_key(date))
  WHERE fixed_expense_id IS NOT NULL;

CREATE UNIQUE INDEX idx_transactions_subscription_month
  ON transactions(subscription_id, year_month_key(date))
  WHERE subscription_id IS NOT NULL;
