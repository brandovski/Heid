# Heid — Schema do Banco de Dados

> Todas as tabelas usam `UUID` como PK gerado pelo Postgres (`gen_random_uuid()`).
> Todas as datas são armazenadas em UTC.
> RLS está habilitado em todas as tabelas.

---

## Diagrama ER (simplificado)

```
profiles ──────────────────────────────────────────────────────────┐
   │ family_id                                                      │
   │                                                                │
categories ◄──────────────────────────────────────────────────┐    │
   │                                                           │    │
   ├◄── fixed_incomes (scope, user_id, is_shared)             │    │
   ├◄── fixed_expenses (scope, user_id, is_shared) ──────────►│    │
   ├◄── subscriptions  (scope, user_id, is_shared)            │    │
   ├◄── budgets (scope, user_id)                              │    │
   └◄── transactions (scope, user_id) ◄─────────────────────────┐  │
            │                                                 │  │  │
            ├── installment_groups (scope, user_id, is_shared)│  │  │
            └── invoice_payments                              │  │  │
                                                             │  │  │
   credit_cards (scope, user_id, is_shared) ─────────────────┘  │  │
   family_contributions ─────────────────────────────────────────┘  │
   projects (scope, user_id) ─────────────────────────────────────┘
     └── project_groups
           └── project_items ──────────► transactions
```

---

## Tabelas

### `profiles`

Extensão do `auth.users` do Supabase. Criada via trigger ao registrar usuário.

```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id   UUID NOT NULL,
  full_name   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

> Os dois usuários do casal compartilham o mesmo `family_id`, configurado manualmente após o cadastro.

---

### `categories`

Categorias são **globais da família** — sem escopo pessoal, sempre compartilhadas.

```sql
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL REFERENCES profiles(family_id),
  name        TEXT NOT NULL,
  icon        TEXT,                    -- emoji ou identificador
  color       TEXT,                    -- hex: '#FF5733'
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

**Seed de categorias padrão:**

```sql
INSERT INTO categories (family_id, name, icon, color) VALUES
  ('<family_id>', 'Alimentação',  '🍔', '#F97316'),
  ('<family_id>', 'Transporte',   '🚗', '#3B82F6'),
  ('<family_id>', 'Moradia',      '🏠', '#8B5CF6'),
  ('<family_id>', 'Saúde',        '💊', '#EF4444'),
  ('<family_id>', 'Lazer',        '🎮', '#10B981'),
  ('<family_id>', 'Educação',     '📚', '#F59E0B'),
  ('<family_id>', 'Vestuário',    '👕', '#EC4899'),
  ('<family_id>', 'Outros',       '📦', '#6B7280');
```

---

### `credit_cards`

Adicionados em `013`: `scope`, `user_id`, `is_shared`.

```sql
CREATE TABLE credit_cards (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id        UUID NOT NULL,
  name             TEXT NOT NULL,
  brand            TEXT NOT NULL,        -- 'Visa', 'Mastercard', 'Elo', etc.
  closing_day      SMALLINT NOT NULL,    -- 1–28
  due_day          SMALLINT NOT NULL,    -- 1–28
  credit_limit     NUMERIC(12,2),
  last_four_digits CHAR(4),
  color            TEXT,                 -- hex para identificação visual
  is_active        BOOLEAN DEFAULT true,
  -- Escopo (migration 013)
  scope            TEXT NOT NULL DEFAULT 'family',  -- 'personal' | 'family'
  user_id          UUID REFERENCES auth.users(id),  -- dono (se personal)
  is_shared        BOOLEAN NOT NULL DEFAULT false,  -- parceiro pode ver
  created_at       TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_credit_cards_scope CHECK (scope IN ('personal', 'family'))
);
```

---

### `fixed_incomes`

Adicionados em `013`: `scope`, `user_id`, `is_shared`.

```sql
CREATE TABLE fixed_incomes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    UUID NOT NULL,
  description  TEXT NOT NULL,
  amount       NUMERIC(12,2) NOT NULL,
  day_of_month SMALLINT NOT NULL,
  category_id  UUID REFERENCES categories(id),
  is_active    BOOLEAN DEFAULT true,
  start_date   DATE NOT NULL,
  end_date     DATE,
  notes        TEXT,
  -- Escopo (migration 013)
  scope        TEXT NOT NULL DEFAULT 'family',
  user_id      UUID REFERENCES auth.users(id),
  is_shared    BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_fixed_incomes_scope CHECK (scope IN ('personal', 'family'))
);
```

