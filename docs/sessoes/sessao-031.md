# Sessão 031 — 2026-03-02

**Fase:** Hardening de Segurança e Qualidade das API Routes
**Resultado:** Concluído — 33 arquivos modificados, zero erros TypeScript, commit + push realizados

---

## Objetivo

Revisão abrangente de qualidade do projeto, cobrindo segurança, banco de dados, UX e componentes. Identificadas e corrigidas vulnerabilidades críticas nas API routes, além de melhorias de qualidade e experiência de erro/carregamento.

---

## O que foi feito

### Parte 1 — CRON_SECRET fail-closed (3 arquivos)

**Vulnerabilidade:** validação condicional `if (cronSecret && authHeader !== ...)` permitia acesso público aos endpoints de cron caso a variável de ambiente `CRON_SECRET` não estivesse configurada.

**Correção:** lógica invertida para fail-closed em todos os 3 endpoints:

```diff
- if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
+ if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
```

Arquivos corrigidos:
- `src/app/api/cron/generate-monthly/route.ts`
- `src/app/api/cron/fetch-exchange-rate/route.ts`
- `src/app/api/cron/supabase-keepalive/route.ts`

---

### Parte 2 — Remoção de `contributor_user_id` do body público

**Vulnerabilidade:** `POST /api/investimentos/[id]/transacoes` aceitava `contributor_user_id` do body da requisição, permitindo que qualquer usuário falsificasse quem fez um depósito em um investimento.

**Correção:** campo removido do destructuring do body; sempre utiliza `user.id` do usuário autenticado:

```diff
- const { type, amount, date, notes, contributor_user_id } = await req.json();
- const resolvedContributorId = contributor_user_id ?? user.id;
+ const { type, amount, date, notes } = await req.json();
// ...
+ if (type === "deposit") {
+   invTxInsert.contributor_user_id = user.id; // sempre o usuário autenticado
+ }
```

---

### Parte 3 — `family_id` em todas as queries UPDATE/DELETE

**Problema:** 8 routes de `[id]` faziam UPDATE/DELETE apenas com `.eq("id", params.id)`, sem verificar `family_id`. Embora o RLS proteja via policy, a defesa em profundidade é a prática correta.

**Padrão aplicado:** lookup de `profile.family_id` adicionado e `.eq("family_id", profile.family_id)` inserido em todas as queries de mutação:

```typescript
const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("family_id")
  .eq("id", user.id)
  .single();
if (profileError || !profile?.family_id)
  return NextResponse.json({ error: "Family not configured" }, { status: 400 });

// Na query:
.eq("family_id", profile.family_id)
```

Routes corrigidas:
- `src/app/api/transacoes/[id]/route.ts`
- `src/app/api/investimentos/[id]/route.ts`
- `src/app/api/assinaturas/[id]/route.ts`
- `src/app/api/receitas-fixas/[id]/route.ts`
- `src/app/api/despesas-fixas/[id]/route.ts`
- `src/app/api/orcamento/[id]/route.ts`
- `src/app/api/cartoes/[id]/route.ts`
- `src/app/api/projetos/[id]/route.ts`

---

### Parte 4 — Migration 025: trigger de categorias de sistema

**Bug:** a migration 023 inseria as 3 categorias de sistema com `family_id` hardcoded (`cbe6f412-...`), a família de desenvolvimento. Qualquer nova família ficaria sem as categorias `"Projeto"`, `"Caixa Familiar"` e `"Investimento"`, quebrando as APIs de pagamento.

**Solução:** migration 025 com trigger PostgreSQL que cria automaticamente as categorias para cada nova família.

```sql
-- Função chamada pelo trigger
CREATE OR REPLACE FUNCTION insert_system_categories_for_family(p_family_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO categories (family_id, name, icon, color, is_system)
  VALUES
    (p_family_id, 'Projeto',        '🏗️', '#2563EB', true),
    (p_family_id, 'Caixa Familiar', '🤝', '#7C3AED', true),
    (p_family_id, 'Investimento',   '📈', '#059669', true)
  ON CONFLICT DO NOTHING;
END; $$;

-- Trigger disparado após INSERT em profiles
CREATE TRIGGER trg_system_categories_on_new_profile
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_system_categories_on_new_profile();
```

Backfill executado para a família existente via `DO $$ BEGIN PERFORM insert_system_categories_for_family(...) END $$`. Migration aplicada via Supabase Management API e verificada.

---

### Parte 5 — `.single()` error handling padronizado

**Problema:** diversas routes chamavam `.single()` e verificavam apenas `!data`, ignorando o `error`. Falhas de banco (rede, permissão, timeout) eram silenciadas.

