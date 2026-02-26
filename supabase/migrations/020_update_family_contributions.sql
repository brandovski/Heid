-- =======================================================
-- Migration 020: family_contributions — aportes reais
-- =======================================================
-- Muda o modelo de "configuração de valor mensal" para
-- "registro de aporte efetivo". Cada linha agora representa
-- um pagamento real feito ao Caixa Familiar, vinculado à
-- despesa pessoal gerada no mesmo ato.
--
-- Saldo do Caixa Familiar (recalculado):
--   total disponível = SUM(family_contributions.amount no mês)
--   saldo = total disponível − SUM(transactions scope='family' no mês)
-- =======================================================

-- 1. Remover constraint unique (múltiplos aportes por mês são válidos)
ALTER TABLE family_contributions
  DROP CONSTRAINT IF EXISTS family_contributions_family_id_user_id_effective_from_key;

-- 2. Renomear effective_from → date (data do aporte realizado)
ALTER TABLE family_contributions RENAME COLUMN effective_from TO date;

-- 3. Vincular ao registro de despesa pessoal gerado no aporte
ALTER TABLE family_contributions
  ADD COLUMN transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL;

-- 4. Índice para consultas por intervalo de mês
CREATE INDEX idx_family_contributions_family_date
  ON family_contributions(family_id, date);
