# Sessão 037 — Ciclo de Faturamento + Fixes de Dashboard e Projeção

**Data:** 2026-03-06
**Tipo:** Features + correções de bug
**Status:** Concluída
**Commits:** `227fc88`, `47a5f5c`, `b3a1119`, `1979dad`, `d27345e`

---

## Contexto

Cinco melhorias independentes identificadas após a sessão 036:

1. **Ciclo de faturamento por `closing_day`** — totais de fatura calculados apenas pelo mês calendário, ignorando o `closing_day` do cartão.
2. **Transações de cartão ausentes na lista principal** — transações vinculadas a cartão nunca apareciam na listagem de `/transacoes`.
3. **Data da compra perdida ao alternar para parcelado** — ao trocar o tipo de transação para parcelado no modal, a data digitada era apagada.
4. **Projeção de investimento familiar incompleta** — a projeção só contabilizava aportes do dono do investimento, ignorando o parceiro.
5. **Badge do contribuidor na projeção** — a tela de projeção de investimento não exibia quem fez cada aporte.

---

## Item 1 — Ciclo de Faturamento Correto por `closing_day`

### Problema

Os totais de fatura no dashboard e em `/cartoes` somavam transações do mês calendário (01 a 31). Cartões com `closing_day < 31` têm ciclos que atravessam dois meses — ex: `closing_day=10` → ciclo de março vai de 11/fev a 10/mar.

### Solução

Criada `src/lib/fatura-utils.ts` com duas funções:

- **`getInvoiceMonth(transactionDate, closingDay)`** — dado a data de uma transação e o `closing_day`, retorna o mês de fatura (`YYYY-MM`) ao qual ela pertence.
- **`getFatureDateRange(invoiceMonth, closingDay)`** — retorna o range `[start, end]` de datas que cobrem o ciclo completo de um mês de fatura.

`dashboard/page.tsx`: nova query `faturaTransacoes` com range estendido (primeiro dia do mês anterior até último dia do mês atual) para cobrir todos os ciclos possíveis.

`computeInvoiceCards()` em `types.ts` refatorado para filtrar `faturaTransacoes` usando `getInvoiceMonth(t.date, card.closing_day) === currentMonth`.

---

## Item 2 — Transações de Cartão na Lista Principal

### Problema

Transações com `credit_card_id` não apareciam na listagem principal de `/transacoes`. A query tinha um filtro excludente que descartava transações de cartão.

### Solução

Query corrigida para incluir transações de cartão na listagem principal, mantendo o agrupamento por fatura (`FaturaGrupoCard`) no topo separado das transações avulsas.

---

## Item 3 — Data da Compra Preservada no Modal de Transações

### Problema

No `TransacaoModal`, ao alternar o tipo de transação para `installment` (parcelado), a data já digitada era redefinida para hoje, perdendo o valor do usuário.

### Solução

Estado de data desacoplado do tipo de transação — o campo de data agora mantém o valor ao alternar entre tipos.

---

## Item 4 — Projeção de Investimento Familiar com Ambos Contribuidores

### Problema

A `ProjecaoView` de investimentos familiares calculava a projeção de aportes mensais usando apenas o `monthly_contribution_amount` do dono (`investment.user_id`), ignorando o `partner_contribution_amount`.

### Solução

Lógica de projeção atualizada para somar os dois campos quando o investimento é familiar:

```typescript
const monthlyTotal = investment.scope === "family"
  ? (investment.monthly_contribution_amount ?? 0) + (investment.partner_contribution_amount ?? 0)
  : (investment.monthly_contribution_amount ?? 0);
```

---

## Item 5 — Badge do Contribuidor na Projeção de Investimento

### Problema

A tela de projeção de investimento exibia a lista de aportes futuros sem identificar quem faria cada aporte (em investimentos familiares com contribuidores diferentes).

### Solução

Badge com nome do contribuidor adicionado aos cards de aporte na `ProjecaoView`, usando a mesma lógica de resolução de `contributor_user_id` já existente em `InvestimentoDetalhe`.

---

## Verificação Final

- [x] Total de fatura em `/dashboard` reflete o ciclo correto (closing_day)
- [x] Total de fatura em `/cartoes` reflete o ciclo correto (closing_day)
- [x] Transações de cartão aparecem na lista principal de `/transacoes`
- [x] Data da compra mantida ao alternar para parcelado no modal
- [x] Projeção de investimento familiar soma ambos os contribuidores
- [x] Badge de contribuidor visível na projeção de investimento
- [x] `tsc --noEmit` sem erros