---

### `fixed_expenses`

Adicionados em `013`: `scope`, `user_id`, `is_shared`.

```sql
CREATE TABLE fixed_expenses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id      UUID NOT NULL,
  description    TEXT NOT NULL,
  amount         NUMERIC(12,2) NOT NULL,
  day_of_month   SMALLINT NOT NULL,
  category_id    UUID REFERENCES categories(id),
  is_active      BOOLEAN DEFAULT true,
  start_date     DATE NOT NULL,
  end_date       DATE,
  notes          TEXT,
  payment_method TEXT NOT NULL DEFAULT 'account',  -- 'account' | 'credit_card'
  credit_card_id UUID REFERENCES credit_cards(id),
  -- Escopo (migration 013)
  scope          TEXT NOT NULL DEFAULT 'family',
  user_id        UUID REFERENCES auth.users(id),
  is_shared      BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_payment_method CHECK (payment_method IN ('account', 'credit_card')),
  CONSTRAINT chk_fixed_expenses_scope CHECK (scope IN ('personal', 'family'))
);
```

---

### `subscriptions`

Adicionados em `013`: `scope`, `user_id`, `is_shared`. Adicionado em `026`: `promotional_amount`, `promotional_months`.

> **Migration 034 (sessão 036):** todas as assinaturas migradas para `scope='personal'`. Assinaturas são sempre pessoais — nunca familiares.

```sql
CREATE TABLE subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id           UUID NOT NULL,
  name                TEXT NOT NULL,
  original_currency   TEXT NOT NULL DEFAULT 'BRL',
  amount_original     NUMERIC(12,2) NOT NULL,
  amount_brl          NUMERIC(12,2) NOT NULL,
  billing_day         SMALLINT NOT NULL,
  credit_card_id      UUID NOT NULL REFERENCES credit_cards(id),
  category_id         UUID REFERENCES categories(id),
  start_date          DATE NOT NULL,
  cancelled_at        TIMESTAMPTZ,
  notes               TEXT,
  is_active           BOOLEAN DEFAULT true,
  -- Escopo (migration 013) — sempre 'personal' a partir da migration 034
  scope               TEXT NOT NULL DEFAULT 'personal',
  user_id             UUID REFERENCES auth.users(id),
  is_shared           BOOLEAN NOT NULL DEFAULT false,
  -- Valor promocional (migration 026)
  promotional_amount  NUMERIC(12,2),
  promotional_months  SMALLINT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_currency CHECK (original_currency IN ('BRL', 'USD')),
  CONSTRAINT chk_subscriptions_scope CHECK (scope IN ('personal', 'family'))
);
```

---

### `installment_groups`

Adicionados em `013`: `scope`, `user_id`, `is_shared`.

```sql
CREATE TABLE installment_groups (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id              UUID NOT NULL,
  description            TEXT NOT NULL,
  total_amount           NUMERIC(12,2) NOT NULL,
  installments_count     SMALLINT NOT NULL,
  first_installment_date DATE NOT NULL,
  credit_card_id         UUID NOT NULL REFERENCES credit_cards(id),
  category_id            UUID REFERENCES categories(id),
  notes                  TEXT,
  -- Escopo (migration 013)
  scope                  TEXT NOT NULL DEFAULT 'family',
  user_id                UUID REFERENCES auth.users(id),
  is_shared              BOOLEAN NOT NULL DEFAULT false,
  created_at             TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_installment_groups_scope CHECK (scope IN ('personal', 'family'))
);
```

---

### `transactions`

Tabela central do sistema. Adicionados em `013`: `scope`, `user_id`. Adicionado em `018`: `investment_id`.

