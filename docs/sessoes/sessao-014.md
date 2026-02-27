# Sessão 014 — 2026-02-27

**Fase:** Correção de bugs pós-Sessão 013
**Resultado:** Concluído — pronto para Fase 9

---

## Objetivo

Corrigir dois bugs identificados após a reestruturação de escopo da Sessão 013:

1. Cartão do parceiro visível em `/cartoes` (cartão "Itaú Click" de Gabriel com `is_shared = true` incorreto)
2. Transações do parceiro ausentes no dashboard e em `/transacoes` aba "Parceiro" (coluna `is_shared` não existia no banco — só no tipo TypeScript)

---

## O que foi feito

### Data fix (via Management API — sem migration)

```sql
UPDATE credit_cards
SET is_shared = false
WHERE id = '55a19975-2ce2-49d1-997f-8b15f597d96d'
```

Cartão "Itaú Click" de Gabriel estava com `is_shared = true`, o que tornava o cartão visível para Heide via RLS (política `scoped_select` cobre `is_shared = true AND family_id = auth_family_id()`). Corrigido diretamente no dado — não é correção de schema.

### Migration 022 — `transactions.is_shared`

**Arquivo:** `supabase/migrations/022_transactions_is_shared.sql`

Executada em 3 passos:

**Passo A — Adicionar coluna:**
```sql
ALTER TABLE transactions
ADD COLUMN is_shared BOOLEAN NOT NULL DEFAULT FALSE;
```

**Passo B — Backfill:**
```sql
UPDATE transactions t
SET is_shared = true
FROM profiles p
WHERE t.user_id = p.id
  AND p.share_with_partner = true
  AND t.scope = 'personal';
```
→ 11 transações pessoais marcadas como `is_shared = true` para usuários com compartilhamento ativo.

**Passo C — Atualizar policy RLS `scoped_select` em transactions:**

Recria a policy adicionando nova cláusula:
```sql
(scope = 'personal' AND is_shared = true
 AND family_id = auth_family_id()
 AND user_id <> auth.uid())
```
Permite que o parceiro leia transações pessoais compartilhadas do usuário logado.

---

## Decisões tomadas

| Decisão | Motivo |
|---|---|
| Data fix via SQL direto (sem migration) | Correção pontual de dado incorreto, não de schema |
| `is_shared` definido na migration com backfill | Garante que transações existentes de usuários com `share_with_partner = true` já apareçam para o parceiro sem precisar re-criar |
| Nenhuma mudança de frontend | As queries em `dashboard/page.tsx` e `transacoes/page.tsx` já filtravam por `is_shared = true` corretamente — faltavam apenas a coluna e a cláusula RLS |

---

## Problemas encontrados

- `transactions.is_shared` não existia no banco apesar de estar nos tipos TypeScript e nas queries frontend — campo foi adicionado ao tipo TypeScript na Sessão 013 mas a migration correspondente não foi criada naquele momento
- Cartão "Itaú Click" herdou `is_shared = true` de uma criação anterior ao fix do `CartaoModal` (que agora hardcoda `is_shared = false`)

---

## Arquivos criados / modificados

```
supabase/migrations/
└── 022_transactions_is_shared.sql                ← novo

docs/diario-dev.md                                ← sessão 014 adicionada
docs/sessoes/sessao-014.md                        ← este arquivo
```

---

## Estado do banco ao final da sessão

Migrations aplicadas: 001–014, 016, 017 (Partes 1–4), 019, 020, 021, 022
Migrations diferidas: 015 (Fase 9), 017 Parte 5 (Fase 9), 018 (Fase 10)

---

## Próxima sessão

**Sessão 015 — UX: Navbar mobile glassmorphism**

- Navbar mobile flutuante com efeito glassmorphism (bottom-5, margens laterais, bg/60 + backdrop-blur-xl)
- Organização de commits acumulados (sessões 006–014 sem commit)
- Push para corrigir erro de build no Vercel
