-- =======================================================
-- Migration 018: Adicionar investment_id em transactions
-- =======================================================
-- DIFERIDA para o início da Fase 10 (Investimentos — UI).
-- Vincula transações financeiras a investimentos,
-- permitindo rastrear aportes/resgates no extrato.
-- =======================================================

-- Adicionar coluna investment_id em transactions
ALTER TABLE transactions
  ADD COLUMN investment_id UUID REFERENCES investments(id) ON DELETE SET NULL;

-- Índice para buscar transações de um investimento
CREATE INDEX idx_transactions_investment
  ON transactions(investment_id)
  WHERE investment_id IS NOT NULL;

-- Atualizar scoped_select de transactions para incluir
-- visibilidade de transações geradas por investimentos elegíveis do parceiro
DROP POLICY IF EXISTS "scoped_select" ON transactions;

CREATE POLICY "scoped_select" ON transactions FOR SELECT USING (
  (scope = 'family'   AND family_id = auth_family_id()) OR
  (scope = 'personal' AND user_id   = auth.uid())       OR
  -- Transações geradas por entidades compartilhadas (is_shared)
  (scope = 'personal' AND family_id = auth_family_id() AND (
    (credit_card_id       IN (SELECT id FROM credit_cards       WHERE is_shared = true AND user_id != auth.uid())) OR
    (fixed_income_id      IN (SELECT id FROM fixed_incomes      WHERE is_shared = true AND user_id != auth.uid())) OR
    (fixed_expense_id     IN (SELECT id FROM fixed_expenses     WHERE is_shared = true AND user_id != auth.uid())) OR
    (subscription_id      IN (SELECT id FROM subscriptions      WHERE is_shared = true AND user_id != auth.uid())) OR
    (installment_group_id IN (SELECT id FROM installment_groups WHERE is_shared = true AND user_id != auth.uid()))
  )) OR
  -- Transações geradas por investimentos elegíveis do parceiro
  (investment_id IN (
    SELECT id FROM investments
    WHERE is_eligible_for_projects = true
      AND user_id != auth.uid()
      AND family_id = auth_family_id()
  ))
);
