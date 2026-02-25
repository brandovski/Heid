CREATE TABLE installment_groups (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id              UUID NOT NULL,
  description            TEXT NOT NULL,
  total_amount           NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
  installments_count     SMALLINT NOT NULL CHECK (installments_count > 0),
  first_installment_date DATE NOT NULL,
  credit_card_id         UUID NOT NULL REFERENCES credit_cards(id),
  category_id            UUID REFERENCES categories(id) ON DELETE SET NULL,
  notes                  TEXT,
  created_at             TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_installment_groups_family_id ON installment_groups(family_id);
