CREATE TABLE fixed_expenses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id      UUID NOT NULL,
  description    TEXT NOT NULL,
  amount         NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  day_of_month   SMALLINT NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  category_id    UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active      BOOLEAN DEFAULT true,
  start_date     DATE NOT NULL,
  end_date       DATE,
  notes          TEXT,
  payment_method TEXT NOT NULL DEFAULT 'account',
  credit_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_payment_method
    CHECK (payment_method IN ('account', 'credit_card')),
  CONSTRAINT chk_credit_card_required
    CHECK (payment_method != 'credit_card' OR credit_card_id IS NOT NULL)
);

CREATE INDEX idx_fixed_expenses_family_id ON fixed_expenses(family_id);
