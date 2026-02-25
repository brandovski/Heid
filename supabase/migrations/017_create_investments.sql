-- =======================================================
-- Migration 017: Módulo de Investimentos
-- =======================================================
-- Parte 1: Extensão do ENUM transaction_type
-- ⚠️  DEVE SER EXECUTADA ISOLADA (fora de bloco de transação)
--     antes das Partes 2–5.
-- =======================================================

ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'investment_deposit';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'investment_withdrawal';

-- =======================================================
-- Parte 2: investments
-- =======================================================

CREATE TABLE investments (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id                   UUID        NOT NULL,
  -- user_id NOT NULL intencional: serve como dono do aporte automático no cron
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
  -- Aporte mensal: ambos os campos devem estar presentes ou ausentes
  CONSTRAINT chk_investments_contribution CHECK (
    (monthly_contribution_amount IS NULL AND monthly_contribution_day IS NULL) OR
    (monthly_contribution_amount IS NOT NULL AND monthly_contribution_day IS NOT NULL)
  )
);

-- Índices
CREATE INDEX idx_investments_family   ON investments(family_id, is_active);
CREATE INDEX idx_investments_scope    ON investments(family_id, scope, user_id);
CREATE INDEX idx_investments_eligible ON investments(family_id)
  WHERE is_eligible_for_projects = true;

-- Trigger: updated_at
CREATE TRIGGER set_investments_updated_at
  BEFORE UPDATE ON investments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Leitura: família, pessoal próprio, ou investimento elegível da família
-- (cobre o caso de usar investimento do parceiro como pagamento de projeto)
CREATE POLICY "scoped_select" ON investments FOR SELECT USING (
  (scope = 'family'   AND family_id = auth_family_id())                                              OR
  (scope = 'personal' AND user_id   = auth.uid())                                                    OR
  (scope = 'personal' AND is_eligible_for_projects = true AND family_id = auth_family_id())
);

-- Escrita: família ou dono
CREATE POLICY "scoped_modify" ON investments FOR ALL USING (
  (scope = 'family'   AND family_id = auth_family_id()) OR
  (scope = 'personal' AND user_id   = auth.uid())
);


-- =======================================================
-- Parte 3: investment_transactions
-- =======================================================

CREATE TABLE investment_transactions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id  UUID        NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  family_id      UUID        NOT NULL,
  type           TEXT        NOT NULL,   -- 'deposit' | 'withdrawal'
  amount         NUMERIC(12,2) NOT NULL  CHECK (amount > 0),
  date           DATE        NOT NULL,
  notes          TEXT,
  -- Transação financeira vinculada (quando o aporte é feito via app)
  transaction_id UUID        REFERENCES transactions(id) ON DELETE SET NULL,
  auto_generated BOOLEAN     NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT chk_inv_tx_type CHECK (type IN ('deposit', 'withdrawal'))
);

-- Índices
CREATE INDEX idx_inv_tx_investment ON investment_transactions(investment_id, date);
CREATE INDEX idx_inv_tx_family     ON investment_transactions(family_id, date);

-- Índice único para idempotência do cron:
-- um único aporte automático por investimento por mês
-- Usa year_month_key (IMMUTABLE) — mesma função usada em transactions
CREATE UNIQUE INDEX idx_inv_tx_auto_month
  ON investment_transactions(investment_id, year_month_key(date))
  WHERE auto_generated = true;

-- RLS: herda visibilidade do investimento pai
ALTER TABLE investment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_access" ON investment_transactions
  FOR ALL USING (
    investment_id IN (
      SELECT id FROM investments WHERE
        (scope = 'family'   AND family_id = auth_family_id()) OR
        (scope = 'personal' AND user_id   = auth.uid())       OR
        (scope = 'personal' AND is_eligible_for_projects = true AND family_id = auth_family_id())
    )
  );


-- =======================================================
-- Parte 4: investment_snapshots
-- =======================================================
-- Tabela append-only: cada atualização de saldo de mercado
-- gera uma nova linha. Sem updated_at.
-- =======================================================

CREATE TABLE investment_snapshots (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id UUID        NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  family_id     UUID        NOT NULL,
  value         NUMERIC(12,2) NOT NULL CHECK (value >= 0),
  date          DATE        NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Índice DESC por data para buscar o snapshot mais recente eficientemente
CREATE INDEX idx_inv_snapshots_recent
  ON investment_snapshots(investment_id, date DESC);
CREATE INDEX idx_inv_snapshots_family
  ON investment_snapshots(family_id, date DESC);

-- RLS: herda visibilidade do investimento pai
ALTER TABLE investment_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_access" ON investment_snapshots
  FOR ALL USING (
    investment_id IN (
      SELECT id FROM investments WHERE
        (scope = 'family'   AND family_id = auth_family_id()) OR
        (scope = 'personal' AND user_id   = auth.uid())       OR
        (scope = 'personal' AND is_eligible_for_projects = true AND family_id = auth_family_id())
    )
  );


-- =======================================================
-- Parte 5: Modificações em project_items
-- =======================================================

-- Novas colunas
ALTER TABLE project_items
  ADD COLUMN investment_id         UUID REFERENCES investments(id) ON DELETE SET NULL,
  ADD COLUMN expected_payment_date DATE;

-- Expandir payment_origin para incluir 'investment'
ALTER TABLE project_items DROP CONSTRAINT chk_item_payment_origin;
ALTER TABLE project_items ADD CONSTRAINT chk_item_payment_origin
  CHECK (payment_origin IN ('personal', 'family', 'investment') OR payment_origin IS NULL);

-- investment_id obrigatório quando payment_origin = 'investment'
ALTER TABLE project_items ADD CONSTRAINT chk_item_investment_required
  CHECK (payment_origin IS DISTINCT FROM 'investment' OR investment_id IS NOT NULL);

-- Índice para buscar itens vinculados a um investimento
CREATE INDEX idx_project_items_investment
  ON project_items(investment_id, status)
  WHERE investment_id IS NOT NULL;
