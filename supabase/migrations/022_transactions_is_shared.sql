-- =======================================================
-- Migration 022: Adicionar is_shared em transactions
-- =======================================================
-- Problema: transactions não tinha coluna is_shared,
-- mas dashboard e /transacoes filtram por ela para exibir
-- transações pessoais do parceiro.
--
-- Passo A: Adicionar coluna
-- Passo B: Backfill de transações existentes
-- Passo C: Recriar RLS scoped_select com nova cláusula
-- =======================================================

-- Passo A: Adicionar coluna is_shared
ALTER TABLE transactions
  ADD COLUMN is_shared BOOLEAN NOT NULL DEFAULT FALSE;

-- Passo B: Backfill — marcar como compartilhadas as transações
-- pessoais de usuários que têm share_with_partner = true
UPDATE transactions t
SET is_shared = true
FROM profiles p
WHERE t.user_id = p.id
  AND p.share_with_partner = true
  AND t.scope = 'personal';

-- Passo C: Recriar RLS scoped_select com cláusula para is_shared
DROP POLICY IF EXISTS "scoped_select" ON transactions;

CREATE POLICY "scoped_select" ON transactions FOR SELECT USING (
  -- Transações familiares: todos da família veem
  (scope = 'family' AND family_id = auth_family_id())
  OR
  -- Transações pessoais próprias
  (scope = 'personal' AND user_id = auth.uid())
  OR
  -- Transações pessoais do parceiro marcadas como compartilhadas
  (scope = 'personal' AND is_shared = true AND family_id = auth_family_id() AND user_id <> auth.uid())
  OR
  -- Transações pessoais geradas por entidades compartilhadas do parceiro
  (scope = 'personal' AND family_id = auth_family_id() AND (
    credit_card_id       IN (SELECT id FROM credit_cards       WHERE is_shared = true AND user_id <> auth.uid()) OR
    fixed_income_id      IN (SELECT id FROM fixed_incomes      WHERE is_shared = true AND user_id <> auth.uid()) OR
    fixed_expense_id     IN (SELECT id FROM fixed_expenses     WHERE is_shared = true AND user_id <> auth.uid()) OR
    subscription_id      IN (SELECT id FROM subscriptions      WHERE is_shared = true AND user_id <> auth.uid()) OR
    installment_group_id IN (SELECT id FROM installment_groups WHERE is_shared = true AND user_id <> auth.uid())
  ))
);
