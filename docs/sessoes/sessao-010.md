# Sessão 010 — 2026-02-26

**Fase:** Fase 7 — Visão Familiar / Caixa Familiar
**Resultado:** Fase 7 concluída

---

## Objetivo

Implementar a Fase 7 completa: tela `/familia` com Caixa Familiar (aportes reais, saldo, transações familiares) e navegação por mês.

> **Nota:** O objetivo inicial incluía toggle Familiar/Pessoal e view de itens compartilhados pelo parceiro. Após discussão, esses itens foram removidos — já são visíveis em `/fixas`, `/assinaturas` e `/cartoes`. A tela `/familia` ficou focada exclusivamente no Caixa Familiar.

---

## O que foi feito

### Migration 020

`020_update_family_contributions.sql` — revisão do modelo de `family_contributions`:

- Coluna `effective_from` renomeada para `date`
- Adicionada coluna `transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL`
- Removida a constraint `UNIQUE (family_id, user_id, effective_from)`
- Adicionado índice `idx_family_contributions_family_date ON family_contributions(family_id, date)`

**Motivação:** A tabela deixou de ser "configuração de valor mensal" e passou a ser "registro de aporte efetivo". Cada linha = um pagamento real.

### API Route

| Rota | Método | Descrição |
|---|---|---|
| `/api/familia/contribuicao` | `POST` | Registra um aporte: cria despesa pessoal + registra no caixa familiar |

**Lógica da rota (2 passos com rollback manual):**
1. Valida `amount > 0`
2. Cria transação pessoal (`type='expense'`, `scope='personal'`, `status='paid'`, `description='Contribuição ao Caixa Familiar'`)
3. Insere em `family_contributions` com `transaction_id` vinculado
4. Se passo 3 falhar: deleta a transação criada (rollback manual)

### Server Component `/familia/page.tsx`

- `?mes=YYYY-MM` — mês a exibir (padrão = mês corrente)
- `Promise.all` com 3 queries paralelas:
  1. `profiles` — nomes dos membros da família
  2. `family_contributions` — aportes no intervalo do mês (`gte date, lte date`)
  3. `transactions` — `scope='family'`, `status!='cancelled'`, no intervalo do mês

**Nota de tipo:** Supabase JS infere joins `category:categories(...)` como array no TypeScript. Cast via `as unknown as FamilyTransaction[]` na passagem de props.

### Client Components

| Arquivo | Responsabilidade |
|---|---|
| `types.ts` | Interfaces `FamilyMember`, `FamilyContribution`, `FamilyTransaction`; `computeCaixaFamiliar`; helpers de formatação |
| `FamiliaView.tsx` | Navegação de mês, card Caixa Familiar (total por membro + contagem de aportes, totais, saldo livre), lista de transações familiares |
| `ContribuicaoModal.tsx` | Formulário de aporte: valor, data (padrão = hoje), notas opcionais |

### Cálculo do Caixa Familiar

| Métrica | Fórmula |
|---|---|
| Total por membro | `SUM(contributions WHERE user_id = member.id)` no mês |
| Total contribuído | Soma dos totais por membro |
| Gastos familiares | `SUM(amount WHERE type ∈ {expense, fixed_expense, installment, subscription})` |
| Receitas familiares | `SUM(amount WHERE type ∈ {income, fixed_income})` |
| Saldo livre | `Total contribuído − Gastos + Receitas` |

### Navbar

| Posição | Desktop | Mobile |
|---|---|---|
| +1 item | Família (Users, posição 7) | Família (Users) em lugar de Parcelas |

Mobile atualizado: Início, Transações, **Família**, Assinat., Orçamento + Sair

---

## Decisões tomadas

| Decisão | Motivo |
|---|---|
| Removido toggle Familiar/Pessoal | Itens compartilhados pelo parceiro já são visíveis em `/fixas`, `/assinaturas` e `/cartoes` — redundante |
| Contribuição = movimento financeiro real | Dinheiro sai da conta pessoal e entra no caixa coletivo; `family_contributions` deixa de ser configuração e passa a ser registro de pagamento |
| Rollback manual no POST | Supabase JS não suporta transações nativas na camada client; delete da transação se o insert de `family_contributions` falhar |
| Saldo livre inclui receitas familiares | Receitas com `scope='family'` devem compor o caixa |
| `date` em vez de `effective_from` | Nova semântica: data do aporte (não "válido a partir de") |

---

## Problemas encontrados

- **TypeScript: join Supabase inferido como array** — `category:categories(name, icon, color)` é inferido como `{ name: any; icon: any; color: any; }[]`. Solução: cast `as unknown as FamilyTransaction[]` no page.tsx. Padrão a reutilizar em futuros joins parciais.

---

## Arquivos criados / modificados

```
supabase/migrations/
└── 020_update_family_contributions.sql    ← novo

src/app/(app)/familia/
├── page.tsx                               ← novo (Server Component)
└── _components/
    ├── types.ts                           ← novo
    ├── FamiliaView.tsx                    ← novo
    └── ContribuicaoModal.tsx              ← novo

src/app/api/familia/
└── contribuicao/route.ts                  ← novo (POST)

src/components/Navbar.tsx                  ← +Família desktop; Parcelas→Família mobile
docs/roadmap.md                            ← Fase 7 concluída
docs/banco-de-dados.md                     ← family_contributions atualizado (migration 020)
docs/diario-dev.md                         ← sessão 010 adicionada
docs/sessoes/sessao-010.md                 ← este arquivo
```

---

## Estado do banco ao final da sessão

Migrations aplicadas: 001–014, 016, 017 (Partes 1–4), 019, **020**
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
