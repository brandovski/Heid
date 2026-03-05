-- Migration 032: Adiciona paid_at em project_items
-- Sessão 035 — Armazena a data real do pagamento (pode diferir de hoje
-- quando o usuário usa o picker de data para registrar pagamentos passados).

ALTER TABLE project_items
ADD COLUMN paid_at DATE;

-- Backfill: usa updated_at::date como aproximação para itens já pagos
UPDATE project_items
SET paid_at = updated_at::date
WHERE status = 'paid' AND paid_at IS NULL;
