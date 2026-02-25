-- =======================================================
-- Migration 013: Adicionar escopo (personal/family) às entidades
-- =======================================================
-- Cada entidade financeira passa a ter:
--   scope     → 'personal' (padrão) ou 'family'
--   user_id   → dono do registro (NULL para dados de família)
--   is_shared → parceiro pode visualizar (somente leitura)
--
-- Dados existentes recebem scope = 'family' para manter
-- o comportamento atual (tudo visível pelos dois usuários).
-- =======================================================

-- credit_cards
ALTER TABLE credit_cards
  ADD COLUMN scope     TEXT    NOT NULL DEFAULT 'family',
  ADD COLUMN user_id   UUID    REFERENCES auth.users(id),
  ADD COLUMN is_shared BOOLEAN NOT NULL DEFAULT false,
  ADD CONSTRAINT chk_credit_cards_scope CHECK (scope IN ('personal', 'family'));

-- fixed_incomes
ALTER TABLE fixed_incomes
  ADD COLUMN scope     TEXT    NOT NULL DEFAULT 'family',
  ADD COLUMN user_id   UUID    REFERENCES auth.users(id),
  ADD COLUMN is_shared BOOLEAN NOT NULL DEFAULT false,
  ADD CONSTRAINT chk_fixed_incomes_scope CHECK (scope IN ('personal', 'family'));

-- fixed_expenses
ALTER TABLE fixed_expenses
  ADD COLUMN scope     TEXT    NOT NULL DEFAULT 'family',
  ADD COLUMN user_id   UUID    REFERENCES auth.users(id),
  ADD COLUMN is_shared BOOLEAN NOT NULL DEFAULT false,
  ADD CONSTRAINT chk_fixed_expenses_scope CHECK (scope IN ('personal', 'family'));

-- subscriptions
ALTER TABLE subscriptions
  ADD COLUMN scope     TEXT    NOT NULL DEFAULT 'family',
  ADD COLUMN user_id   UUID    REFERENCES auth.users(id),
  ADD COLUMN is_shared BOOLEAN NOT NULL DEFAULT false,
  ADD CONSTRAINT chk_subscriptions_scope CHECK (scope IN ('personal', 'family'));

-- installment_groups
ALTER TABLE installment_groups
  ADD COLUMN scope     TEXT    NOT NULL DEFAULT 'family',
  ADD COLUMN user_id   UUID    REFERENCES auth.users(id),
  ADD COLUMN is_shared BOOLEAN NOT NULL DEFAULT false,
  ADD CONSTRAINT chk_installment_groups_scope CHECK (scope IN ('personal', 'family'));

-- transactions
ALTER TABLE transactions
  ADD COLUMN scope   TEXT NOT NULL DEFAULT 'family',
  ADD COLUMN user_id UUID REFERENCES auth.users(id),
  ADD CONSTRAINT chk_transactions_scope CHECK (scope IN ('personal', 'family'));

-- budgets
ALTER TABLE budgets
  ADD COLUMN scope   TEXT NOT NULL DEFAULT 'family',
  ADD COLUMN user_id UUID REFERENCES auth.users(id),
  ADD CONSTRAINT chk_budgets_scope CHECK (scope IN ('personal', 'family'));

-- Índices para performance nas queries com filtro de escopo
CREATE INDEX idx_transactions_scope  ON transactions(family_id, scope, user_id);
CREATE INDEX idx_budgets_scope       ON budgets(family_id, scope, user_id);
CREATE INDEX idx_credit_cards_scope  ON credit_cards(family_id, scope, user_id);
