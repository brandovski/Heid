# Sessão 010 — 2026-02-26

**Fase:** Fase 7 — Visão Familiar / Caixa Familiar
**Resultado:** Fase 7 concluída

---

## Objetivo

Implementar a Fase 7 completa: tela `/familia` com toggle Familiar/Pessoal, Caixa Familiar com contribuições configuráveis por usuário, saldo livre e listagem de transações familiares; view Pessoal com itens compartilhados pelo parceiro (somente leitura).

---

## O que foi feito

### Sem migration necessária

`family_contributions` (migration 014) já estava aplicada no banco. Nenhuma alteração de schema necessária.

### API Route

| Rota | Método | Descrição |
|---|---|---|
| `/api/familia/contribuicao` | `POST` | Cria ou atualiza contribuição mensal do usuário |

**Lógica da rota:**
1. Valida `amount > 0` e `mes` no formato `YYYY-MM`
2. `effective_from = primeiro dia do mês` (`YYYY-MM-01`)
3. Verifica se existe registro para `(family_id, user_id, effective_from)` → **update** se sim, **insert** se não
4. Padrão pré-filtro — consistente com `generate-monthly` e `orcamento/clonar`

### Server Component `/familia/page.tsx`

- `?mes=YYYY-MM` — mês a exibir (padrão = mês corrente)
- `?view=familiar|pessoal` — view ativa (padrão = familiar)
- `Promise.all` com 7 queries paralelas:
  1. `profiles` — nomes dos dois membros da família
  2. `family_contributions` — contribuições com `effective_from <= lastDay`, ordenadas por data desc
  3. `transactions` — `scope='family'`, `status!='cancelled'`, no intervalo do mês
  4. `fixed_incomes` — `scope='personal'`, `is_shared=true`, `user_id != currentUser.id`
  5. `fixed_expenses` — idem
  6. `subscriptions` — idem + `is_active=true`
  7. `credit_cards` — idem + `is_active=true`

**Nota de tipo:** Supabase JS infere joins `category:categories(...)` como array no TypeScript. Cast via `as unknown as FamilyTransaction[]` na passagem de props.

### Client Components

| Arquivo | Responsabilidade |
|---|---|
| `types.ts` | Interfaces, `computeCaixaFamiliar`, `getActiveContribution`, helpers de formatação |
| `FamiliaView.tsx` | Toggle Familiar/Pessoal, navegação de mês, Caixa Familiar, transações, view Pessoal |
| `ContribuicaoModal.tsx` | Formulário de configuração da contribuição mensal |

### Cálculo do Caixa Familiar

| Métrica | Fórmula |
|---|---|
| Contribuição ativa por membro | Linha mais recente com `effective_from <= lastDay` |
| Total contribuído | Soma das contribuições ativas |
| Gastos familiares | `SUM(amount WHERE type ∈ {expense, fixed_expense, installment, subscription})` |
| Receitas familiares | `SUM(amount WHERE type ∈ {income, fixed_income})` |
| Saldo livre | `Total contribuído − Gastos + Receitas` |

### View Pessoal — itens compartilhados pelo parceiro

Seções exibidas (somente leitura, badge "Somente leitura"):
- **Despesas Fixas** — valor mensal, dia de vencimento, categoria
- **Receitas Fixas** — valor mensal, dia de recebimento, categoria
- **Assinaturas** — valor em BRL, badge USD se moeda original for USD
- **Cartões de Crédito** — nome e bandeira

Estado vazio quando parceiro não compartilhou nenhum item.

### Navbar

| Posição | Desktop | Mobile |
|---|---|---|
| +1 item | Família (Users, posição 7) | Família (Users) em lugar de Parcelas |

Mobile atualizado: Início, Transações, **Família**, Assinat., Orçamento + Sair

---

## Decisões tomadas

| Decisão | Motivo |
|---|---|
| Sem nova migration | `family_contributions` (migration 014) já aplicada e suficiente |
| `effective_from = primeiro dia do mês` | Simplifica UX: uma configuração por mês, atualizável |
| Pré-filtro no POST | Padrão estabelecido — não usa upsert com ignoreDuplicates |
| `.neq('user_id', currentUser.id)` para itens compartilhados | RLS `scoped_select` já autoriza leitura pelo parceiro; filtro client-side desnecessário |
| Saldo livre inclui receitas familiares | Receitas com `scope='family'` devem compor o caixa |
| Navegação de mês apenas na view Familiar | View Pessoal não é temporal — mostra estado atual dos itens compartilhados |

---

## Problemas encontrados

- **TypeScript: join Supabase inferido como array** — `category:categories(name, icon, color)` é inferido como `{ name: any; icon: any; color: any; }[]` pelo TypeScript (Supabase sem tipos gerados). Solução: cast `as unknown as FamilyTransaction[]` no page.tsx. Padrão a reutilizar em futuros joins parciais.

---

## Arquivos criados / modificados

```
src/app/(app)/familia/
├── page.tsx                                   ← novo (Server Component)
└── _components/
    ├── types.ts                               ← novo
    ├── FamiliaView.tsx                        ← novo
    └── ContribuicaoModal.tsx                  ← novo
src/app/api/familia/
└── contribuicao/route.ts                      ← novo (POST)
src/components/Navbar.tsx                      ← +Família desktop; Parcelas→Família mobile
docs/roadmap.md                                ← Fase 7 concluída
docs/diario-dev.md                             ← sessão 010 adicionada
docs/sessoes/sessao-010.md                     ← este arquivo
```

---

## Estado do banco ao final da sessão

Sem alterações. Migrations aplicadas: 001–014, 016, 017 (Partes 1–4), 019
Migrations diferidas: 015 (Fase 9), 017 Parte 5 (Fase 9), 018 (Fase 10)

---

## Próxima sessão

**Fase 8 — Dashboard**

- Cards de resumo: Receitas, Despesas, Saldo realizado, A receber, A pagar
- Toggle Pessoal | Familiar nos cards
- Gráfico de evolução dos últimos 6 meses (`<AreaChart />`)
- Gráfico de distribuição por categoria (`<DonutChart />`)
- Seção de orçamento por categoria com `<ProgressBar />`
- Cards de faturas por cartão com status
- Tabela de próximos lançamentos (próximos 7–10 pending)
- Navegação entre meses
