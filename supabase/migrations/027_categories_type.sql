-- Migration 027: tipo de categoria (receita/despesa)
-- Null = aplica a ambos (retrocompatível com categorias existentes)

ALTER TABLE categories
  ADD COLUMN type TEXT CHECK (type IN ('income', 'expense'));