```sql
CREATE TYPE transaction_type AS ENUM (
  'income', 'expense', 'installment', 'subscription', 'fixed_income', 'fixed_expense',
  'investment_deposit', 'investment_withdrawal'  -- migration 017 (Parte 1)
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
  category_id          UUID REFERENCES categories(id),
  credit_card_id       UUID REFERENCES credit_cards(id),
  installment_group_id UUID REFERENCES installment_groups(id),
  subscription_id      UUID REFERENCES subscriptions(id),
  fixed_income_id      UUID REFERENCES fixed_incomes(id),
  fixed_expense_id     UUID REFERENCES fixed_expenses(id),
  exchange_rate        NUMERIC(10,4),
  original_amount      NUMERIC(12,2),
  original_currency    TEXT,
  exchange_estimated   BOOLEAN DEFAULT false,
  auto_generated       BOOLEAN DEFAULT false,
  paid_at              TIMESTAMPTZ,
  notes                TEXT,
  -- Escopo (migration 013)
  scope                TEXT NOT NULL DEFAULT 'family',  -- 'personal' | 'family'
  user_id              UUID REFERENCES auth.users(id),
  -- Investimento vinculado (migration 018 — diferida para Fase 10)
  investment_id        UUID REFERENCES investments(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_transactions_scope CHECK (scope IN ('personal', 'family'))
);

CREATE INDEX idx_transactions_family_date   ON transactions(family_id, date);
CREATE INDEX idx_transactions_family_status ON transactions(family_id, status);
CREATE INDEX idx_transactions_credit_card   ON transactions(credit_card_id, date);
CREATE INDEX idx_transactions_category      ON transactions(category_id, date);
CREATE INDEX idx_transactions_scope         ON transactions(family_id, scope, user_id);
```

**Índices de idempotência para cron jobs (função IMMUTABLE):**

```sql
-- Função auxiliar IMMUTABLE para usar em expressões de índice
CREATE OR REPLACE FUNCTION year_month_key(d DATE)
RETURNS TEXT LANGUAGE sql IMMUTABLE STRICT AS $$
  SELECT TO_CHAR(d, 'YYYY-MM')
$$;

CREATE UNIQUE INDEX idx_transactions_fixed_income_month
  ON transactions(fixed_income_id, year_month_key(date))
  WHERE fixed_income_id IS NOT NULL;

CREATE UNIQUE INDEX idx_transactions_fixed_expense_month
  ON transactions(fixed_expense_id, year_month_key(date))
  WHERE fixed_expense_id IS NOT NULL;

CREATE UNIQUE INDEX idx_transactions_subscription_month
  ON transactions(subscription_id, year_month_key(date))
  WHERE subscription_id IS NOT NULL;
```

---

### `budgets`

Adicionados em `013`: `scope`, `user_id`.

```sql
CREATE TABLE budgets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL,
  reference_month TEXT NOT NULL,    -- 'YYYY-MM'
  category_id     UUID NOT NULL REFERENCES categories(id),
  planned_amount  NUMERIC(12,2) NOT NULL,
  notes           TEXT,
  -- Escopo (migration 013)
  scope           TEXT NOT NULL DEFAULT 'family',
  user_id         UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (family_id, reference_month, category_id),
  CONSTRAINT chk_budgets_scope CHECK (scope IN ('personal', 'family'))
);
```

---

### `invoice_payments`

```sql
CREATE TABLE invoice_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL,
  credit_card_id  UUID NOT NULL REFERENCES credit_cards(id),
  reference_month TEXT NOT NULL,    -- 'YYYY-MM'
  amount_paid     NUMERIC(12,2) NOT NULL,
  paid_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (credit_card_id, reference_month)
);
```

---

### `family_contributions` *(migration 014, atualizado em 020)*

Cada linha representa um aporte real ao Caixa Familiar — o valor sai da conta pessoal do usuário e entra no caixa coletivo. Cada aporte é vinculado à transação pessoal correspondente.

```sql
CREATE TABLE family_contributions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id      UUID NOT NULL,
  user_id        UUID NOT NULL REFERENCES auth.users(id),
  amount         NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  date           DATE NOT NULL,              -- renomeado de effective_from (migration 020)
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,  -- migration 020
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
  -- UNIQUE (family_id, user_id, effective_from) removido em migration 020
);

CREATE INDEX idx_family_contributions_family_date ON family_contributions(family_id, date);
```

> O saldo do Caixa Familiar é calculado dinamicamente: `SUM(aportes do mês) - SUM(transações com scope='family' no mês)`.

---

### `projects` *(migration 015)*

