# Sessão 022 — 2026-02-27

**Fase:** Data de Pagamento em Projetos + ProjecaoView em Investimentos
**Resultado:** Concluído — 2 melhorias implementadas, `tsc --noEmit` limpo, commit + push realizados

---

## Objetivo

1. Adicionar campo "Data prevista de pagamento" no modal de confirmação de itens de projeto (`expected_payment_date`)
2. Substituir o componente `FluxoProjecao` (tabela simples de 12 meses) por um novo `ProjecaoView` em Investimentos — visão unificada de timeline + calendário com eventos reais e estimados, navegação por mês e seção de itens sem data

---

## O que foi feito

### 1. `expected_payment_date` em Projetos

#### `ItemModal.tsx` — modo confirm

Novo campo opcional `DatePicker` exibido no modo de confirmação de item:

```
[ Valor Real (R$) ]         ← já existia
[ Data prevista de pagamento ]   ← NOVO (opcional)
```

- Label: "Data prevista de pagamento"
- Componente: `DatePicker` (reutilizável, popover desktop / bottom sheet mobile)
- Pré-preenchido com `item.expected_payment_date` caso já exista
- Enviado no payload PATCH como `expected_payment_date` (ISO string ou `null`)

#### `src/app/api/projetos/itens/[id]/route.ts` — PATCH confirm

Handler de confirmação atualizado para aceitar e persistir `expected_payment_date`:

```typescript
const { actual_amount, expected_payment_date } = body;

await supabase
  .from("project_items")
  .update({
    status: "confirmed",
    actual_amount: parseFloat(actual_amount),
    expected_payment_date: expected_payment_date ?? null,
  })
  .eq("id", params.id)
  .eq("status", "considering");
```

---

### 2. `ProjecaoView` em Investimentos

#### Substituição de `FluxoProjecao`

`FluxoProjecao` (tabela de 12 meses de projeção futura) foi **removido** e substituído pela nova arquitetura `ProjecaoView`:

| Componente | Responsabilidade |
|---|---|
| `ProjecaoView.tsx` | Orquestrador: decide qual seção exibir, computa eventos |
| `ProjecaoTimeline.tsx` | Lista de eventos agrupados por dia com saldo acumulado |
| `ProjecaoCalendario.tsx` | Grid mensal com dots + painel de detalhe ao clicar |

#### Eventos exibidos pela `ProjecaoView`

| Tipo | Origem | Condição |
|---|---|---|
| Aportes reais futuros | `investment_transactions` | `date >= hoje`, `auto_generated = false` |
| Aportes mensais projetados | investimento | `monthly_contribution_amount`, mês não-gerado (`auto_generated = false`) |
| Itens de projeto confirmados | `project_items` | `expected_payment_date >= hoje`, `status = 'confirmed'` |

#### Navegação por mês

- Botões ← → para navegar entre meses
- Cabeçalho exibe mês/ano atual
- Saldo projetado acumulado calculado dia a dia dentro do mês selecionado

#### Seção inferior — itens sem data prevista

Itens de projeto `confirmed` sem `expected_payment_date` aparecem em uma seção separada abaixo do calendário:
```
Comprometido sem data prevista
• [Nome do item]  R$ X.XXX
```

#### `InvestimentoDetalhe.tsx` — integração simplificada

`FluxoProjecao` substituído por `ProjecaoView`. A condição que só renderizava a projeção em certos casos foi removida: `ProjecaoView` é sempre renderizado no detalhe do investimento.

---

## Correção — menu de contexto cortado nos grupos de gasto em Projetos

**Bug:** o menu dropdown de ações nos grupos (`GrupoSection`) era cortado pelo `overflow-hidden` do card pai.

**Fix:** `overflow-visible` aplicado ao container correto, garantindo que o menu flutue sobre o conteúdo adjacente.

---

## Arquivos modificados

```
# Projetos — expected_payment_date
src/app/(app)/projetos/[id]/_components/ItemModal.tsx   ← DatePicker no modo confirm
src/app/api/projetos/itens/[id]/route.ts                ← PATCH aceita expected_payment_date

# Investimentos — ProjecaoView
src/app/(app)/investimentos/[id]/page.tsx               ← query project_items com expected_payment_date
src/app/(app)/investimentos/[id]/_components/
  InvestimentoDetalhe.tsx                               ← usa ProjecaoView em vez de FluxoProjecao
  ProjecaoView.tsx                                      ← novo orquestrador
  ProjecaoTimeline.tsx                                  ← novo componente de timeline
  ProjecaoCalendario.tsx                                ← novo componente de calendário
  FluxoProjecao.tsx                                     ← REMOVIDO

# Fix menu de contexto
src/app/(app)/projetos/[id]/_components/GrupoSection.tsx ← overflow-visible
```

---

## Verificação

- `tsc --noEmit` → zero erros ✅
- Modal de confirmação exibe DatePicker, valor salvo no banco ✅
- `ProjecaoView` renderiza timeline e calendário com navegação de mês ✅
- Aportes reais futuros e projeções aparecem corretamente ✅
- Itens de projeto confirmados com data aparecem na projeção ✅
- Itens sem data aparecem na seção "Comprometido sem data prevista" ✅
- Menu de contexto dos grupos não é mais cortado ✅

---

## Commits

```
cf3d7e4 fix: corrige menu de contexto cortado nos grupos de gasto em Projetos
46cce52 feat: data de pagamento em Projetos + ProjecaoView em Investimentos
```

Push realizado para `origin/main`.

---

## Próxima sessão

**Sessão 023** — Fluxo de Entrada + Restante em Projetos: pagamento em dois passos para itens `deposit_remainder` e projeção dividida em Investimentos.
