# Sessão 028 — 2026-03-01

**Fase:** Categorias de Sistema + Remoção de Categoria em Projetos + Hard Delete
**Resultado:** Concluído — 14 arquivos modificados, migration 023 aplicada, `tsc --noEmit` limpo, commit + push realizados

---

## Objetivo

Três melhorias estruturais:
1. **Categorias de sistema:** criar categorias internas (Projeto, Caixa Familiar, Investimento) que são usadas automaticamente pelas APIs, sem aparecer nos dropdowns de UI
2. **Projetos:** remover o campo `category_id` dos itens de projeto (irrelevante na prática)
3. **Hard delete:** permitir exclusão permanente de itens de projeto cancelados via botão de lixeira

---

## O que foi feito

### 1. Migration 023 — `is_system` em categories

```sql
ALTER TABLE categories ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT false;

INSERT INTO categories (family_id, name, icon, color, is_system)
VALUES
  ('{family_id}', 'Projeto',         '🏗️', '#2563EB', true),
  ('{family_id}', 'Caixa Familiar',  '🤝', '#7C3AED', true),
  ('{family_id}', 'Investimento',    '📈', '#059669', true);
```

### 2. `src/lib/supabase/system-categories.ts` — helper

```ts
export async function getSystemCategoryId(
  supabase: SupabaseClient,
  familyId: string,
  name: "Projeto" | "Caixa Familiar" | "Investimento"
): Promise<string>
```

Busca a categoria de sistema pelo nome dentro da família. Usada por todas as APIs que criam transações automáticas.

### 3. APIs de categorias — filtro `is_system`

| Endpoint | Mudança |
|---|---|
| `GET /api/categorias` | Filtra `is_system = false` (categorias de sistema nunca aparecem nos dropdowns) |
| `PATCH /api/categorias/[id]` | Retorna 403 se `is_system = true` |

### 4. APIs que passaram a usar categorias de sistema automaticamente

| API | Categoria |
|---|---|
| `POST /api/projetos/itens/[id]/pagar` | `"Projeto"` |
| `POST /api/familia/contribuicao` | `"Caixa Familiar"` |
| `POST /api/investimentos/[id]/transacoes` | `"Investimento"` |
| `GET /api/cron/generate-monthly` (aportes) | `"Investimento"` |

### 5. Projetos — remoção de `category_id` nos itens

- `POST /api/projetos/itens` e `PATCH /api/projetos/itens/[id]`: campo `category_id` removido do payload
- `ItemModal.tsx`: campo de categoria removido do formulário
- `page.tsx` do projeto: fetch de categories removido

### 6. Hard delete de itens cancelados

**Endpoint:** `DELETE /api/projetos/itens/[id]?permanent=true`

- Permite exclusão permanente apenas quando `status = 'cancelled'`
- Retorna 400 se o item não estiver cancelado

**`ItemCard.tsx`:** botão `Trash2` (lixeira) exibido apenas para `isCancelled`:

```tsx
{isCancelled && (
  <button onClick={() => onDeleteItem(item.id)} ...>
    <Trash2 size={13} />
  </button>
)}
```

**`GrupoSection.tsx`:** prop `onDeleteItem` adicionada e propagada.

---

## Arquivos modificados (14)

```
supabase/migrations/023_system_categories.sql   ← NOVO
src/lib/supabase/system-categories.ts           ← NOVO
src/app/api/categorias/route.ts
src/app/api/categorias/[id]/route.ts
src/app/api/projetos/itens/[id]/pagar/route.ts
src/app/api/familia/contribuicao/route.ts
src/app/api/investimentos/[id]/transacoes/route.ts
src/app/api/cron/generate-monthly/route.ts
src/app/api/projetos/itens/route.ts
src/app/api/projetos/itens/[id]/route.ts
src/app/(app)/projetos/[id]/_components/ItemModal.tsx
src/app/(app)/projetos/[id]/_components/ItemCard.tsx
src/app/(app)/projetos/[id]/_components/GrupoSection.tsx
src/app/(app)/projetos/[id]/page.tsx
docs/diario-dev.md
```

---

## Verificação

- `tsc --noEmit` → zero erros ✅
- Categorias de sistema não aparecem nos dropdowns de UI ✅
- `PATCH /api/categorias/[id]` retorna 403 para categorias de sistema ✅
- Transações de projeto, contribuição familiar e investimento recebem categoria correta automaticamente ✅
- Campo categoria removido do formulário de itens de projeto ✅
- Botão lixeira aparece apenas em itens cancelados ✅
- Hard delete funciona apenas para `status = 'cancelled'` ✅

---

## Commits

```
a160b6b feat: categorias de sistema, remoção de categoria de itens e hard delete de cancelados
```

Push realizado para `origin/main`.

---

## Próxima sessão

Sessão 029 — Aportes mensais em Investimentos com confirmação manual (migration 024).