```sql
CREATE TABLE projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    UUID NOT NULL,
  user_id      UUID NOT NULL REFERENCES auth.users(id),
  scope        TEXT NOT NULL DEFAULT 'family',     -- 'personal' | 'family'
  name         TEXT NOT NULL,
  description  TEXT,
  total_budget NUMERIC(12,2) NOT NULL CHECK (total_budget >= 0),
  target_date  DATE,
  status       TEXT NOT NULL DEFAULT 'active',     -- 'active' | 'completed' | 'cancelled'
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_projects_scope  CHECK (scope  IN ('personal', 'family')),
  CONSTRAINT chk_projects_status CHECK (status IN ('active', 'completed', 'cancelled'))
);
```

---

### `project_groups` *(migration 015)*

```sql
CREATE TABLE project_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  "order"     SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

### `project_items` *(migrations 015 + 017)*

```sql
CREATE TABLE project_items (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_group_id         UUID NOT NULL REFERENCES project_groups(id) ON DELETE CASCADE,
  project_id               UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name                     TEXT NOT NULL,
  description              TEXT,
  budget_amount            NUMERIC(12,2),   -- valor estimado
  actual_amount            NUMERIC(12,2),   -- valor real fechado

  -- Tipo de pagamento
  payment_type             TEXT,            -- 'cash' | 'card_installment' | 'deposit_remainder'
  payment_origin           TEXT,            -- 'personal' | 'family' | 'investment'
  payment_user_id          UUID REFERENCES auth.users(id),  -- quem paga (se personal)

  -- Para payment_type = 'cash'
  payment_method           TEXT,            -- 'debit' | 'pix' | 'cash' | 'transfer'

  -- Para payment_type = 'card_installment'
  credit_card_id           UUID REFERENCES credit_cards(id),
  installments_count       SMALLINT,

  -- Para payment_type = 'deposit_remainder' (Sinal + Restante)
  deposit_amount           NUMERIC(12,2),   -- valor do sinal
  -- remainder = actual_amount - deposit_amount (calculado, não armazenado)
  remainder_date           DATE,            -- data do pagamento restante

  category_id              UUID REFERENCES categories(id) ON DELETE SET NULL,
  notes                    TEXT,
  status                   TEXT NOT NULL DEFAULT 'considering',

  -- Investimento como origem de pagamento (migration 017)
  investment_id            UUID REFERENCES investments(id) ON DELETE SET NULL,
  expected_payment_date    DATE,            -- data prevista de saque do investimento

  -- Links para transações geradas
  transaction_id           UUID REFERENCES transactions(id) ON DELETE SET NULL,
  deposit_transaction_id   UUID REFERENCES transactions(id) ON DELETE SET NULL,
  remainder_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,

  -- Vínculo com investment_transaction de sinal (migration 031 — sessão 035)
  -- FK correta: aponta para investment_transactions, não para transactions
  investment_deposit_id    UUID REFERENCES investment_transactions(id) ON DELETE SET NULL,

  -- Data real de pagamento (migration 032 — sessão 035)
  paid_at                  DATE,

  created_at               TIMESTAMPTZ DEFAULT now(),
  updated_at               TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT chk_item_payment_type       CHECK (payment_type   IN ('cash', 'card_installment', 'deposit_remainder') OR payment_type IS NULL),
  CONSTRAINT chk_item_payment_origin     CHECK (payment_origin IN ('personal', 'family', 'investment') OR payment_origin IS NULL),
  CONSTRAINT chk_item_payment_method     CHECK (payment_method IN ('debit', 'pix', 'cash', 'transfer') OR payment_method IS NULL),
  CONSTRAINT chk_item_status             CHECK (status IN ('considering', 'confirmed', 'paid', 'cancelled')),
  -- investment_id obrigatório quando payment_origin = 'investment'
  CONSTRAINT chk_item_investment_required CHECK (payment_origin IS DISTINCT FROM 'investment' OR investment_id IS NOT NULL)
);
```

**Status do item:**
- `considering` — avaliando, ainda sem valor real fechado
- `confirmed` — decidido, valor real definido, aguardando pagamento
- `paid` — transação(ões) gerada(s)
- `cancelled` — descartado

---

## Políticas RLS

### Função auxiliar

```sql
-- Retorna o family_id do usuário autenticado
CREATE OR REPLACE FUNCTION auth_family_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT family_id FROM profiles WHERE id = auth.uid()
$$;
```

### Política original (tabelas sem escopo)

```sql
-- profiles: lê e edita apenas o próprio
CREATE POLICY "own_profile"       ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE USING (id = auth.uid());

