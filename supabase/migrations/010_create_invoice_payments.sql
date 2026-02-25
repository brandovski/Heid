CREATE TABLE invoice_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL,
  credit_card_id  UUID NOT NULL REFERENCES credit_cards(id),
  reference_month TEXT NOT NULL,
  amount_paid     NUMERIC(12,2) NOT NULL CHECK (amount_paid > 0),
  paid_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (credit_card_id, reference_month)
);

CREATE INDEX idx_invoice_payments_family ON invoice_payments(family_id);
