-- =======================================================
-- Migration 015: Módulo de Projetos
-- =======================================================
-- Tabelas: projects, project_groups, project_items
-- =======================================================

-- -------------------
-- projects
-- -------------------
CREATE TABLE projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    UUID NOT NULL,
  user_id      UUID NOT NULL REFERENCES auth.users(id),
  scope        TEXT NOT NULL DEFAULT 'family',
  name         TEXT NOT NULL,
  description  TEXT,
  total_budget NUMERIC(12,2) NOT NULL CHECK (total_budget >= 0),
  target_date  DATE,
  status       TEXT NOT NULL DEFAULT 'active',
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_projects_scope  CHECK (scope  IN ('personal', 'family')),
  CONSTRAINT chk_projects_status CHECK (status IN ('active', 'completed', 'cancelled'))
);

CREATE INDEX idx_projects_family ON projects(family_id, status);

-- -------------------
-- project_groups
-- -------------------
CREATE TABLE project_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  "order"     SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_project_groups_project ON project_groups(project_id, "order");

-- -------------------
-- project_items
-- -------------------
CREATE TABLE project_items (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_group_id         UUID NOT NULL REFERENCES project_groups(id) ON DELETE CASCADE,
  project_id               UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name                     TEXT NOT NULL,
  description              TEXT,
  budget_amount            NUMERIC(12,2),              -- valor estimado/orçado
  actual_amount            NUMERIC(12,2),              -- valor real fechado

  -- Tipo de pagamento
  payment_type             TEXT,                       -- 'cash' | 'card_installment' | 'deposit_remainder'
  payment_origin           TEXT,                       -- 'personal' | 'family'
  payment_user_id          UUID REFERENCES auth.users(id), -- quem paga (se personal)

  -- Para payment_type = 'cash'
  payment_method           TEXT,                       -- 'debit' | 'pix' | 'cash' | 'transfer'

  -- Para payment_type = 'card_installment'
  credit_card_id           UUID REFERENCES credit_cards(id),
  installments_count       SMALLINT,

  -- Para payment_type = 'deposit_remainder'
  deposit_amount           NUMERIC(12,2),              -- valor do sinal
  -- remainder = actual_amount - deposit_amount (calculado, não armazenado)
  remainder_date           DATE,                       -- data do pagamento restante

  -- Categoria global para as transações geradas
  category_id              UUID REFERENCES categories(id) ON DELETE SET NULL,

  notes                    TEXT,
  status                   TEXT NOT NULL DEFAULT 'considering',

  -- Links para as transações geradas
  transaction_id           UUID REFERENCES transactions(id) ON DELETE SET NULL,
  deposit_transaction_id   UUID REFERENCES transactions(id) ON DELETE SET NULL,
  remainder_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,

  created_at               TIMESTAMPTZ DEFAULT now(),
  updated_at               TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT chk_item_payment_type   CHECK (payment_type   IN ('cash', 'card_installment', 'deposit_remainder') OR payment_type IS NULL),
  CONSTRAINT chk_item_payment_origin CHECK (payment_origin IN ('personal', 'family') OR payment_origin IS NULL),
  CONSTRAINT chk_item_payment_method CHECK (payment_method IN ('debit', 'pix', 'cash', 'transfer') OR payment_method IS NULL),
  CONSTRAINT chk_item_status         CHECK (status IN ('considering', 'confirmed', 'paid', 'cancelled'))
);

CREATE INDEX idx_project_items_group   ON project_items(project_group_id);
CREATE INDEX idx_project_items_project ON project_items(project_id, status);

-- Trigger: updated_at em projects
CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: updated_at em project_items
CREATE TRIGGER set_project_items_updated_at
  BEFORE UPDATE ON project_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_items  ENABLE ROW LEVEL SECURITY;

-- projects: acesso por escopo
CREATE POLICY "scoped_select" ON projects FOR SELECT USING (
  (scope = 'family'   AND family_id = auth_family_id()) OR
  (scope = 'personal' AND user_id   = auth.uid())
);
CREATE POLICY "scoped_modify" ON projects FOR ALL USING (
  (scope = 'family'   AND family_id = auth_family_id()) OR
  (scope = 'personal' AND user_id   = auth.uid())
);

-- project_groups: herda acesso do projeto pai
CREATE POLICY "family_access" ON project_groups
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE
        (scope = 'family'   AND family_id = auth_family_id()) OR
        (scope = 'personal' AND user_id   = auth.uid())
    )
  );

-- project_items: herda acesso do projeto pai
CREATE POLICY "family_access" ON project_items
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE
        (scope = 'family'   AND family_id = auth_family_id()) OR
        (scope = 'personal' AND user_id   = auth.uid())
    )
  );
