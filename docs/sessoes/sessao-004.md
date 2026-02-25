# Sessão 004 — 2026-02-25

**Fase:** Planejamento + Schema do Módulo de Investimentos
**Duração estimada:** 1 sessão completa
**Resultado:** Schema aplicado no Supabase, tipos atualizados, documentação completa, padrões formalizados

---

## Objetivo

Implementar o schema do Módulo de Investimentos (migrations 017 e 018) e criar a infraestrutura de documentação de padrões para evitar reincidência de erros.

---

## O que foi feito

### Migrations criadas

**`017_create_investments.sql`** — 5 partes:
- **Parte 1:** extensão do ENUM `transaction_type` com `investment_deposit` e `investment_withdrawal`
- **Parte 2:** tabela `investments` — 10 tipos, scope, `user_id NOT NULL`, aporte mensal configurável, flag de elegibilidade para projetos, RLS scoped
- **Parte 3:** tabela `investment_transactions` — aportes e resgates com índice único de idempotência para cron
- **Parte 4:** tabela `investment_snapshots` — saldo de mercado, append-only, sem `updated_at`
- **Parte 5:** altera `project_items` — adiciona `investment_id`, `expected_payment_date`, expande `payment_origin` para incluir `'investment'`, nova constraint de integridade *(diferida — aguarda migration 015 na Fase 9)*

**`018_add_investment_to_transactions.sql`** *(diferida — Fase 10)*:
- Adiciona `investment_id` em `transactions`
- Atualiza `scoped_select` de `transactions` para incluir visibilidade de investimentos elegíveis do parceiro

### Aplicado no Supabase

| Etapa | Status |
|---|---|
| Migration 017 Parte 1 (ENUM) | ✅ aplicada |
| Migration 017 Partes 2–4 (tabelas) | ✅ aplicada |
| Migration 017 Parte 5 (project_items) | ⏳ diferida — Fase 9 |
| Migration 018 | ⏳ diferida — Fase 10 |

Tabelas criadas: `investments`, `investment_transactions`, `investment_snapshots` + 11 índices.

### Tipos TypeScript (`src/types/database.ts`)

- `TransactionType`: +`investment_deposit`, +`investment_withdrawal`
- `PaymentOrigin`: +`'investment'`
- `Transaction`: +`investment_id: string | null`
- `ProjectItem`: +`investment_id`, +`expected_payment_date`
- Novos: `InvestmentType`, `InvestmentTransactionType`, `Investment`, `InvestmentTransaction`, `InvestmentSnapshot`

### Documentação

- `docs/regras-de-negocio.md`: Seção 12 — Investimentos (10 subseções)
- `docs/roadmap.md`: Fase 10 (Investimentos) e Fase 11 (Fluxo Futuro)
- `docs/banco-de-dados.md`: DDL das 3 novas tabelas, `project_items` e `transactions` atualizados, ordem de migrations
- `docs/padroes.md`: criado do zero — padrões PostgreSQL/Supabase + registro de erros
- `docs/session-start-prompt.md`: atualizado para incluir leitura de `padroes.md`
- `docs/sessoes/`: esta pasta, para resumos de sessão

---

## Decisões tomadas

| Decisão | Motivo |
|---|---|
| `investments.user_id NOT NULL` | O `user_id` define o responsável pelo aporte automático no cron — precisa ser sempre conhecido |
| `investment_snapshots` sem `updated_at` | Tabela append-only por design — cada registro é imutável |
| Idempotência via `year_month_key(date)` | `date_trunc` é STABLE; `year_month_key` é IMMUTABLE — único válido para índices |
| Migration 017 Parte 5 diferida | `project_items` não existe até a migration 015 (Fase 9) |
| Migration 018 diferida | Sem UI de investimentos ainda; aplicar no início da Fase 10 |
| Criar `docs/padroes.md` | Formalizar padrões e erros conhecidos para não repetir nas próximas sessões |

---

## Erros encontrados e corrigidos

1. **`date_trunc` em índice** — STABLE, não IMMUTABLE. Corrigido para `year_month_key(date)`. Documentado em `docs/padroes.md`.
2. **`ALTER TYPE ADD VALUE` em transação** — a Management API envolve cada chamada em transação implícita. Corrigido enviando a Parte 1 em chamada isolada. Documentado em `docs/padroes.md`.
3. **`project_items` não existe** — migration 015 ainda não aplicada. Parte 5 diferida. Documentado em `docs/padroes.md`.

---

## Estado do banco ao final da sessão

```sql
-- Tabelas presentes no Supabase (além das 001–016):
investments, investment_transactions, investment_snapshots

-- ENUM atualizado:
transaction_type = {income, expense, installment, subscription,
                    fixed_income, fixed_expense,
                    investment_deposit, investment_withdrawal}
```

---

## Próxima sessão

**Fase 2 — CRUD Base**

- CRUD de categorias (listagem, criar, editar, arquivar)
- CRUD de cartões de crédito com seleção de scope e compartilhamento
- CRUD de receitas fixas com scope
- CRUD de despesas fixas com scope e vínculo a cartão