-- categories, invoice_payments: acesso por family_id
CREATE POLICY "family_access" ON categories
  FOR ALL USING (family_id = auth_family_id());

CREATE POLICY "family_access" ON family_contributions
  FOR ALL USING (family_id = auth_family_id());
```

### Políticas de escopo (migration 016)

Aplicadas a: `credit_cards`, `fixed_incomes`, `fixed_expenses`, `subscriptions`,
`installment_groups`, `transactions`, `budgets`.

```sql
-- Leitura: vê o próprio (personal), o da família (family),
-- ou o pessoal do parceiro se is_shared = true
CREATE POLICY "scoped_select" ON credit_cards FOR SELECT USING (
  (scope = 'family'   AND family_id = auth_family_id())                          OR
  (scope = 'personal' AND user_id   = auth.uid())                                OR
  (scope = 'personal' AND is_shared = true AND family_id = auth_family_id())
);

-- Escrita: família ou dono
CREATE POLICY "scoped_modify" ON credit_cards FOR ALL USING (
  (scope = 'family'   AND family_id = auth_family_id()) OR
  (scope = 'personal' AND user_id   = auth.uid())
);
```

**Transações** têm visibilidade herdada de entidades compartilhadas:

```sql
CREATE POLICY "scoped_select" ON transactions FOR SELECT USING (
  (scope = 'family'   AND family_id = auth_family_id()) OR
  (scope = 'personal' AND user_id   = auth.uid())       OR
  (scope = 'personal' AND family_id = auth_family_id() AND (
    credit_card_id       IN (SELECT id FROM credit_cards   WHERE is_shared = true AND user_id != auth.uid()) OR
    fixed_income_id      IN (SELECT id FROM fixed_incomes  WHERE is_shared = true AND user_id != auth.uid()) OR
    fixed_expense_id     IN (SELECT id FROM fixed_expenses WHERE is_shared = true AND user_id != auth.uid()) OR
    subscription_id      IN (SELECT id FROM subscriptions  WHERE is_shared = true AND user_id != auth.uid()) OR
    installment_group_id IN (SELECT id FROM installment_groups WHERE is_shared = true AND user_id != auth.uid())
  ))
);
```

---

## Trigger: updated_at automático

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicado em: transactions, projects, project_items
```

---

## Trigger: criar profile ao registrar usuário

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

### `investments` *(migration 017)*

```sql
CREATE TABLE investments (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id                   UUID        NOT NULL,
  -- NOT NULL intencional: user_id serve como dono dos aportes automáticos no cron
  user_id                     UUID        NOT NULL REFERENCES auth.users(id),
  scope                       TEXT        NOT NULL DEFAULT 'personal',
  name                        TEXT        NOT NULL,
  description                 TEXT,
  type                        TEXT        NOT NULL,
  goal_amount                 NUMERIC(12,2),
  monthly_contribution_amount NUMERIC(12,2),
  monthly_contribution_day    SMALLINT    CHECK (monthly_contribution_day BETWEEN 1 AND 28),
  is_eligible_for_projects    BOOLEAN     NOT NULL DEFAULT false,
  is_active                   BOOLEAN     NOT NULL DEFAULT true,
  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT chk_investments_scope CHECK (scope IN ('personal', 'family')),
  CONSTRAINT chk_investments_type  CHECK (type  IN (
    'cofrinho', 'cdb', 'lci_lca', 'tesouro_direto', 'renda_variavel',
    'fii', 'fundo', 'previdencia', 'cripto', 'outro'
  )),
  CONSTRAINT chk_investments_contribution CHECK (
    (monthly_contribution_amount IS NULL AND monthly_contribution_day IS NULL) OR
    (monthly_contribution_amount IS NOT NULL AND monthly_contribution_day IS NOT NULL)
  )
);

CREATE INDEX idx_investments_family   ON investments(family_id, is_active);
CREATE INDEX idx_investments_scope    ON investments(family_id, scope, user_id);
CREATE INDEX idx_investments_eligible ON investments(family_id)
  WHERE is_eligible_for_projects = true;
```

