# Sessão 038 — Fix: FluxoWidget usa ciclo correto de faturamento

**Data:** 2026-03-06
**Tipo:** Correção de bug
**Status:** Concluída
**Commit:** `8bf6756`

---

## Contexto

Após a sessão 037 implementar o ciclo correto de faturamento via `closing_day` nos cards de fatura do dashboard, o `FluxoWidget` ("Próximas movimentações") continuava usando a lógica antiga: somava transações com `status === "pending"` dentro do mês calendário, ignorando completamente o `closing_day`.

O resultado era um total de fatura diferente entre o widget e os cards de fatura na mesma tela.

**Exemplo observado:**
- Cards de fatura (correto): **R$ 147,39**
- FluxoWidget (incorreto): **R$ 70,39**
- Diferença: R$ 77,00 — transações do ciclo anterior ao dia 1 do mês, que pertencem à fatura atual mas estavam fora do range calendário

---

## Diagnóstico

### Lógica antiga (`FluxoWidget.tsx` — antes da correção)

```typescript
// Usava `transactions` (range calendário, filtrado por escopo)
const cardPending = transactions.filter(
  (t) => t.status === "pending" && !!t.credit_card_id
);

const faturaItems = creditCards.flatMap((card) => {
  const txs = cardPending.filter((t) => t.credit_card_id === card.id);
  const total = txs.reduce((s, t) => s + t.amount, 0);
  // ...
});
```

**Dois problemas:**
1. Usa `transactions` (range calendário) → ignora `closing_day`, soma apenas compras de 01/mês a 31/mês
2. Filtra apenas `status === "pending"` → pode excluir transações do ciclo pagas individualmente

### Dado correto já disponível

`DashboardView.tsx` já computava `invoiceCards` via `computeInvoiceCards(creditCards, faturaTransacoes, invoicePayments, currentMonth)` — que usa `faturaTransacoes` com range estendido e respeita `closing_day`. Esse dado era passado apenas para a seção de cards de fatura, não para o `FluxoWidget`.

---

## Solução

### `FluxoWidget.tsx`

Removida prop `creditCards: CreditCardRow[]` e a lógica de cálculo interno. Adicionada prop `invoiceCards: InvoiceCardData[]` — dado já correto, vindo diretamente de `computeInvoiceCards`.

```typescript
// ANTES
interface Props {
  transactions: TransactionRow[];
  creditCards: CreditCardRow[];        // ← removido
  currentMonth: string;
  escopo: "personal" | "parceiro";
}

// DEPOIS
interface Props {
  transactions: TransactionRow[];
  invoiceCards: InvoiceCardData[];     // ← adicionado
  currentMonth: string;
  escopo: "personal" | "parceiro";
}
```

Nova lógica de `faturaItems`:

```typescript
const faturaItems: FaturaItem[] = invoiceCards
  .filter((ic) => ic.payment === null && ic.monthTotal > 0)
  .map((ic) => {
    const dueDay = Math.min(ic.card.due_day, daysInMonth);
    return {
      kind: "fatura" as const,
      id: `fatura-${ic.card.id}`,
      date: `${currentMonth}-${String(dueDay).padStart(2, "0")}`,
      cardName: ic.card.name,
      cardColor: ic.card.color,
      total: ic.monthTotal,         // ← vem de computeInvoiceCards, ciclo correto
    };
  })
  .filter((item) => item.date >= todayStr)  // só futuras
  .sort((a, b) => a.date.localeCompare(b.date));
```

`transactions` continua sendo usado exclusivamente para `cashItems` (transações sem cartão).

### `DashboardView.tsx`

```tsx
// ANTES
<FluxoWidget
  transactions={transactions}
  creditCards={creditCards}      // ← removido
  currentMonth={currentMonth}
  escopo={escopo}
/>

// DEPOIS
<FluxoWidget
  transactions={transactions}
  invoiceCards={invoiceCards}    // ← adicionado (já computado na linha 96)
  currentMonth={currentMonth}
  escopo={escopo}
/>
```

---

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/app/(app)/dashboard/_components/FluxoWidget.tsx` | Prop `creditCards` → `invoiceCards`; lógica de faturaItems reescrita |
| `src/app/(app)/dashboard/_components/DashboardView.tsx` | Passa `invoiceCards={invoiceCards}` ao FluxoWidget |

---

## Verificação Final

- [x] FluxoWidget exibe o mesmo total de fatura que os cards de fatura do dashboard
- [x] Fatura já paga não aparece no widget
- [x] Faturas com vencimento no passado não aparecem no widget
- [x] `tsc --noEmit` sem erros
- [x] Testado em produção (Vercel) — R$ 147,39 exibido corretamente
