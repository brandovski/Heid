CREATE TABLE fixed_incomes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    UUID NOT NULL,
  description  TEXT NOT NULL,
  amount       NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  day_of_month SMALLINT NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  category_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active    BOOLEAN DEFAULT true,
  start_date   DATE NOT NULL,
  end_date     DATE,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fixed_incomes_family_id ON fixed_incomes(family_id);
