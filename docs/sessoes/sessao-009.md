# Sessão 009 — 2026-02-26

**Fase:** Fase 6 — Orçamento Mensal
**Resultado:** Fase 6 concluída

---

## Objetivo

Implementar a Fase 6 completa: CRUD de orçamento mensal por categoria, toggle pessoal/familiar, clonar do mês anterior, ProgressBar de progresso com destaque para extrapolação.

---

## O que foi feito

### Migration 019

Problema: `UNIQUE(family_id, reference_month, category_id)` impedia dois usuários da mesma família de ter orçamentos pessoais para a mesma categoria no mesmo mês.

Solução: dois índices parciais separados por scope:

```sql
CREATE UNIQUE INDEX idx_budgets_family_unique
  ON budgets(family_id, reference_month, category_id)
  WHERE scope = 'family';

CREATE UNIQUE INDEX idx_budgets_personal_unique
  ON budgets(family_id, reference_month, category_id, user_id)
  WHERE scope = 'personal';
```

### API Routes

| Rota | Método | Descrição |
|---|---|---|
| `/api/orcamento` | `POST` | Cria item de orçamento; 409 se duplicado |
| `/api/orcamento/clonar` | `POST` | Clona do mês anterior com pré-filtro |
| `/api/orcamento/[id]` | `PATCH` | Edita `planned_amount` / `notes` |
| `/api/orcamento/[id]` | `DELETE` | Remove categoria do orçamento |

### Server Component `/orcamento/page.tsx`

- `?mes=YYYY-MM` — mês a exibir (padrão = mês corrente)
- `?escopo=family|personal` — escopo do orçamento (padrão = family)
- `Promise.all` para busca paralela: budgets + transações de despesa + categorias
- Transações filtradas por tipo: `expense`, `fixed_expense`, `installment`, `subscription`
- Transações canceladas excluídas do cálculo

### Client Components

| Arquivo | Responsabilidade |
|---|---|
| `types.ts` | `BudgetWithStats`, `computeStats`, helpers de formatação e navegação |
| `OrcamentoList.tsx` | Toggle escopo, nav de mês, card de totais, estado vazio, lista |
| `OrcamentoCard.tsx` | `<ProgressBar />`, valores, badge "Acima do limite", exclusão inline |
| `OrcamentoModal.tsx` | Criar (dropdown filtrando categorias já orçadas) / Editar |

### Cálculo de progresso

| Métrica | Fórmula |
|---|---|
| Pago | `SUM(amount WHERE status='paid')` para a categoria no mês |
| Comprometido | `SUM(amount WHERE status='pending')` para a categoria no mês |
| Progresso % | `(pago + comprometido) / planned_amount × 100` |
| Acima do limite | `pago + comprometido > planned_amount` → `color="red"` no Tremor |
| Disponível total | `total_planejado − total_pago − total_comprometido` |

---

## Decisões tomadas

| Decisão | Motivo |
|---|---|
| Toggle de escopo altera URL param | Permite server re-fetch correto dos dados filtrados por scope/user_id |
| Clonar usa pré-filtro + insert | Padrão já estabelecido — upsert com ignoreDuplicates não funciona com índices parciais |
| Confirmação de exclusão inline no card | Mais rápido que abrir modal; seguro porque requer dois cliques |
| "Disponível" negativo → vermelho | Feedback imediato de extrapolação do orçamento total |
| Fixas → Orçamento no mobile | Fixas é configuração (1-2x/mês); Orçamento é consulta diária |

---

## Problemas encontrados

- `Modal` não aceita prop `isOpen` — controle de visibilidade é feito por renderização condicional no pai. Resolvido com `if (!isOpen) return null` no início de `OrcamentoModal`.

---

## Arquivos criados / modificados

```
supabase/migrations/019_fix_budget_unique_constraint.sql   ← novo
src/app/(app)/orcamento/
├── page.tsx                                               ← novo
└── _components/
    ├── types.ts                                           ← novo
    ├── OrcamentoList.tsx                                  ← novo
    ├── OrcamentoCard.tsx                                  ← novo
    └── OrcamentoModal.tsx                                 ← novo
src/app/api/orcamento/
├── route.ts                                               ← novo (POST)
├── clonar/route.ts                                        ← novo (POST)
└── [id]/route.ts                                          ← novo (PATCH, DELETE)
src/components/Navbar.tsx                                  ← +Orçamento; mobile: Fixas→Orçamento
docs/roadmap.md                                            ← Fase 6 concluída
docs/diario-dev.md                                         ← sessão 009 adicionada
docs/sessoes/sessao-009.md                                 ← este arquivo
```

---

## Estado do banco ao final da sessão

Migration 019 aplicada via Management API.
Migrations aplicadas: 001–014, 016, 017 (Partes 1–4), 019
Migrations diferidas: 015 (Fase 9), 017 Parte 5 (Fase 9), 018 (Fase 10)

---

## Próxima sessão

**Fase 7 — Visão Familiar / Caixa Familiar**

- Tela `/familia` com toggle Pessoal | Familiar
- Configuração de contribuição mensal por usuário (`family_contributions`)
- Exibição do Caixa Familiar: contribuição de cada um + total + saldo livre
- Visão de despesas familiares do mês
- Itens pessoais compartilhados pelo parceiro (somente leitura)
