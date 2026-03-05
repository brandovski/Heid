-- Migration 033: project_item_id em investment_transactions
-- Permite rastrear resgates de projeto na lista de movimentações

ALTER TABLE investment_transactions
ADD COLUMN project_item_id UUID REFERENCES project_items(id) ON DELETE SET NULL;

-- Backfill via investment_deposit_id (sinais já linkados)
UPDATE investment_transactions it
SET project_item_id = pi.id
FROM project_items pi
WHERE pi.investment_deposit_id = it.id;

-- Backfill via padrão de notes (pagamentos únicos e restantes)
UPDATE investment_transactions it
SET project_item_id = pi.id
FROM project_items pi
WHERE it.notes LIKE 'Pagamento: ' || pi.name || '%'
  AND it.investment_id = pi.investment_id
  AND pi.payment_origin = 'investment'
  AND it.project_item_id IS NULL;
