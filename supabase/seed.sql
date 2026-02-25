-- =======================================================
-- Seed de categorias padrão
-- INSTRUÇÕES: substituir '<FAMILY_ID>' pelo UUID real do casal
-- antes de executar. Executar APÓS configurar o family_id
-- nos dois profiles (ver docs/setup.md).
-- =======================================================

DO $$
DECLARE
  v_family_id UUID := '<FAMILY_ID>';  -- <-- substituir aqui
BEGIN
  INSERT INTO categories (family_id, name, icon, color) VALUES
    -- Despesas
    (v_family_id, 'Alimentação',  '🍔', '#F97316'),
    (v_family_id, 'Transporte',   '🚗', '#3B82F6'),
    (v_family_id, 'Moradia',      '🏠', '#8B5CF6'),
    (v_family_id, 'Saúde',        '💊', '#EF4444'),
    (v_family_id, 'Lazer',        '🎮', '#10B981'),
    (v_family_id, 'Educação',     '📚', '#F59E0B'),
    (v_family_id, 'Vestuário',    '👕', '#EC4899'),
    (v_family_id, 'Outros',       '📦', '#6B7280'),
    -- Receitas
    (v_family_id, 'Salário',      '💼', '#22C55E'),
    (v_family_id, 'Freelance',    '💻', '#06B6D4'),
    (v_family_id, 'Investimentos','📈', '#A855F7');
END $$;
