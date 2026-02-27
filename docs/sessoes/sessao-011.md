# Sessão 011 — 2026-02-26

**Fase:** Fase 8 — Dashboard
**Resultado:** Fase 8 concluída

---

## Objetivo

Implementar a Fase 8 completa: tela `/dashboard` com cards de resumo, gráficos, orçamento, faturas de cartão e próximos lançamentos. Inclui remoção do Tremor e substituição por componentes Recharts customizados.

---

## O que foi feito

### API Route

| Rota | Método | Descrição |
|---|---|---|
| `/api/faturas` | `POST` | Insere em `invoice_payments`; retorna 409 se `UNIQUE(credit_card_id, reference_month)` já existir |

### Server Component `/dashboard/page.tsx`

- `?mes=YYYY-MM` (padrão = mês corrente) + `?escopo=family|personal` (padrão = family)
- `Promise.all` com 6 queries paralelas: transações do mês, transações históricas (6 meses), orçamentos, cartões ativos, pagamentos de fatura do mês, próximos lançamentos (pending a partir de hoje)
- Guard: se `profile.family_id` ausente, exibe aviso sem executar queries

### Remoção do Tremor

- `@tremor/react` desinstalado do `package.json`
- `recharts@2.15.4` adicionado como dependência explícita (já era transitivo via Tremor)
- `tailwind.config.ts`: removido `node_modules/@tremor/**` do array `content`
- `OrcamentoCard.tsx`: `import { ProgressBar } from "@tremor/react"` → `import ProgressBar from "@/components/ui/ProgressBar"`

### Componentes criados

| Arquivo | Descrição |
|---|---|
| `src/components/ui/ProgressBar.tsx` | Tailwind puro; props `value (0–100, clampado)` e `color ("blue" \| "red")`; substitui o `<ProgressBar />` do Tremor |
| `dashboard/_components/types.ts` | Interfaces: `TransactionRow`, `HistoricalTxRow`, `UpcomingRow`, `BudgetRow`, `CreditCardRow`, `InvoicePaymentRow`; funções: `computeSummary`, `computeMonthlyTotals`, `computeCategoryDistribution`, `computeBudgetStats`, `computeInvoiceCards`; helpers: `formatCurrency`, `formatMonth`, `formatDate`, `shiftMonth`, `last6Months` |
| `dashboard/_components/GraficoEvolucao.tsx` | Recharts `AreaChart` com gradientes SVG; azul (Receitas) e rose (Despesas); tooltip card branco; eixo Y abreviado (`R$2k`) |
| `dashboard/_components/GraficoCategoria.tsx` | Recharts `PieChart` donut (`innerRadius=52, outerRadius=78`); 10 cores; `CenterLabel` SVG; legenda integrada (top 5) |
| `dashboard/_components/FaturaModal.tsx` | Formulário com valor (default = total do cartão no mês) e observações; POST `/api/faturas` + `router.refresh()` |
| `dashboard/_components/DashboardView.tsx` | Header + toggle escopo; navegação de mês; 5 cards de resumo; gráficos (3+2 cols); orçamento com ProgressBar (top 5); cards de faturas; tabela de próximos lançamentos |

### Paleta de cores padronizada (docs/padroes.md)

```typescript
receitas: "#2563eb"   // blue-600
despesas: "#f43f5e"   // rose-500

const DONUT_COLORS = [
  "#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a",
  "#0891b2", "#d97706", "#9333ea", "#dc2626", "#0d9488",
];
```

---

## Decisões tomadas

| Decisão | Motivo |
|---|---|
| Recharts direto (sem Tremor) | Tremor: visual opinionado, bundle pesado, DonutChart com bug de cor preta, AreaChart cortando labels. Recharts já era transitivo — custo zero de bundle |
| Regra permanente: sem libs de UI de terceiros | Toda UI via Tailwind + `src/components/ui/`. Exceção apenas para componentes incrivelmente complexos de reimplementar |
| `historicalTransactions` query leve | Apenas `amount, date, type, status` — sem joins de `category` ou `credit_card_id`. Economiza banda |
| Seção de faturas lista todos os cartões ativos | RLS define visibilidade; `computeInvoiceCards` filtra para exibir só cartões com movimentação no mês ou pagamento registrado |
| Próximos lançamentos fixos a partir de `todayStr` | Independente do mês navegado — sempre mostra o que vence em breve |

---

## Problemas encontrados

- **DonutChart Tremor**: exibia círculo preto sólido (faltava prop `colors` + conflito CSS). Solução: substituído por Recharts customizado.
- **AreaChart Tremor**: cortava os números no eixo Y (faltava `yAxisWidth`). Solução: substituído por Recharts customizado.
- **`padroes.md` com seções duplicadas após inserção da nova Seção 2**: renumeradas TypeScript (→4) e Erros (→5) para resolver conflito.

---

## Arquivos criados / modificados

```
src/app/(app)/dashboard/
├── page.tsx                               ← reescrito (Server Component)
└── _components/
    ├── types.ts                           ← novo
    ├── DashboardView.tsx                  ← novo
    ├── GraficoEvolucao.tsx                ← novo
    ├── GraficoCategoria.tsx               ← novo
    └── FaturaModal.tsx                    ← novo

src/app/api/faturas/
└── route.ts                               ← novo (POST)

src/app/(app)/orcamento/_components/
└── OrcamentoCard.tsx                      ← Tremor ProgressBar → custom

src/components/ui/
└── ProgressBar.tsx                        ← novo

package.json                               ← recharts adicionado; @tremor/react removido
tailwind.config.ts                         ← removido path do Tremor do content
docs/padroes.md                            ← Seção 2 nova (UI libs + componentes + gráficos)
docs/roadmap.md                            ← Fase 8 concluída
docs/diario-dev.md                         ← sessão 011 adicionada
docs/sessoes/sessao-011.md                 ← este arquivo
```

---

## Estado do banco ao final da sessão

Migrations aplicadas: 001–014, 016, 017 (Partes 1–4), 019, 020
Migrations diferidas: 015 (Fase 9), 017 Parte 5 (Fase 9), 018 (Fase 10)

---

## Próxima sessão

**Melhorias pós-Fase 8 (Sessão 012) — antes de iniciar Fase 9:**

- Redesenho do `CartaoCard` para visual tipo cartão de crédito real
- `FaturaDetalheModal` com navegação de mês e lista de transações
- Modal de pagamento unificado (`PagarFaturaModal`) com UX total/parcial + DatePicker
- Agrupamento de transações de cartão em `/transacoes` (`FaturaGrupoCard`)
