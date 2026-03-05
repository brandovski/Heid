-- Migration 030: Fix historical data for project_items with payment_origin=investment
-- Context: Before session 033, the investment branch was unreachable (else-if ordering bug).
-- Items with payment_origin=investment incorrectly created extrato transactions.
-- Session 033 fixed the code, but historical data needs cleanup.

-- CASO B: confirmed + deposit_remainder + deposit_transaction_id IS NOT NULL
-- These items had the sinal paid to the extrato (wrong) without an investment_transaction.
-- Create the missing investment_transactions for each.
INSERT INTO investment_transactions (investment_id, family_id, type, amount, date, notes, auto_generated)
SELECT
  pi.investment_id,
  p.family_id,
  'withdrawal',
  pi.deposit_amount,
  COALESCE(t.paid_at::date, t.date::date, CURRENT_DATE),
  'Pagamento: ' || pi.name || ' — Sinal',
  false
FROM project_items pi
JOIN projects p ON p.id = pi.project_id
LEFT JOIN transactions t ON t.id = pi.deposit_transaction_id
WHERE pi.payment_origin = 'investment'
  AND pi.status = 'confirmed'
  AND pi.deposit_transaction_id IS NOT NULL
  AND pi.investment_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM investment_transactions it
    WHERE it.notes = 'Pagamento: ' || pi.name || ' — Sinal'
      AND it.investment_id = pi.investment_id
      AND it.type = 'withdrawal'
  );

-- CASO A: paid + cash + transaction_id IS NOT NULL
-- These items created a wrong extrato transaction; investment_transaction already exists (migration 029).
-- Delete the wrong extrato transactions (ON DELETE SET NULL will clear project_items.transaction_id).
DELETE FROM transactions
WHERE id IN (
  SELECT pi.transaction_id
  FROM project_items pi
  WHERE pi.payment_origin = 'investment'
    AND pi.status = 'paid'
    AND pi.payment_type = 'cash'
    AND pi.transaction_id IS NOT NULL
);

-- CASOS B e C: deposit_transaction_id wrong extrato transactions.
DELETE FROM transactions
WHERE id IN (
  SELECT pi.deposit_transaction_id
  FROM project_items pi
  WHERE pi.payment_origin = 'investment'
    AND pi.deposit_transaction_id IS NOT NULL
);

-- CASO C: remainder_transaction_id wrong extrato transactions (none currently, kept for safety).
DELETE FROM transactions
WHERE id IN (
  SELECT pi.remainder_transaction_id
  FROM project_items pi
  WHERE pi.payment_origin = 'investment'
    AND pi.remainder_transaction_id IS NOT NULL
);
