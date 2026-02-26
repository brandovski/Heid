# Couple — Padrões Técnicos e Registro de Erros

> Este documento complementa `arquitetura.md` (padrões de código/componentes).
> Foco em: PostgreSQL, Supabase, migrations e armadilhas já encontradas.
> **Consultar sempre antes de criar ou alterar migrations.**

---

## 1. Padrões de PostgreSQL / Supabase

### 1.1 Funções em expressões de índice devem ser IMMUTABLE

Funções usadas em `CREATE INDEX ... ON tabela(funcao(coluna))` precisam ser marcadas como `IMMUTABLE`.

| Função | Classificação | Usar em índice? |
|---|---|---|
| `date_trunc('month', date)` | STABLE | ❌ — rejeitado pelo PostgreSQL |
| `TO_CHAR(d, 'YYYY-MM')` | STABLE | ❌ — rejeitado |
| `year_month_key(date)` | IMMUTABLE (definida no projeto) | ✅ — padrão do projeto |

**Regra:** para índices de idempotência por mês, sempre usar `year_month_key(date)`.

```sql
-- CORRETO
CREATE UNIQUE INDEX idx_alguma_coisa_month
  ON tabela(entidade_id, year_month_key(date))
  WHERE auto_generated = true;

-- ERRADO — PostgreSQL rejeita na criação do índice
CREATE UNIQUE INDEX idx_alguma_coisa_month
  ON tabela(entidade_id, date_trunc('month', date))
  WHERE auto_generated = true;
```

---

### 1.2 ALTER TYPE ADD VALUE não pode rodar dentro de transação

No PostgreSQL, `ALTER TYPE ... ADD VALUE` falha se executado dentro de um bloco de transação.

O endpoint da Management API do Supabase executa cada query em uma transação implícita — **portanto, essa instrução deve ser enviada sozinha**, em uma chamada separada.

**Regra para migrations que estendem ENUMs:**
- **Parte 1 (chamada isolada):** somente os `ALTER TYPE ADD VALUE`
- **Parte 2+ (chamada separada):** todo o resto da migration

```sql
-- Executar ISOLADO (chamada separada):
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'novo_valor';

-- Depois, em outra chamada, o restante da migration.
```

Sempre usar `IF NOT EXISTS` para segurança (idempotência).

---

### 1.3 Padrão de idempotência para cron jobs

Para garantir que um cron não insira duplicatas, usar índice único condicional com `year_month_key`:

```sql
CREATE UNIQUE INDEX idx_<tabela>_auto_month
  ON <tabela>(<entidade_id>, year_month_key(date))
  WHERE auto_generated = true;
```

Esse padrão está aplicado em:
- `transactions` — por `fixed_income_id`, `fixed_expense_id`, `subscription_id`
- `investment_transactions` — por `investment_id`

---

### 1.4 Padrões de RLS

Há três padrões em uso no projeto:

**`scoped_select` — para entidades com scope pessoal/familiar:**
```sql
CREATE POLICY "scoped_select" ON tabela FOR SELECT USING (
  (scope = 'family'   AND family_id = auth_family_id())                OR
  (scope = 'personal' AND user_id   = auth.uid())                      OR
  (scope = 'personal' AND is_shared = true AND family_id = auth_family_id())
);
```

**`family_access` — para tabelas filhas (herda via subquery):**
```sql
CREATE POLICY "family_access" ON tabela_filha FOR ALL USING (
  entidade_pai_id IN (
    SELECT id FROM entidade_pai WHERE
      (scope = 'family'   AND family_id = auth_family_id()) OR
      (scope = 'personal' AND user_id   = auth.uid())
  )
);
```

**Simples por `family_id` — para tabelas sem escopo (categories, invoice_payments):**
```sql
CREATE POLICY "family_access" ON tabela FOR ALL USING (family_id = auth_family_id());
```

Funções auxiliares disponíveis (definidas na migration 016):
- `auth_family_id()` → retorna o `family_id` do usuário autenticado
- `auth_user_id()` → alias legível para `auth.uid()`

---

### 1.5 Tabelas append-only (sem updated_at)

Tabelas de histórico imutável **não devem ter `updated_at`** e **não devem ter trigger de update**. Uma nova linha é sempre inserida — nunca há UPDATE nessas tabelas.

Tabelas append-only no projeto:
- `investment_snapshots` — cada registro de saldo de mercado é imutável

---

### 1.6 user_id NOT NULL vs. nullable

