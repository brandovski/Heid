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

## 2. Padrões de TypeScript / Tipos

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
