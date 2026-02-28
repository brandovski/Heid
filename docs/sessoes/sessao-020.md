# Sessão 020 — 2026-02-27

**Fase:** Fase 11 — Fluxo Futuro / Calendário Financeiro
**Resultado:** Concluído — módulo completo de Fluxo Futuro, `tsc --noEmit` limpo, commit + push realizados

---

## Objetivo

Implementar a Fase 11 do roadmap: tela `/fluxo` com linha do tempo financeira mensal, exibindo todas as movimentações futuras (transações pendentes, aportes de investimentos e itens de projeto confirmados) com indicação visual de saldo projetado dia a dia, filtro de escopo e toggle de layout.

---

## O que foi feito

### Arquitetura da tela `/fluxo`

A tela segue o padrão do projeto: **Server Component** como orquestrador de dados + **Client Component** para interatividade.

#### Server Component — `src/app/(app)/fluxo/page.tsx`

5 queries executadas em `Promise.all`:

| Query | Tabela | Filtro |
|---|---|---|
| Transações pagas (histórico) | `transactions` | `status = 'paid'`, mês atual |
| Transações pendentes | `transactions` | `status = 'pending'` |
| Investimentos ativos | `investments` | `is_active = true`, `monthly_contribution_amount IS NOT NULL` |
| Aportes automáticos já gerados | `investment_transactions` | `auto_generated = true`, mês atual |
| Itens de projeto confirmados | `project_items` | `status = 'confirmed'`, `expected_payment_date IS NOT NULL` |

#### Client Component — `FluxoView`

- **Tabs de escopo:** Pessoal | Familiar | Tudo — filtra transações por `scope`/`user_id`
- **Navegação de mês:** avança/recua pelo calendário financeiro
- **Saldo projetado acumulado por dia:** calculado a partir do saldo realizado + fluxos futuros ordenados cronologicamente
- **Toggle de layout:** linha do tempo (`FluxoTimeline`) ↔ calendário (`FluxoCalendario`)

#### `FluxoTimeline`

Lista agrupada por dia com:
- Saldo projetado exibido no cabeçalho de cada grupo de dia
- Ícones por tipo de evento (receita, despesa, investimento, projeto)
- Badges de status (pendente, projetado)
- Destaque visual para itens projetados (não confirmados) com fundo diferenciado

#### `FluxoCalendario`

- Grid 6×7 com navegação por mês
- Dots coloridos por tipo de evento em cada dia
- Painel de detalhe ao clicar em um dia: lista todos os eventos com valores e tipos

### Tipos de evento (`kind`)

| kind | Origem | Cor |
|---|---|---|
| `income` | Receita pendente | Verde |
| `expense` | Despesa pendente | Vermelho |
| `investment` | Aporte mensal projetado | Azul |
| `projeto` | Item de projeto confirmado | Roxo |

### Navbar atualizada

| Posição | Antes | Depois |
|---|---|---|
| Mobile | Orçamento | **Fluxo** |
| Desktop | — | Link "Fluxo" adicionado após "Investimentos" |

---

## Arquivos criados / modificados

```
# Novos
src/app/(app)/fluxo/page.tsx               ← Server Component, 5 queries
src/app/(app)/fluxo/_components/
  FluxoView.tsx                            ← Client, tabs + navegação + toggle
  FluxoTimeline.tsx                        ← Client, lista agrupada por dia
  FluxoCalendario.tsx                      ← Client, grid 6×7 com detalhe

# Modificados
src/components/Navbar.tsx                  ← mobile: Orçamento→Fluxo; desktop: +Fluxo
```

---

## Verificação

- `tsc --noEmit` → zero erros ✅
- Tela `/fluxo` exibe todos os tipos de evento futuros ✅
- Saldo projetado acumulado correto por dia ✅
- Toggle de layout funciona entre timeline e calendário ✅
- Filtro de escopo (Pessoal/Familiar/Tudo) filtra corretamente ✅
- Navegação de mês avança/recua sem erros ✅

---

## Commits

```
88d1204 feat: Fase 11 — módulo Fluxo Futuro completo
```

Push realizado para `origin/main`.

---

## Próxima sessão

**Sessão 021** — Revisão e correção do Fluxo Futuro: FluxoWidget no Dashboard, agrupamento de faturas por cartão, projeção de despesas fixas não-geradas e escopo do parceiro com nomes reais.
