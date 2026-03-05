-- Migration 029: resgates de investimento viram income no extrato
-- Parte 1: Atualizar transações existentes de investment_withdrawal para income

UPDATE transactions
SET type = 'income'
WHERE type = 'investment_withdrawal';

-- Parte 2: Criar investment_transactions faltantes para itens de projeto
-- com payment_origin='investment' que já foram pagos mas não geraram
-- investment_transaction (bug corrigido na migration)
INSERT INTO investment_transactions (investment_id, family_id, type, amount, date, notes, auto_generated)
SELECT
  pi.investment_id,
  p.family_id,
  'withdrawal',
  pi.actual_amount,
  COALESCE(t.paid_at::date, t.date, CURRENT_DATE),
  'Pagamento: ' || pi.name,
  false
FROM project_items pi
JOIN projects p ON p.id = pi.project_id
LEFT JOIN transactions t ON t.id = pi.transaction_id
WHERE pi.payment_origin = 'investment'
  AND pi.status = 'paid'
  AND pi.investment_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM investment_transactions it
    WHERE it.investment_id = pi.investment_id
      AND it.notes = 'Pagamento: ' || pi.name
      AND it.type = 'withdrawal'
  );
