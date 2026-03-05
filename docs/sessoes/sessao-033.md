# Sessão 033 — Melhorias e Correções

**Data:** 2026-03-05
**Tipo:** Melhorias abrangentes + correção de bugs

---

## Resumo

Sessão de melhoria e correção em 7 áreas do sistema já completo (fases 1–11).

---

## Migrations aplicadas

| Migration | Arquivo | Descrição |
|-----------|---------|-----------|
| 026 | `026_subscriptions_promotional.sql` | `promotional_amount` + `promotional_months` em subscriptions |
| 027 | `027_categories_type.sql` | Coluna `type TEXT CHECK` em categories (já existia, adicionado CHECK) |
| 028 | `028_recorrencias_personal.sql` | Migra recorrências `scope=family` → `personal` + `is_shared=true` |
| 029 | `029_investment_withdrawal_to_income.sql` | `investment_withdrawal` → `income` + cria investment_transactions faltantes |

---

## Alterações por área

### 1. Assinaturas — Valor Promocional

- `AssinaturaModal.tsx` — toggle "Tem valor promocional?" + campos `promotional_amount` / `promotional_months`
- `api/assinaturas/route.ts` (POST) — inclui campos promocionais no INSERT
- `api/assinaturas/[id]/route.ts` (PATCH) — inclui campos promocionais no UPDATE
- `api/cron/generate-monthly/route.ts` — calcula `monthsActive`; se dentro do período, usa `promotional_amount` e label "(Promo)"
- `AssinaturaCard.tsx` — badge "Promo" (emerald) quando `monthsActive < promotional_months`
- `src/types/database.ts` — `promotional_amount: number | null`, `promotional_months: number | null` em `Subscription`

### 2. Investimentos — Tag de Contribuinte

- `investimentos/[id]/page.tsx` — query `profiles` da família passada como `members`
- `InvestimentoDetalhe.tsx` — recebe `members` prop; badge `bg-brand-100 text-brand-700` com nome do contribuinte em depósitos

### 3. Resgate de Investimento → Receita

- `api/investimentos/[id]/transacoes/route.ts` — `txType = "income"` para withdrawal (era `investment_withdrawal`)
- `transacoes/_components/types.ts` — `investment_withdrawal` removido de `INCOME_TYPES`, helper `getTypeLabel(type, investmentId)` para exibir "Resgate" por `investment_id`
- `TransacaoCard.tsx` — usa `getTypeLabel`
- `fluxo/_components/types.ts` — `investment_withdrawal` removido de `INCOME_TYPES` e `typeToBadge`
- `FluxoWidget.tsx` — income check sem `investment_withdrawal`
- `TransacaoModal.tsx` — income check sem `investment_withdrawal`
- `src/types/database.ts` — `investment_withdrawal` removido de `TransactionType`

### 4. Categorias — Tipo + Delete

- `src/types/database.ts` — `type: 'income' | 'expense' | null` em `Category`
- `CategoriaModal.tsx` — seletor de tipo (Ambos / Receita / Despesa)
- `CategoriaCard.tsx` — badge de tipo + botão Trash2 para arquivadas + ConfirmModal
- `CategoriaList.tsx` — seções "Receitas", "Despesas", "Receita ou Despesa"
- `api/categorias/route.ts` (GET) — inclui `type` no select; (POST) — aceita e insere `type`
- `api/categorias/[id]/route.ts` (PATCH) — aceita `type`; novo endpoint DELETE com verificação de vínculos
- `TransacaoModal.tsx` — filtra categorias por `type` baseado no tipo da transação
- `FixaModal.tsx` — filtra categorias por `type` (income para receitas, expense para despesas)
- Pages que fetcham categorias atualizadas para incluir `type`

### 5. Recorrências — Renaming + Remoção de Escopo

- `FixaModal.tsx` — títulos "Recorrente", `ScopeSelector` removido, `scope="personal"` hardcoded
- `FixaList.tsx` — labels atualizadas
- `fixas/page.tsx` — título "Recorrências"
- `api/receitas-fixas/route.ts` e `[id]/route.ts` — `scope="personal"`, `user_id=user.id`
- `api/despesas-fixas/route.ts` e `[id]/route.ts` — idem
- `Navbar.tsx` — `PAGE_TITLES["/fixas"] = "Recorrências"`
- `TransacaoList.tsx` — "Gerenciar Recorrências"
- `types.ts` transacoes — `fixed_income/fixed_expense: "Recorrente"`

### 6. Bug Projetos — Investimento não debitado

- `api/projetos/itens/[id]/pagar/route.ts` — bloco `payment_origin === "investment"` movido para ANTES dos branches de `payment_type`; bloco duplicado ao final removido

### 7. Bug Projetos — Saldo Real ignora entradas pagas

- `ProjetoDetalhe.tsx` — `depositosParciais` soma `deposit_amount` de itens `confirmed + deposit_transaction_id`; inclui no `gastoReal`
- `projetos/_components/types.ts` — `computeProjectStats` atualizado com a mesma lógica

---

## Arquivos alterados (25)

```
supabase/migrations/026_subscriptions_promotional.sql (novo)
supabase/migrations/027_categories_type.sql (novo)
supabase/migrations/028_recorrencias_personal.sql (novo)
supabase/migrations/029_investment_withdrawal_to_income.sql (novo)
src/types/database.ts
src/app/(app)/assinaturas/_components/AssinaturaModal.tsx
src/app/(app)/assinaturas/_components/AssinaturaCard.tsx
src/app/api/assinaturas/route.ts
src/app/api/assinaturas/[id]/route.ts
src/app/api/cron/generate-monthly/route.ts
src/app/(app)/investimentos/[id]/page.tsx
src/app/(app)/investimentos/[id]/_components/InvestimentoDetalhe.tsx
src/app/api/investimentos/[id]/transacoes/route.ts
src/app/(app)/transacoes/_components/types.ts
src/app/(app)/transacoes/_components/TransacaoCard.tsx
src/app/(app)/transacoes/_components/TransacaoModal.tsx
src/app/(app)/transacoes/_components/TransacaoList.tsx
src/app/(app)/fluxo/_components/types.ts
src/app/(app)/dashboard/_components/FluxoWidget.tsx
src/app/(app)/categorias/_components/CategoriaModal.tsx
src/app/(app)/categorias/_components/CategoriaCard.tsx
src/app/(app)/categorias/_components/CategoriaList.tsx
src/app/api/categorias/route.ts
src/app/api/categorias/[id]/route.ts
src/app/(app)/fixas/_components/FixaModal.tsx
src/app/(app)/fixas/_components/FixaList.tsx
src/app/(app)/fixas/page.tsx
src/app/api/receitas-fixas/route.ts
src/app/api/receitas-fixas/[id]/route.ts
src/app/api/despesas-fixas/route.ts
src/app/api/despesas-fixas/[id]/route.ts
src/app/api/projetos/itens/[id]/pagar/route.ts
src/app/(app)/projetos/[id]/_components/ProjetoDetalhe.tsx
src/app/(app)/projetos/_components/types.ts
src/components/Navbar.tsx
docs/diario-dev.md
docs/sessoes/sessao-033.md (novo)
```

---

## Zero erros TypeScript ✅
