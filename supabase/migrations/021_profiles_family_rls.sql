-- Permite que usuários leiam perfis de outros membros da mesma família.
-- Resolve: nome do parceiro mostrando "Parceiro" e contribuições não visíveis em /familia.
--
-- PostgreSQL combina policies SELECT com OR (permissive), então:
--   - profiles_select_own:            id = auth.uid()           (já existe)
--   - profiles_select_family_members: family_id = auth_family_id() (nova)
-- O usuário vê o próprio perfil OU qualquer perfil da família.
-- Usuários sem família (family_id IS NULL) não veem nenhum outro perfil.
--
-- IMPORTANTE: auth_family_id() deve ser SECURITY DEFINER para evitar recursão
-- infinita (a policy chama a função que lê profiles, que aciona a policy de novo).
-- Recriar a função como SECURITY DEFINER antes de criar a policy.

CREATE OR REPLACE FUNCTION auth_family_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT family_id FROM profiles WHERE id = auth.uid()
$$;

CREATE POLICY "profiles_select_family_members"
  ON profiles FOR SELECT
  USING (family_id IS NOT NULL AND family_id = auth_family_id());
