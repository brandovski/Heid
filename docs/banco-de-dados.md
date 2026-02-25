# Couple — Schema do Banco de Dados

> Todas as tabelas usam `UUID` como PK gerado pelo Postgres (`gen_random_uuid()`).
> Todas as datas são armazenadas em UTC.
> RLS está habilitado em todas as tabelas.

---

## Diagrama ER (simplificado)

```
profiles ──────────────────────────────────────────────────────┐
   │ family_id                                                  │
   │                                                            │
categories ◄──────────────────────────────────────────────┐    │
   │                                                       │    │
   ├◄── fixed_incomes                                      │    │
   ├◄── fixed_expenses ──────────► credit_cards ◄──────────┼────┤
   ├◄── subscriptions  ──────────►      │                  │    │
   ├◄── budgets                         │                  │    │
   └◄── transactions ◄──────────────────┘                  │    │
            │                                              │    │
            ├── installment_groups ◄────────── credit_cards│    │
            └── invoice_payments ◄──────────── credit_cards│    │
                                                           │    │
   (todas as tabelas têm family_id referenciando profiles) ┘    │
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
-- Executado via supabase/seed.sql após configurar o family_id
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
  created_at       TIMESTAMPTZ DEFAULT now()
);
```

---

### `fixed_incomes`

```sql
CREATE TABLE fixed_incomes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    UUID NOT NULL,
  description  TEXT NOT NULL,
  amount       NUMERIC(12,2) NOT NULL,
  day_of_month SMALLINT NOT NULL,        -- 1–31
  category_id  UUID REFERENCES categories(id),
  is_active    BOOLEAN DEFAULT true,
  start_date   DATE NOT NULL,
  end_date     DATE,                     -- nullable: sem data de término
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

---

### `fixed_expenses`

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
  created_at     TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_payment_method CHECK (payment_method IN ('account', 'credit_card'))
);
```

---

### `subscriptions`

```sql
CREATE TABLE subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id         UUID NOT NULL,
  name              TEXT NOT NULL,
  original_currency TEXT NOT NULL DEFAULT 'BRL',  -- 'BRL' | 'USD'
  amount_original   NUMERIC(12,2) NOT NULL,        -- valor na moeda original
  amount_brl        NUMERIC(12,2) NOT NULL,         -- último valor convertido em BRL
  billing_day       SMALLINT NOT NULL,              -- 1–28
  credit_card_id    UUID NOT NULL REFERENCES credit_cards(id),
  category_id       UUID REFERENCES categories(id),
  start_date        DATE NOT NULL,
  cancelled_at      TIMESTAMPTZ,
  notes             TEXT,
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_currency CHECK (original_currency IN ('BRL', 'USD'))
);
```

---

### `installment_groups`

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
  created_at             TIMESTAMPTZ DEFAULT now()
);
```

---

### `transactions`

Tabela central do sistema. Contém todas as movimentações financeiras.

```sql
CREATE TYPE transaction_type AS ENUM (
  'income', 'expense', 'installment', 'subscription', 'fixed_income', 'fixed_expense'
);

CREATE TYPE transaction_status AS ENUM ('pending', 'paid', 'cancelled');

CREATE TABLE transactions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id            UUID NOT NULL,
  description          TEXT NOT NULL,
  amount               NUMERIC(12,2) NOT NULL,
  date                 DATE NOT NULL,               -- data de competência
  type                 transaction_type NOT NULL,
  status               transaction_status NOT NULL DEFAULT 'pending',
  category_id          UUID REFERENCES categories(id),
  credit_card_id       UUID REFERENCES credit_cards(id),
  installment_group_id UUID REFERENCES installment_groups(id),
  subscription_id      UUID REFERENCES subscriptions(id),
  fixed_income_id      UUID REFERENCES fixed_incomes(id),
  fixed_expense_id     UUID REFERENCES fixed_expenses(id),
  exchange_rate        NUMERIC(10,4),               -- cotação usada (se conversão)
  original_amount      NUMERIC(12,2),               -- valor antes da conversão
  original_currency    TEXT,                        -- 'USD', etc.
  exchange_estimated   BOOLEAN DEFAULT false,        -- true se cotação foi fallback
  auto_generated       BOOLEAN DEFAULT false,        -- true se criada pelo cron
  paid_at              TIMESTAMPTZ,                  -- data real de pagamento
  notes                TEXT,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance nas queries mais frequentes
CREATE INDEX idx_transactions_family_date ON transactions(family_id, date);
CREATE INDEX idx_transactions_family_status ON transactions(family_id, status);
CREATE INDEX idx_transactions_credit_card ON transactions(credit_card_id, date);
CREATE INDEX idx_transactions_category ON transactions(category_id, date);
```

**Índice de idempotência para cron jobs:**

```sql
-- Garante que o cron não gere duplicatas para fixed_income no mesmo mês
CREATE UNIQUE INDEX idx_transactions_fixed_income_month
  ON transactions(fixed_income_id, date_trunc('month', date))
  WHERE fixed_income_id IS NOT NULL;

CREATE UNIQUE INDEX idx_transactions_fixed_expense_month
  ON transactions(fixed_expense_id, date_trunc('month', date))
  WHERE fixed_expense_id IS NOT NULL;

CREATE UNIQUE INDEX idx_transactions_subscription_month
  ON transactions(subscription_id, date_trunc('month', date))
  WHERE subscription_id IS NOT NULL;
```

---

### `budgets`

```sql
CREATE TABLE budgets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL,
  reference_month TEXT NOT NULL,    -- formato: 'YYYY-MM'
  category_id     UUID NOT NULL REFERENCES categories(id),
  planned_amount  NUMERIC(12,2) NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (family_id, reference_month, category_id)
);
```

---

### `invoice_payments`

```sql
CREATE TABLE invoice_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL,
  credit_card_id  UUID NOT NULL REFERENCES credit_cards(id),
  reference_month TEXT NOT NULL,    -- formato: 'YYYY-MM'
  amount_paid     NUMERIC(12,2) NOT NULL,
  paid_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (credit_card_id, reference_month)   -- um pagamento por fatura
);
```

---

## Políticas RLS

### Política padrão (aplicada a todas as tabelas)

```sql
-- Habilitar RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

-- Política: acesso apenas ao family_id do usuário autenticado
-- (replicar para cada tabela substituindo o nome)

CREATE POLICY "family_access" ON categories
  FOR ALL USING (
    family_id = (SELECT family_id FROM profiles WHERE id = auth.uid())
  );

-- Repetir o padrão acima para: credit_cards, fixed_incomes, fixed_expenses,
-- subscriptions, installment_groups, transactions, budgets, invoice_payments
```

### Política de profiles

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Usuário lê apenas o próprio perfil
CREATE POLICY "own_profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Usuário atualiza apenas o próprio perfil
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE USING (id = auth.uid());
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

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
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

> Após criar os dois usuários, atualizar manualmente o `family_id` em ambos os perfis para o mesmo UUID.

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
```

---

*Atualizado em: 2026-02-25*
