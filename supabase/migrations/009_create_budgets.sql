CREATE TABLE budgets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL,
  reference_month TEXT NOT NULL,
  category_id     UUID NOT NULL REFERENCES categories(id),
  planned_amount  NUMERIC(12,2) NOT NULL CHECK (planned_amount >= 0),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (family_id, reference_month, category_id)
);

CREATE INDEX idx_budgets_family_month ON budgets(family_id, reference_month);
