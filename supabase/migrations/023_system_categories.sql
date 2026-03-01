-- Migration 023: categorias de sistema
-- Adiciona coluna is_system e insere categorias automáticas (Projeto, Caixa Familiar, Investimento)
-- Estas categorias não são exibidas na UI e não podem ser editadas pelo usuário.

-- Parte 1: adicionar coluna
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false;

-- Parte 2: inserir categorias de sistema para a family
INSERT INTO categories (family_id, name, icon, color, is_system)
VALUES
  ('cbe6f412-d190-49de-a062-10cc17b9b77d', 'Projeto',        '🏗️', '#2563EB', true),
  ('cbe6f412-d190-49de-a062-10cc17b9b77d', 'Caixa Familiar', '🤝', '#7C3AED', true),
  ('cbe6f412-d190-49de-a062-10cc17b9b77d', 'Investimento',   '📈', '#059669', true);
