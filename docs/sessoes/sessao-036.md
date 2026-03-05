# Sessão 036 — Investimentos + Assinaturas

**Data:** 2026-03-05
**Tipo:** Correções de bug + melhorias funcionais
**Status:** Concluída
**Commit:** `4591e65`

---

## Contexto

Três melhorias independentes identificadas após a conclusão das fases principais:

1. **Resgate → transação pessoal incorreta** — a API usava o dono do investimento (não quem fez o resgate) como `user_id` da transação, e o `scope` do investimento em vez de `"personal"`. `contributor_user_id` também não era salvo em resgates.

2. **Tags nos resgates** — a lista de movimentações exibia o badge de contribuinte apenas para aportes. Resgates precisavam de (a) badge do resgatador em investimentos familiares e (b) badge "Projeto · Nome" quando o resgate é pagamento de item de projeto.

3. **Assinaturas sem escopo familiar** — assinaturas são sempre pessoais por natureza. O `ScopeSelector` no modal confundia mais do que ajudava.

---

## Parte A — Fix: Resgate → Transação Pessoal

### Problema

`src/app/api/investimentos/[id]/transacoes/route.ts` usava:

```typescript
// ERRADO
const txScope  = type === "deposit" ? "personal" : investment.scope;   // withdrawal → scope do investimento
const txUserId = type === "deposit" ? user.id : investment.user_id;    // withdrawal → dono, não quem resgatou
```

Para um investimento familiar, o resgate criava uma transação com `scope="family"` e `user_id=null`, aparecendo no Caixa Familiar em vez do extrato pessoal de quem resgatou.

Além disso, `contributor_user_id` só era salvo em aportes — impossibilitando rastrear o resgatador em investimentos familiares.

### Solução

```typescript
// CORRETO
const txScope  = "personal";  // sempre pessoal
const txUserId = user.id;     // quem está fazendo o resgate agora

// contributor_user_id setado para ambos deposit e withdrawal:
invTxInsert.contributor_user_id = user.id;
```

### Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/app/api/investimentos/[id]/transacoes/route.ts` | `txScope="personal"`, `txUserId=user.id` para withdrawal; `contributor_user_id` sempre setado |

---

## Parte B — Tags nos Resgates

### Migration 033

Nova coluna `project_item_id` em `investment_transactions` para rastrear quais resgates são pagamentos de itens de projeto:

```sql
ALTER TABLE investment_transactions
ADD COLUMN project_item_id UUID REFERENCES project_items(id) ON DELETE SET NULL;

-- Backfill via investment_deposit_id (4 sinais já linkados)
UPDATE investment_transactions it
SET project_item_id = pi.id
FROM project_items pi
WHERE pi.investment_deposit_id = it.id;

-- Backfill via notes (pagamentos únicos — ex: Fotografia e Filmmaker)
UPDATE investment_transactions it
SET project_item_id = pi.id
FROM project_items pi
WHERE it.notes LIKE 'Pagamento: ' || pi.name || '%'
  AND it.investment_id = pi.investment_id
  AND pi.payment_origin = 'investment'
  AND it.project_item_id IS NULL;
```

**Resultado do backfill:**
- 4 sinais linkados via `investment_deposit_id`: Dia da Noiva, Assessoria, Villa Tarumã Açú, Open Bar
- 1 pagamento único linkado via notes: Fotografia e Filmmaker - Favacho

### `pagar/route.ts` — project_item_id nos inserts

Os 3 inserts de `investment_transactions` (sinal, restante, pagamento único) passam agora `project_item_id: params.id`:

```typescript
await supabase.from("investment_transactions").insert({
  // ... outros campos ...
  project_item_id: params.id,   // novo
});
```

### InvestimentoDetalhe — novos badges

**Badge do contribuinte (agora em aportes E resgates):**

```tsx
// Antes: {tx.type === "deposit" && tx.contributor_user_id && ...}
// Depois: qualquer tipo
{tx.contributor_user_id && (() => {
  const m = members.find((m) => m.id === tx.contributor_user_id);
  return m ? (
    <span className="... bg-brand-100 text-brand-700">{m.full_name}</span>
  ) : null;
})()}
```