| Situação | Convenção |
|---|---|
| Entidade pode ser da família (scope='family') | `user_id NULL` (NULL quando family) |
| Entidade sempre tem dono individual | `user_id NOT NULL` |

**Desvio documentado:** `investments.user_id` é `NOT NULL` mesmo sendo entidade com scope. Motivo: o `user_id` do investimento define quem é o responsável pelo aporte automático gerado pelo cron — precisa ser sempre conhecido.

---

### 1.7 Migrations diferidas

Algumas migrations são criadas mas não aplicadas imediatamente:

| Migration | Condição para aplicar |
|---|---|
| `015_create_projects.sql` | Início da Fase 9 |
| `017_create_investments.sql` — Parte 5 | Após migration 015 (project_items já existe) |
| `018_add_investment_to_transactions.sql` | Início da Fase 10 |

Ao chegar na fase correspondente, lembrar de verificar dependências antes de aplicar.

---

## 2. Padrões de UI / Mobile

### 2.1 Modal — estrutura padrão

Todo modal usa o componente `src/components/ui/Modal.tsx` com três zonas:

| Zona | Classe | Comportamento |
|---|---|---|
| Header (título + fechar) | `shrink-0` | Sempre visível, não rola |
| Conteúdo (campos) | `flex-1 overflow-y-auto` | Scrollável quando conteúdo excede altura |
| Footer (botões + erro) | `shrink-0` | Sempre visível, não rola |

**Altura máxima:** `max-h-[70vh]` — nunca excede 70% da viewport.

**Prop `footer`:** os botões de ação e a mensagem de erro vão **sempre** no `footer`, não no `children`. Isso garante que os botões estejam sempre visíveis.

**Botão de submit fora do `<form>`:** usar o atributo HTML `form="<id>"` no botão para associá-lo ao formulário sem precisar estar dentro dele:
```tsx
// Formulário nos children
<form id="meu-form" onSubmit={handleSubmit}>...</form>

// Botão no footer
<button type="submit" form="meu-form">Salvar</button>
```

**Mobile:** no mobile (`< sm`), o modal é exibido como **bottom sheet** (sobe de baixo, `rounded-t-2xl`). No desktop, é dialog centralizado (`sm:rounded-xl`).

---

### 2.2 Navbar — dual layout mobile/desktop

- **Desktop (`sm:`):** top navbar horizontal com texto + ícone
- **Mobile (default):** bottom navigation bar fixo (`fixed bottom-0`), somente ícone + label curto

O layout `(app)` adiciona `pb-24 sm:pb-0` ao `<main>` para evitar sobreposição com a bottom nav no mobile.

---

### 2.3 Touch targets

Botões de ação interativa devem ter área mínima de toque de **44×44px** em mobile. Usar `p-1.5` (24px) + margem implícita do layout para atingir o mínimo de forma confortável.

---

### 2.4 Grids responsivos

Padrão para listagens de cards:
```
grid-cols-1          → mobile (< sm)
sm:grid-cols-2       → tablet
lg:grid-cols-3       → desktop
```

---

### 2.5 Cards de lista com dois níveis de informação

Para cards com muita informação (ex: FixaCard), usar layout de **2 linhas**:
- **Linha 1:** ícone + descrição/nome + valor principal
- **Linha 2:** metadados secundários (dia, categoria) + badges + botões de ação

Evitar colocar mais de 3 elementos na mesma linha horizontal em mobile.

---

### 2.6 Tabs full-width em mobile

Tabs/segmented controls devem ser `w-full sm:w-fit` no mobile, com botões `flex-1` para ocupar todo o espaço disponível. No desktop, ficam com tamanho natural (`w-fit`).

---

## 3. Padrões de TypeScript / Tipos

### 2.1 Campos de entidade sempre tipados como `string | null` para UUIDs opcionais

```typescript
// CORRETO
investment_id: string | null;

// ERRADO
investment_id?: string;  // undefined != null no banco
```

### 2.2 Datas do banco são sempre `string` no TypeScript

O Supabase retorna datas (DATE, TIMESTAMPTZ) como strings. Nunca usar `Date` nas interfaces.

```typescript
date: string;         // DATE — 'YYYY-MM-DD'
created_at: string;   // TIMESTAMPTZ — ISO 8601
```

### 2.3 Comentar a migration de origem em campos novos

```typescript
// Investimento vinculado (migration 017)
investment_id: string | null;
```

---

## 3. Registro de Erros e Correções

