-- Migration 024: aportes mensais do parceiro em investimentos
-- Adiciona suporte a aporte mensal configurável por parceiro (amount + dia do mês)
-- e rastreamento de quem realizou cada depósito em investment_transactions.
-- Aplicada em: sessão 029 (2026-03-02)

-- Parte 1: colunas de aporte do parceiro em investments
ALTER TABLE investments
  ADD COLUMN partner_contribution_amount NUMERIC(12,2),
  ADD COLUMN partner_contribution_day    INTEGER,
  ADD CONSTRAINT chk_investments_partner_contribution
    CHECK ((partner_contribution_amount IS NULL) = (partner_contribution_day IS NULL));

-- Parte 2: identificação do contribuinte em investment_transactions
ALTER TABLE investment_transactions
  ADD COLUMN contributor_user_id UUID REFERENCES auth.users(id);
