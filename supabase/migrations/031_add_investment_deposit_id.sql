-- Migration 031: Adiciona investment_deposit_id em project_items
-- Sessão 035 — Correção de bug: deposit_transaction_id tem FK para transactions(id),
-- mas código tentava salvar investment_transactions.id → violação de FK.
-- Nova coluna com FK correta para investment_transactions(id).

-- 1. Adicionar coluna
ALTER TABLE project_items
ADD COLUMN investment_deposit_id UUID REFERENCES investment_transactions(id) ON DELETE SET NULL;

-- 2. Backfill: linkar investment_transactions existentes (criadas em migration 030) aos project_items
UPDATE project_items pi
SET investment_deposit_id = it.id
FROM investment_transactions it
WHERE it.notes = 'Pagamento: ' || pi.name || ' — Sinal'
  AND it.investment_id = pi.investment_id
  AND it.type = 'withdrawal'
  AND pi.payment_origin = 'investment'
  AND pi.payment_type = 'deposit_remainder'
  AND pi.status = 'confirmed'
  AND pi.investment_deposit_id IS NULL;

-- 3. Limpar duplicatas: para cada item com investment_deposit_id populado,
--    deletar investment_transactions extras com o mesmo padrão de notes e investment_id,
--    exceto a que está referenciada.
DELETE FROM investment_transactions
WHERE id NOT IN (
  SELECT investment_deposit_id FROM project_items WHERE investment_deposit_id IS NOT NULL
  UNION ALL
  SELECT id FROM investment_transactions WHERE notes NOT LIKE '% — Sinal'
)
AND notes LIKE 'Pagamento:% — Sinal';
