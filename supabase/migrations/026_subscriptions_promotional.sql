-- Migration 026: valor promocional em assinaturas
-- Adiciona colunas para período promocional (ex: primeiros 3 meses com desconto)

ALTER TABLE subscriptions
  ADD COLUMN promotional_amount NUMERIC(12,2),
  ADD COLUMN promotional_months INTEGER CHECK (promotional_months > 0),
  ADD CONSTRAINT chk_subscriptions_promotional
    CHECK ((promotional_amount IS NULL) = (promotional_months IS NULL));