> Log cronológico de erros encontrados em execução. Nunca apagar entradas — apenas adicionar.

---

### [2026-02-26] upsert({ ignoreDuplicates: true }) não funciona com índices parciais

**Contexto:** Cron `generate-monthly` — tentativa de usar `upsert({ ignoreDuplicates: true })` para idempotência.

**Erro:**
```
duplicate key value violates unique constraint "idx_transactions_fixed_expense_month"
```

**Causa:** O Supabase JS gera `ON CONFLICT (id) DO NOTHING` (verifica apenas o PK). Como cada insert usa uma nova UUID, o PK nunca conflita. O índice parcial fica sem cobertura e lança constraint violation normalmente.

**Correção:** pré-filtro antes do insert — buscar quais `fixed_income_id`/`fixed_expense_id`/`subscription_id` já têm transação `auto_generated = true` no mês corrente, filtrar as entidades que já existem, e usar `.insert()` apenas para as novas.

**Regra permanente:** não usar `upsert({ ignoreDuplicates: true })` para idempotência com índices parciais. Sempre pré-filtrar.

---

### [2026-02-26] Middleware bloqueando rotas de cron

**Contexto:** Endpoints `/api/cron/*` retornavam redirect para `/login` ao chamar via curl.

**Causa:** O middleware de autenticação intercepta todas as rotas e redireciona requisições sem sessão. Crons não têm sessão — usam `CRON_SECRET`.

**Correção:** adicionar `"/api/cron"` ao array `publicRoutes` no `src/middleware.ts`.

**Regra permanente:** toda rota de API que usa autenticação própria (cron secret, webhook secret, etc.) deve ser adicionada a `publicRoutes` no middleware.

---

### [2026-02-25] Dev server com assets 404 após rm -rf .next

**Contexto:** Após limpar o cache e rodar `npm run dev -- --port 3001`, o browser ainda recebia 404 para `layout.css`, `app-pages-internals.js` e `main-app.js`.

**Causa:** Havia um processo Node anterior travado em background ocupando a porta 3001. O novo `npm run dev` falhava silenciosamente com `EADDRINUSE`, e o browser continuava apontando para o processo antigo (com `.next` já deletado).

**Resolução:** Fechar completamente o terminal (não só o processo), abrir um novo e rodar:
```bash
rm -rf .next && npm run dev -- --port 3001
```
Aguardar a mensagem `Ready in Xms` antes de acessar o app.

**Regra permanente:** se `rm -rf .next` não resolver assets 404, fechar o terminal inteiro antes de tentar novamente.

---

### [2026-02-25] date_trunc em índice rejeitado como STABLE

**Contexto:** Migration 017, criação de índice único de idempotência em `investment_transactions`.

**Erro:**
```
ERROR: 42P17: functions in index expression must be marked IMMUTABLE
```

**Causa:** `date_trunc('month', date)` é classificada como `STABLE` no PostgreSQL (depende de configuração de timezone), não `IMMUTABLE`. Índices só aceitam funções `IMMUTABLE`.

**Correção:** substituir por `year_month_key(date)`, que é `IMMUTABLE STRICT` e já existe no projeto desde a migration 012.

**Arquivo corrigido:** `supabase/migrations/017_create_investments.sql`

---

### [2026-02-25] ALTER TYPE ADD VALUE falhou por estar em transação implícita

**Contexto:** Migration 017, tentativa de rodar Partes 1–5 em uma única chamada à Management API.

**Erro:** não explicitado (rollback silencioso / erro de transação).

**Causa:** `ALTER TYPE ... ADD VALUE` não pode rodar dentro de um bloco de transação. A API do Supabase envolve cada chamada em transação implícita.

**Correção:** separar a Parte 1 (ENUM) em uma chamada isolada, antes de enviar as demais partes.

**Regra permanente:** toda migration que estende um ENUM deve ter a Parte 1 executada em chamada separada. Ver seção 1.2 deste documento.

---

### [2026-02-25] Migration 017 Parte 5 falhou por dependência não atendida

**Contexto:** tentativa de rodar ALTER TABLE project_items antes da migration 015.

**Erro:**
```
ERROR: 42P01: relation "project_items" does not exist
```

**Causa:** migration 015 (`create_projects.sql`) ainda não foi aplicada (diferida para Fase 9). `project_items` não existe.

**Correção:** parte 5 da migration 017 diferida para ser executada logo após a migration 015 na Fase 9.

---
