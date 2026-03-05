-- Migration 028: migrar recorrências family → personal com is_shared=true
-- Remove o conceito de escopo "family" das recorrências; agora todas são
-- pessoais com is_shared=true para indicar que afetam o caixa familiar.

UPDATE fixed_incomes fi
SET scope = 'personal',
    user_id = (SELECT id FROM profiles WHERE family_id = fi.family_id ORDER BY created_at LIMIT 1),
    is_shared = true
WHERE scope = 'family';

UPDATE fixed_expenses fe
SET scope = 'personal',
    user_id = (SELECT id FROM profiles WHERE family_id = fe.family_id ORDER BY created_at LIMIT 1),
    is_shared = true
WHERE scope = 'family';
