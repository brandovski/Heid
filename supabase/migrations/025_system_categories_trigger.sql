-- =======================================================
-- Migration 025: Categorias de sistema via trigger
-- =======================================================
-- Problema: migration 023 inseriu as 3 categorias de sistema
-- com family_id hardcoded. Se uma nova família for adicionada,
-- ela não terá as categorias de sistema e as APIs de aporte/
-- investimento falharão silenciosamente.
--
-- Solução: criar uma função + trigger que insere as categorias
-- de sistema automaticamente para cada família nova, e
-- garantir que todas as famílias existentes as tenham.
-- =======================================================

-- Parte 1: função que insere categorias de sistema para uma família
CREATE OR REPLACE FUNCTION insert_system_categories_for_family(p_family_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO categories (family_id, name, icon, color, is_system)
  VALUES
    (p_family_id, 'Projeto',        '🏗️', '#2563EB', true),
    (p_family_id, 'Caixa Familiar', '🤝', '#7C3AED', true),
    (p_family_id, 'Investimento',   '📈', '#059669', true)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Parte 2: trigger que dispara ao inserir um novo profile
-- (ou seja, ao entrar uma nova família no sistema)
CREATE OR REPLACE FUNCTION trigger_system_categories_on_new_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verifica se já existem categorias de sistema para essa família
  -- (evita duplicatas se dois profiles da mesma família forem inseridos)
  IF NOT EXISTS (
    SELECT 1 FROM categories
    WHERE family_id = NEW.family_id AND is_system = true
    LIMIT 1
  ) THEN
    PERFORM insert_system_categories_for_family(NEW.family_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_system_categories_on_new_profile ON profiles;
CREATE TRIGGER trg_system_categories_on_new_profile
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_system_categories_on_new_profile();

-- Parte 3: garantir que todas as famílias existentes tenham as categorias
-- (backfill para famílias que não têm — excluindo a família já populada pela 023)
DO $$
DECLARE
  fam UUID;
BEGIN
  FOR fam IN
    SELECT DISTINCT family_id FROM profiles
    WHERE family_id NOT IN (
      SELECT DISTINCT family_id FROM categories WHERE is_system = true
    )
  LOOP
    PERFORM insert_system_categories_for_family(fam);
  END LOOP;
END;
$$;
