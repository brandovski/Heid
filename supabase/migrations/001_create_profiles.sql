-- profiles: extensão do auth.users
-- family_id é nullable no momento da criação e preenchido manualmente
-- após cadastro dos dois usuários no Supabase Auth.
-- Não possui FK para outros registros pois o mesmo UUID é compartilhado
-- pelos dois usuários do casal — integridade garantida pelo RLS.

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id   UUID,
  full_name   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index para performance nas queries de RLS
CREATE INDEX idx_profiles_family_id ON profiles(family_id);
