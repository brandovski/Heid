-- Migration 035: corrigir reference_month das faturas para mês de vencimento
-- Antes desta mudança, reference_month era o mês de fechamento (closing_month).
-- Após esta mudança, reference_month deve ser o mês de vencimento (due_month).
-- Para cartões onde due_day < closing_day, o vencimento é no mês seguinte ao fechamento.
-- Portanto, adiantamos reference_month em 1 mês para esses cartões.

UPDATE invoice_payments ip
SET reference_month = TO_CHAR(
  TO_DATE(ip.reference_month || '-01', 'YYYY-MM-DD') + INTERVAL '1 month',
  'YYYY-MM'
)
FROM credit_cards cc
WHERE ip.credit_card_id = cc.id
  AND cc.due_day < cc.closing_day
  AND ip.family_id = 'cbe6f412-d190-49de-a062-10cc17b9b77d';
