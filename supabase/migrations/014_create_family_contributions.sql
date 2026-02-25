-- =======================================================
-- Migration 014: Contribuições mensais ao Caixa Familiar
-- =======================================================
-- Cada usuário configura o valor que contribui mensalmente
-- para o fundo conjunto da família. O caixa familiar é:
--   total disponível = soma das contribuições do mês
--   saldo = total disponível − despesas com scope = 'family' no mês
-- =======================================================

CREATE TABLE family_contributions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id      UUID NOT NULL,
  user_id        UUID NOT NULL REFERENCES auth.users(id),
  amount         NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  effective_from DATE NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  -- Apenas uma contribuição ativa por usuário por mês
  UNIQUE (family_id, user_id, effective_from)
);

CREATE INDEX idx_family_contributions_family ON family_contributions(family_id, user_id);

-- RLS
ALTER TABLE family_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_access" ON family_contributions
  FOR ALL USING (family_id = auth_family_id());
