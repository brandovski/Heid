# Sessão 034 — Correção de Bugs Pós-Sessão 033

**Data:** 2026-03-05
**Status:** Concluída

---

## Contexto

Dois bugs identificados após a sessão 033:

1. **Bug 1** — Cards de projeto na listagem exibiam `gasto_real` desatualizado (ignorava entradas pagas de itens `confirmed`)
2. **Bug 2** — Investimentos: deduções de entradas de projeto (sinal/deposit_amount) não apareciam; itens com `payment_origin=investment` haviam criado transações erradas no extrato financeiro

---

## Bug 1 — Card de Projeto: gasto_real Ignorava Entradas Pagas

### Causa raiz
`src/app/(app)/projetos/page.tsx` selecionava apenas:
```
"id, project_id, status, budget_amount, actual_amount"
```
Os campos `deposit_transaction_id` e `deposit_amount` não eram buscados, então `computeProjectStats` sempre calculava `depositosParciais = 0`.

### Fix (1 arquivo)
`src/app/(app)/projetos/page.tsx` — adicionados `deposit_transaction_id` e `deposit_amount` ao select e ao tipo `Pick<ProjectItem, ...>`.

---

## Bug 2 — Investimentos: Deduções e Transações Incorretas

### Análise dos dados afetados (consultados via Management API)

**5 itens com `payment_origin=investment`:**

| Item | Status | payment_type | Situação |
|------|--------|-------------|---------|
| Fotografia e Filmmaker - Favacho | paid | cash | Tinha transação errada no extrato; investment_transaction já criada pela migration 029 ✓ |
| Assessoria | confirmed | deposit_remainder | Tinha transação errada no extrato (sinal); sem investment_transaction ✗ |
| Open Bar | confirmed | deposit_remainder | Tinha transação errada no extrato (sinal); sem investment_transaction ✗ |
| Dia da Noiva | confirmed | deposit_remainder | Tinha transação errada no extrato (sinal); sem investment_transaction ✗ |
| Local - Villa Tarumã Açú | confirmed | deposit_remainder | Tinha transação errada no extrato (sinal); sem investment_transaction ✗ |

### Fix 2A — Migration 030

**Arquivo:** `supabase/migrations/030_fix_investment_project_items.sql`

Executada via Management API em 3 passos:
1. **Criou 4 investment_transactions** (withdrawal) para os itens `confirmed` com `deposit_amount`: Assessoria (750), Open Bar (1250), Dia da Noiva (225), Villa Tarumã Açú (3150)
2. **Deletou 1 transação de extrato errada (Caso A):** Fotografia e Filmmaker — 3612.50
3. **Deletou 4 transações de extrato erradas (Caso B):** os 4 sinais acima

FK constraints com `ON DELETE SET NULL` — referências em `project_items` foram nulladas automaticamente.

### Fix 2B — Suporte two-step deposit_remainder + investment

**Arquivo:** `src/app/api/projetos/itens/[id]/pagar/route.ts`

O branch `investment` agora suporta os dois passos corretamente:
- Se `payment_type === "deposit_remainder"` e `!deposit_transaction_id`: Passo 1 — cria `investment_transaction` para `deposit_amount`, salva `deposit_transaction_id`
- Se `payment_type === "deposit_remainder"` e `deposit_transaction_id` já existe: Passo 2 — cria `investment_transaction` para o restante, status → `paid`
- Outros tipos (cash, card): pagamento único via investment, sem mudança

---

## Arquivos Alterados

```
supabase/migrations/030_fix_investment_project_items.sql  (novo)
src/app/(app)/projetos/page.tsx
src/app/api/projetos/itens/[id]/pagar/route.ts
```

## Verificação

- [x] `tsc --noEmit` — zero erros
- [x] 4 investment_transactions criadas para itens confirmed (Caso B)
- [x] 5 transações erradas do extrato deletadas (1 Caso A + 4 Caso B)
- [x] Card de projeto na listagem agora recebe `deposit_transaction_id` e `deposit_amount` → `computeProjectStats` calcula corretamente
- [x] Two-step deposit_remainder + investment: Passo 1 cria withdrawal do sinal, Passo 2 cria withdrawal do restante
