-- Sem FK explícita para profiles.family_id: dois usuários compartilham
-- o mesmo family_id, o que torna a FK estruturalmente impossível com UNIQUE.
-- O isolamento é garantido pelo RLS (ver 011_rls_policies.sql).

CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL,
  name        TEXT NOT NULL,
  icon        TEXT,
  color       TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_categories_family_id ON categories(family_id);
