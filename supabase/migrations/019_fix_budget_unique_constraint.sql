-- Migration 019: Corrige UNIQUE constraint em budgets para suportar escopo pessoal + familiar
--
-- Problema: a constraint original UNIQUE(family_id, reference_month, category_id)
-- impede que dois usuários da mesma família tenham orçamentos pessoais distintos
-- para a mesma categoria no mesmo mês.
--
-- Solução: substituir pela constraint por dois índices parciais separados por scope.

-- Remove a constraint original
ALTER TABLE budgets
  DROP CONSTRAINT IF EXISTS budgets_family_id_reference_month_category_id_key;

-- Orçamento familiar: único por família / mês / categoria
CREATE UNIQUE INDEX idx_budgets_family_unique
  ON budgets(family_id, reference_month, category_id)
  WHERE scope = 'family';

-- Orçamento pessoal: único por usuário / mês / categoria
CREATE UNIQUE INDEX idx_budgets_personal_unique
  ON budgets(family_id, reference_month, category_id, user_id)
  WHERE scope = 'personal';