**Badge de projeto (novo):**

```tsx
{(() => {
  const pi = projectItems.find((p) => p.id === tx.project_item_id);
  const proj = Array.isArray(pi?.project) ? pi?.project[0] : pi?.project;
  return proj ? (
    <span className="... bg-purple-100 text-purple-700">Projeto · {proj.name}</span>
  ) : null;
})()}
```

> Supabase retorna o join `project:projects(id, name)` como array no tipo inferido — tratado via `Array.isArray()`.

### Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `supabase/migrations/033_investment_tx_project_item_id.sql` | Nova migration |
| `src/types/database.ts` | `project_item_id: string \| null` em `InvestmentTransaction` |
| `src/app/api/projetos/itens/[id]/pagar/route.ts` | `project_item_id: params.id` nos 3 inserts |
| `src/app/(app)/investimentos/[id]/page.tsx` | Select inclui `investment_deposit_id` e `project:projects(id, name)` |
| `src/app/(app)/investimentos/[id]/_components/InvestimentoDetalhe.tsx` | Interface `ProjectItemRef` + 2 novos badges |

---

## Parte C — Assinaturas: Sempre Pessoais

### Motivação

Assinaturas são inerentemente pessoais (Netflix, Spotify, etc.). A presença do `ScopeSelector` era confusa e desnecessária — nunca há motivo real para uma assinatura ser "familiar".

### Migration 034

```sql
UPDATE subscriptions
SET scope = 'personal',
    user_id = '6665da54-7400-4fb0-94dd-1cbd1c4d182d'  -- User 2 (Parceira)
WHERE scope = 'family';
```

Migrou: Netflix, Google One, Live Academia → `scope=personal`, `user_id=User2`.

### UI — AssinaturaModal

Removidos:
- `import ScopeSelector`
- Estados `scope` e `isShared`
- Campos `scope` e `is_shared` do payload POST/PATCH

### APIs

**`POST /api/assinaturas`** — scope hardcoded:
```typescript
scope: "personal",
user_id: user.id,
is_shared: false,
```

**`PATCH /api/assinaturas/[id]`** — removido bloco de atualização de scope:
```typescript
// REMOVIDO
if (scope !== undefined) {
  updates.scope = scope;
  updates.user_id = scope === "personal" ? user.id : null;
  updates.is_shared = scope === "personal" ? (is_shared ?? false) : false;
}
```

### AssinaturaCard

Removidos `scopeColor` e o badge "Pessoal"/"Familiar" — informação redundante pois todas são pessoais agora.

### Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `supabase/migrations/034_subscriptions_personal_only.sql` | Nova migration |
| `src/app/(app)/assinaturas/_components/AssinaturaModal.tsx` | ScopeSelector e estados removidos |
| `src/app/api/assinaturas/route.ts` | Scope hardcoded=personal |
| `src/app/api/assinaturas/[id]/route.ts` | Bloco de atualização de scope removido |
| `src/app/(app)/assinaturas/_components/AssinaturaCard.tsx` | Badge de escopo removido |

---

## Migrations Aplicadas

| # | Arquivo | Operação |
|---|---------|----------|
| 033 | `033_investment_tx_project_item_id.sql` | ADD COLUMN + backfill |
| 034 | `034_subscriptions_personal_only.sql` | UPDATE data migration |

---

## Verificação Final

- [x] Novo resgate: income aparece no extrato do usuário autenticado (scope=personal, user_id=quem resgatou)
- [x] Resgate em investimento familiar: badge com nome do resgatador na lista de movimentações
- [x] Resgates de projeto existentes: badge "Projeto · Nome" via backfill da migration 033 (5 transações linkadas)
- [x] Futuros resgates de projeto: badge "Projeto · Nome" via `project_item_id` setado em pagar/route.ts
- [x] Netflix, Google One, Live Academia: scope=personal, user_id=User2 (verificado via query)
- [x] AssinaturaModal: sem ScopeSelector
- [x] AssinaturaCard: sem badge Familiar/Pessoal
- [x] `tsc --noEmit` sem erros
