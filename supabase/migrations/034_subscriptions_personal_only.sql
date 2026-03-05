-- Migration 034: assinaturas são sempre pessoais
-- Netflix, Google One, Live Academia → User 2 (Parceira)

UPDATE subscriptions
SET scope = 'personal',
    user_id = '6665da54-7400-4fb0-94dd-1cbd1c4d182d'
WHERE scope = 'family';
