CREATE TABLE subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id         UUID NOT NULL,
  name              TEXT NOT NULL,
  original_currency TEXT NOT NULL DEFAULT 'BRL',
  amount_original   NUMERIC(12,2) NOT NULL CHECK (amount_original > 0),
  amount_brl        NUMERIC(12,2) NOT NULL CHECK (amount_brl > 0),
  billing_day       SMALLINT NOT NULL CHECK (billing_day BETWEEN 1 AND 28),
  credit_card_id    UUID NOT NULL REFERENCES credit_cards(id),
  category_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
  start_date        DATE NOT NULL,
  cancelled_at      TIMESTAMPTZ,
  notes             TEXT,
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_currency CHECK (original_currency IN ('BRL', 'USD'))
);

CREATE INDEX idx_subscriptions_family_id ON subscriptions(family_id);