**RLS:** `scoped_select` — família, pessoal próprio, ou pessoal elegível para projetos (da mesma família). `scoped_modify` — família ou dono.

---

### `investment_transactions` *(migration 017, atualizado em 024 e 033)*

```sql
CREATE TABLE investment_transactions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id       UUID        NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  family_id           UUID        NOT NULL,
  type                TEXT        NOT NULL,   -- 'deposit' | 'withdrawal'
  amount              NUMERIC(12,2) NOT NULL  CHECK (amount > 0),
  date                DATE        NOT NULL,
  notes               TEXT,
  transaction_id      UUID        REFERENCES transactions(id) ON DELETE SET NULL,
  auto_generated      BOOLEAN     NOT NULL DEFAULT false,
  -- Quem fez o aporte ou resgate (migration 024 — sessão 029)
  -- Setado para deposits E withdrawals desde a sessão 036
  contributor_user_id UUID        REFERENCES auth.users(id),
  -- Item de projeto vinculado a este resgate (migration 033 — sessão 036)
  project_item_id     UUID        REFERENCES project_items(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT chk_inv_tx_type CHECK (type IN ('deposit', 'withdrawal'))
);

CREATE INDEX idx_inv_tx_investment ON investment_transactions(investment_id, date);
CREATE INDEX idx_inv_tx_family     ON investment_transactions(family_id, date);

-- Idempotência do cron: um único aporte automático por investimento por mês
-- Usa year_month_key (IMMUTABLE) — mesma função usada em transactions
CREATE UNIQUE INDEX idx_inv_tx_auto_month
  ON investment_transactions(investment_id, year_month_key(date))
  WHERE auto_generated = true;
```

**RLS:** `family_access` — herda visibilidade do investimento pai via subquery.

**Regras de negócio:**
- `contributor_user_id` é sempre `user.id` autenticado — nunca o dono do investimento (hardcoded no servidor desde sessão 031)
- Para withdrawals, é o resgatador; para deposits, é quem fez o aporte
- `project_item_id` é preenchido automaticamente por `pagar/route.ts` quando o pagamento de um item de projeto debita do investimento; backfill feito via migration 033 para registros anteriores

---

### `investment_snapshots` *(migration 017)*

Tabela **append-only** — cada atualização de saldo de mercado gera uma nova linha.

```sql
CREATE TABLE investment_snapshots (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id UUID        NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  family_id     UUID        NOT NULL,
  value         NUMERIC(12,2) NOT NULL CHECK (value >= 0),
  date          DATE        NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
  -- Sem updated_at: append-only
);

-- Índice DESC para buscar snapshot mais recente eficientemente
CREATE INDEX idx_inv_snapshots_recent ON investment_snapshots(investment_id, date DESC);
CREATE INDEX idx_inv_snapshots_family ON investment_snapshots(family_id, date DESC);
```

**RLS:** `family_access` — herda visibilidade do investimento pai via subquery.

---

## Ordem de execução das migrations

```
001_create_profiles.sql
002_create_categories.sql
003_create_credit_cards.sql
004_create_fixed_incomes.sql
005_create_fixed_expenses.sql
006_create_subscriptions.sql
007_create_installment_groups.sql
008_create_transactions.sql
009_create_budgets.sql
010_create_invoice_payments.sql
011_rls_policies.sql
012_triggers.sql
013_add_scope_to_entities.sql         ← scope + user_id + is_shared em entidades financeiras
014_create_family_contributions.sql   ← Caixa Familiar
015_create_projects.sql               ← Módulo de projetos
016_update_rls_for_scope.sql          ← Substitui family_access por scoped_select/scoped_modify
017_create_investments.sql            ← Módulo de Investimentos (PARTE 1 isolada: ENUM; PARTES 2–5: tabelas)
018_add_investment_to_transactions.sql ← Vincula transactions a investments (diferida — Fase 10)
019_fix_budget_unique_constraint.sql   ← Corrige constraint única de orçamentos mensais
020_update_family_contributions.sql    ← Renomeia effective_from→date, adiciona transaction_id FK, remove unique constraint
```

---

*Atualizado em: 2026-02-26*