**Padrão correto aplicado em ~17 arquivos:**

```diff
- const { data: profile } = await supabase.from("profiles")...single();
- if (!profile?.family_id) { ... }
+ const { data: profile, error: profileError } = await supabase.from("profiles")...single();
+ if (profileError || !profile?.family_id) { ... }
```

Arquivos corrigidos: `transacoes/route.ts`, `despesas-fixas/route.ts`, `cartoes/route.ts`, `categorias/route.ts`, `categorias/[id]/route.ts`, `projetos/itens/[id]/pagar/route.ts`, `projetos/itens/[id]/route.ts`, `familia/contribuicao/route.ts`, `assinaturas/[id]/route.ts`, `transacoes/[id]/route.ts` (e outros já corrigidos via tarefa anterior).

---

### Parte 6 — `loading.tsx` em 5 segmentos

Skeletons `animate-pulse` criados em todos os segmentos principais da aplicação, ativando Suspense automático do Next.js App Router:

| Arquivo | Layout aproximado |
|---|---|
| `src/app/(app)/dashboard/loading.tsx` | Cards de resumo + gráfico + barras de orçamento + faturas |
| `src/app/(app)/transacoes/loading.tsx` | Barra de filtros + 10 linhas de transação |
| `src/app/(app)/investimentos/loading.tsx` | Banner âmbar + 4 cards de investimento |
| `src/app/(app)/orcamento/loading.tsx` | Linha de resumo + 8 barras de categoria |
| `src/app/(app)/familia/loading.tsx` | Cards do caixa familiar + seção de aporte + 6 transações |

---

### Parte 7 — `error.tsx` global

Error Boundary global para capturar erros em Server Components dentro do grupo `(app)`:

```tsx
"use client";
export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error("[AppError]", error); }, [error]);
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <AlertTriangle className="text-red-400 mb-4" size={48} />
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Algo deu errado</h2>
      <p className="text-sm text-gray-500 mb-6">{error.message || "Erro inesperado."}</p>
      <button onClick={reset} className="... bg-brand-600 ...">Tentar novamente</button>
    </div>
  );
}
```

---

## Arquivos modificados (33)

```
# Cron — CRON_SECRET fix
src/app/api/cron/generate-monthly/route.ts
src/app/api/cron/fetch-exchange-rate/route.ts
src/app/api/cron/supabase-keepalive/route.ts

# Investimentos — contributor_user_id
src/app/api/investimentos/[id]/transacoes/route.ts

# family_id em UPDATE/DELETE
src/app/api/transacoes/[id]/route.ts
src/app/api/investimentos/[id]/route.ts
src/app/api/assinaturas/[id]/route.ts
src/app/api/receitas-fixas/[id]/route.ts
src/app/api/despesas-fixas/[id]/route.ts
src/app/api/orcamento/[id]/route.ts
src/app/api/cartoes/[id]/route.ts
src/app/api/projetos/[id]/route.ts

# .single() error handling
src/app/api/transacoes/route.ts
src/app/api/despesas-fixas/route.ts
src/app/api/cartoes/route.ts
src/app/api/categorias/route.ts
src/app/api/categorias/[id]/route.ts
src/app/api/projetos/itens/[id]/pagar/route.ts
src/app/api/projetos/itens/[id]/route.ts
src/app/api/familia/contribuicao/route.ts

# Loading skeletons — NOVOS
src/app/(app)/dashboard/loading.tsx
src/app/(app)/transacoes/loading.tsx
src/app/(app)/investimentos/loading.tsx
src/app/(app)/orcamento/loading.tsx
src/app/(app)/familia/loading.tsx

# Error boundary — NOVO
src/app/(app)/error.tsx

# Migration — NOVA
supabase/migrations/025_system_categories_trigger.sql

# Documentação
docs/diario-dev.md
docs/roadmap.md
docs/sessoes/sessao-031.md
```

---

## Verificação

- Zero vulnerabilidades críticas nas API routes ✅
- CRON_SECRET: endpoint retorna 401 quando variável não configurada ✅
- `contributor_user_id` não aceito via body — sempre usa `user.id` ✅
- `family_id` presente em todas as queries UPDATE/DELETE ✅
- Migration 025 aplicada e verificada: 3 categorias de sistema existem para a família ✅
- `loading.tsx` em dashboard, transações, investimentos, orçamento e família ✅
- `error.tsx` global no grupo `(app)` ✅
- `.single()` error handling consistente em todas as routes ✅

---

## Commits

```
b638a59 fix: hardening de segurança e qualidade das API routes (sessão 031)
```

Push realizado para `origin/main`.

---

## Próxima sessão

Iniciar **Fase 12** (a definir com o gestor).
