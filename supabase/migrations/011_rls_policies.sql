-- =======================================================
-- RLS: Profiles
-- =======================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- INSERT é feito pelo trigger handle_new_user com SECURITY DEFINER
-- (roda com privilégios elevados, sem necessidade de policy de INSERT)


-- =======================================================
-- Função helper: retorna o family_id do usuário autenticado
-- Marcada como STABLE: Postgres pode cachear por transação,
-- evitando múltiplos subqueries para cada linha avaliada pelo RLS.
-- =======================================================
CREATE OR REPLACE FUNCTION auth_family_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT family_id FROM profiles WHERE id = auth.uid()
$$;


-- =======================================================
-- RLS: demais tabelas — política de family_id
-- =======================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_access" ON categories
  FOR ALL USING (family_id = auth_family_id());

ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_access" ON credit_cards
  FOR ALL USING (family_id = auth_family_id());

ALTER TABLE fixed_incomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_access" ON fixed_incomes
  FOR ALL USING (family_id = auth_family_id());

ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_access" ON fixed_expenses
  FOR ALL USING (family_id = auth_family_id());

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_access" ON subscriptions
  FOR ALL USING (family_id = auth_family_id());

ALTER TABLE installment_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_access" ON installment_groups
  FOR ALL USING (family_id = auth_family_id());

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_access" ON transactions
  FOR ALL USING (family_id = auth_family_id());

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_access" ON budgets
  FOR ALL USING (family_id = auth_family_id());

ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_access" ON invoice_payments
  FOR ALL USING (family_id = auth_family_id());
