-- =======================================================
-- Migration 016: Atualizar RLS para suportar escopo
-- =======================================================
-- Substitui as políticas "family_access" simples por
-- políticas que respeitam scope = 'personal' | 'family'
-- e o compartilhamento voluntário (is_shared).
-- =======================================================

-- Helper: retorna o uid do usuário autenticado (para legibilidade)
CREATE OR REPLACE FUNCTION auth_user_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT auth.uid()
$$;


-- =======================================================
-- credit_cards
-- =======================================================
DROP POLICY IF EXISTS "family_access" ON credit_cards;

-- Leitura: família, pessoal próprio, ou pessoal compartilhado do parceiro
CREATE POLICY "scoped_select" ON credit_cards FOR SELECT USING (
  (scope = 'family'   AND family_id = auth_family_id())                             OR
  (scope = 'personal' AND user_id   = auth.uid())                                   OR
  (scope = 'personal' AND is_shared = true AND family_id = auth_family_id())
);

-- Escrita: família ou dono
CREATE POLICY "scoped_modify" ON credit_cards
  FOR INSERT WITH CHECK (
    (scope = 'family'   AND family_id = auth_family_id()) OR
    (scope = 'personal' AND user_id   = auth.uid())
  );
CREATE POLICY "scoped_update" ON credit_cards FOR UPDATE USING (
  (scope = 'family'   AND family_id = auth_family_id()) OR
  (scope = 'personal' AND user_id   = auth.uid())
);
CREATE POLICY "scoped_delete" ON credit_cards FOR DELETE USING (
  (scope = 'family'   AND family_id = auth_family_id()) OR
  (scope = 'personal' AND user_id   = auth.uid())
);


-- =======================================================
-- Macro aplicada em: fixed_incomes, fixed_expenses,
-- subscriptions, installment_groups
-- (mesma lógica: leitura com shared, escrita só pelo dono/família)
-- =======================================================

-- fixed_incomes
DROP POLICY IF EXISTS "family_access" ON fixed_incomes;
CREATE POLICY "scoped_select" ON fixed_incomes FOR SELECT USING (
  (scope = 'family'   AND family_id = auth_family_id())                             OR
  (scope = 'personal' AND user_id   = auth.uid())                                   OR
  (scope = 'personal' AND is_shared = true AND family_id = auth_family_id())
);
CREATE POLICY "scoped_modify" ON fixed_incomes FOR ALL USING (
  (scope = 'family'   AND family_id = auth_family_id()) OR
  (scope = 'personal' AND user_id   = auth.uid())
);

-- fixed_expenses
DROP POLICY IF EXISTS "family_access" ON fixed_expenses;
CREATE POLICY "scoped_select" ON fixed_expenses FOR SELECT USING (
  (scope = 'family'   AND family_id = auth_family_id())                             OR
  (scope = 'personal' AND user_id   = auth.uid())                                   OR
  (scope = 'personal' AND is_shared = true AND family_id = auth_family_id())
);
CREATE POLICY "scoped_modify" ON fixed_expenses FOR ALL USING (
  (scope = 'family'   AND family_id = auth_family_id()) OR
  (scope = 'personal' AND user_id   = auth.uid())
);

-- subscriptions
DROP POLICY IF EXISTS "family_access" ON subscriptions;
CREATE POLICY "scoped_select" ON subscriptions FOR SELECT USING (
  (scope = 'family'   AND family_id = auth_family_id())                             OR
  (scope = 'personal' AND user_id   = auth.uid())                                   OR
  (scope = 'personal' AND is_shared = true AND family_id = auth_family_id())
);
CREATE POLICY "scoped_modify" ON subscriptions FOR ALL USING (
  (scope = 'family'   AND family_id = auth_family_id()) OR
  (scope = 'personal' AND user_id   = auth.uid())
);

-- installment_groups
DROP POLICY IF EXISTS "family_access" ON installment_groups;
CREATE POLICY "scoped_select" ON installment_groups FOR SELECT USING (
  (scope = 'family'   AND family_id = auth_family_id())                             OR
  (scope = 'personal' AND user_id   = auth.uid())                                   OR
  (scope = 'personal' AND is_shared = true AND family_id = auth_family_id())
);
CREATE POLICY "scoped_modify" ON installment_groups FOR ALL USING (
  (scope = 'family'   AND family_id = auth_family_id()) OR
  (scope = 'personal' AND user_id   = auth.uid())
);


-- =======================================================
-- transactions
-- =======================================================
DROP POLICY IF EXISTS "family_access" ON transactions;

-- Transações de família: ambos veem e editam
-- Transações pessoais: só o dono edita
-- Transações pessoais compartilhadas: parceiro vê (via is_shared na entidade-pai)
-- Nota: transações não têm is_shared próprio — a visibilidade é herdada
-- da entidade que as originou (cartão, despesa fixa, etc.)
-- Para transações manuais pessoais, o parceiro não vê por padrão.
CREATE POLICY "scoped_select" ON transactions FOR SELECT USING (
  (scope = 'family'   AND family_id = auth_family_id()) OR
  (scope = 'personal' AND user_id   = auth.uid())       OR
  -- Transações geradas por entidades compartilhadas
  (scope = 'personal' AND family_id = auth_family_id() AND (
    (credit_card_id       IN (SELECT id FROM credit_cards       WHERE is_shared = true AND user_id != auth.uid())) OR
    (fixed_income_id      IN (SELECT id FROM fixed_incomes      WHERE is_shared = true AND user_id != auth.uid())) OR
    (fixed_expense_id     IN (SELECT id FROM fixed_expenses     WHERE is_shared = true AND user_id != auth.uid())) OR
    (subscription_id      IN (SELECT id FROM subscriptions      WHERE is_shared = true AND user_id != auth.uid())) OR
    (installment_group_id IN (SELECT id FROM installment_groups WHERE is_shared = true AND user_id != auth.uid()))
  ))
);
CREATE POLICY "scoped_modify" ON transactions FOR ALL USING (
  (scope = 'family'   AND family_id = auth_family_id()) OR
  (scope = 'personal' AND user_id   = auth.uid())
);


-- =======================================================
-- budgets
-- =======================================================
DROP POLICY IF EXISTS "family_access" ON budgets;
CREATE POLICY "scoped_select" ON budgets FOR SELECT USING (
  (scope = 'family'   AND family_id = auth_family_id()) OR
  (scope = 'personal' AND user_id   = auth.uid())
);
CREATE POLICY "scoped_modify" ON budgets FOR ALL USING (
  (scope = 'family'   AND family_id = auth_family_id()) OR
  (scope = 'personal' AND user_id   = auth.uid())
);
