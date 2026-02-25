CREATE TABLE credit_cards (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id        UUID NOT NULL,
  name             TEXT NOT NULL,
  brand            TEXT NOT NULL,
  closing_day      SMALLINT NOT NULL CHECK (closing_day BETWEEN 1 AND 28),
  due_day          SMALLINT NOT NULL CHECK (due_day BETWEEN 1 AND 28),
  credit_limit     NUMERIC(12,2),
  last_four_digits CHAR(4),
  color            TEXT,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_credit_cards_family_id ON credit_cards(family_id);
