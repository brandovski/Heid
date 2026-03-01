-- Migration 024: Investment Contributions v2
-- Suporta aportes independentes por membro (dono + parceiro) para investimentos familiares.
-- Também adiciona contributor_user_id em investment_transactions para rastrear quem aportou.
--
-- Aplicar via Management API em 3 chamadas separadas:

-- Chamada 1
ALTER TABLE investments
  ADD COLUMN partner_contribution_amount NUMERIC(12,2),
  ADD COLUMN partner_contribution_day    SMALLINT CHECK (partner_contribution_day BETWEEN 1 AND 28);

-- Chamada 2
ALTER TABLE investments
  ADD CONSTRAINT chk_investments_partner_contribution CHECK (
    (partner_contribution_amount IS NULL AND partner_contribution_day IS NULL) OR
    (partner_contribution_amount IS NOT NULL AND partner_contribution_day IS NOT NULL)
  );

-- Chamada 3
ALTER TABLE investment_transactions
  ADD COLUMN contributor_user_id UUID REFERENCES auth.users(id);
