# Sessão 021 — 2026-02-27

**Fase:** Fase 11 v2 — Revisão e Correção do Fluxo Futuro
**Resultado:** Concluído — FluxoWidget, agrupamento de faturas, projeção de fixas, escopo parceiro corrigidos. `tsc --noEmit` limpo, commit + push realizados

---

## Objetivo

Revisar e corrigir o módulo Fluxo Futuro implementado na Sessão 020, adicionando:
1. `FluxoWidget` no Dashboard com prévia das próximas movimentações
2. `FluxoProjecao` na tela de Investimentos
3. Expansão do `/fluxo` para incluir receitas fixas, despesas fixas, cartões e perfil do parceiro
4. Agrupamento de transações de cartão por fatura (em vez de transações individuais)
5. Projeção de despesas/receitas fixas ainda não-geradas pelo cron
6. Escopo do parceiro com nomes reais (em vez de "Familiar"/"Tudo")

---

## O que foi feito

### 1. `FluxoWidget` no Dashboard

Novo componente adicionado à tela `/dashboard`:
- Exibe as **4 próximas movimentações** futuras (ordenadas por data)
- Link "→ Ver tudo" que navega para `/fluxo`
- Mostra tipo, descrição, valor e data de cada evento
- Ícones por tipo de evento

### 2. `FluxoProjecao` em Investimentos

Novo componente na tela de detalhe de investimento:
- Tabela de projeção de saldo para os próximos 12 meses
- Considera aportes mensais programados (`monthly_contribution_amount`)
- Calcula crescimento com e sem retorno esperado

### 3. Expansão das queries em `/fluxo/page.tsx`

De 5 para **9 queries** em `Promise.all`:

| Query (nova) | Tabela | Dados |
|---|---|---|
| Receitas fixas ativas | `fixed_incomes` | `is_active = true` |
| Despesas fixas ativas | `fixed_expenses` | `is_active = true` |
| Cartões de crédito | `credit_cards` | `is_active = true` |
| Perfil do parceiro | `profiles` | `family_id`, `full_name` do parceiro |

### 4. `FluxoView` v2

#### Agrupamento de faturas por cartão

Transações de cartão (`payment_method = 'credit_card'`) são agrupadas em um único evento de fatura por cartão, em vez de aparecerem individualmente. Cada evento de fatura exibe:
- Nome do cartão
- Total da fatura no mês
- Badge "fatura"
- Texto "vence dia DD"

#### Projeção de fixas não-geradas (`kind = "fixed_projected"`)

Receitas e despesas fixas com `day_of_month` no futuro cujo cron ainda não gerou transação no mês corrente são projetadas como eventos estimados:
- Badge "fixo · previsto" em vez de "pendente"
- Fundo `bg-blue-50/50` para distinção visual
- Não incluídas quando a transação já foi gerada pelo cron (idempotência visual)

#### Escopo do parceiro com nomes reais

A tab "Tudo" foi substituída por comportamento baseado nos nomes reais dos usuários. O escopo do parceiro mostra o nome real (ex: "Gabriel" ou "Heide") em vez de rótulos genéricos como "Familiar" ou "Tudo".

### 5. `FluxoTimeline` e `FluxoCalendario` atualizados

Suporte aos novos kinds:

| kind | Ícone | Badge | Estilo |
|---|---|---|---|
| `fatura` | `CreditCard` | "fatura" + "vence dia DD" | padrão |
| `fixed_projected` | ícone de fixas | "fixo · previsto" | `bg-blue-50/50` |

### 6. Correção — `FluxoWidget` agrupava faturas incorretamente

**Bug:** o widget exibia transações individuais de cartão em vez da fatura agrupada, duplicando entradas.

**Fix:** aplicada a mesma lógica de agrupamento por cartão do `FluxoView` dentro do `FluxoWidget`.

### 7. Navbar mobile — Fluxo → Orçamento restaurado

Após feedback, o link "Fluxo" foi removido da nav mobile (acessado pelo widget no Dashboard) e "Orçamento" foi restaurado na posição original.

---

## Arquivos modificados

```
src/app/(app)/fluxo/page.tsx               ← 9 queries (+ 4 novas)
src/app/(app)/fluxo/_components/
  FluxoView.tsx                            ← v2: agrupamento, fixas projetadas, parceiro
  FluxoTimeline.tsx                        ← suporte kind="fatura" e "fixed_projected"
  FluxoCalendario.tsx                      ← suporte kind="fatura" e "fixed_projected"

src/app/(app)/dashboard/page.tsx           ← query de próximos eventos para FluxoWidget
src/app/(app)/dashboard/_components/
  FluxoWidget.tsx                          ← novo: 4 próximas movimentações + link

src/app/(app)/investimentos/[id]/page.tsx  ← query de projeção
src/app/(app)/investimentos/[id]/_components/
  FluxoProjecao.tsx                        ← novo: tabela 12 meses
  InvestimentoDetalhe.tsx                  ← integra FluxoProjecao

src/components/Navbar.tsx                  ← mobile: Fluxo→Orçamento restaurado
```

---

## Verificação

- `tsc --noEmit` → zero erros ✅
- `FluxoWidget` no Dashboard: 4 eventos futuros com link correto ✅
- Faturas de cartão agrupadas (não transações individuais) ✅
- Despesas fixas não-geradas aparecem como "fixo · previsto" ✅
- Escopo parceiro com nomes reais (Gabriel/Heide) ✅
- `FluxoProjecao` exibe tabela de 12 meses no investimento ✅
- Navbar mobile: Orçamento restaurado no lugar de Fluxo ✅

---

## Commits

```
86d1964 fix: corrige FluxoWidget — agrupa faturas por cartão
eb51abf docs: sessão 021 — Fase 11 revisão e correção FluxoWidget
```

Push realizado para `origin/main`.

---

## Próxima sessão

**Sessão 022** — `expected_payment_date` em Projetos + substituição de `FluxoProjecao` por `ProjecaoView` unificada em Investimentos.
