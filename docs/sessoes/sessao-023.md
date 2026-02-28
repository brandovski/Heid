# Sessão 023 — 2026-02-27

**Fase:** Fluxo de Entrada + Restante em Projetos e Projeção Dividida em Investimentos
**Resultado:** Concluído — 8 arquivos modificados, `tsc --noEmit` limpo, commit + push realizados

---

## Objetivo

Implementar pagamento em dois passos para itens do tipo `deposit_remainder` no módulo de Projetos e exibir os dois eventos separadamente (entrada / restante) na projeção de Investimentos — sem nenhuma nova migration (todos os campos necessários já existiam em `project_items`).

---

## Campos já existentes utilizados

| Campo | Tabela | Uso |
|---|---|---|
| `deposit_amount` | `project_items` | Valor do sinal |
| `remainder_date` | `project_items` | Data prevista do restante |
| `expected_payment_date` | `project_items` | Data prevista da entrada |
| `deposit_transaction_id` | `project_items` | UUID da transação do sinal (passo 1) |
| `remainder_transaction_id` | `project_items` | UUID da transação do restante (passo 2) |

---

## O que foi feito

### 1. `ItemModal.tsx` — modo confirm aprimorado

- **`actualAmount`** agora usa `budget_amount` como fallback quando `actual_amount` é `null` (aplica a todos os tipos de pagamento)
- Novos states: `confirmDepositAmount` (pré-preenchido com `deposit_amount`) e `confirmRemainderDate` (pré-preenchido com `remainder_date`)
- Modo confirm para `deposit_remainder` exibe **4 campos separados**:
  1. Valor Total Real (R$)
  2. Valor da Entrada (R$)
  3. Data de pagamento da entrada (`expectedPaymentDate`)
  4. Data de pagamento do restante (`confirmRemainderDate`)
  - Helper em tempo real: `"Restante: R$ X"` calculado como total − entrada
- Payload PATCH inclui `deposit_amount` e `remainder_date` condicionalmente para `deposit_remainder`

### 2. `src/app/api/projetos/itens/[id]/route.ts` — PATCH confirm

O handler de confirmação (`status: "considering" → "confirmed"`) passou a aceitar opcionalmente `deposit_amount` e `remainder_date`:

```typescript
if (deposit_amount != null) updateFields.deposit_amount = parseFloat(deposit_amount);
if (remainder_date !== undefined) updateFields.remainder_date = remainder_date ?? null;
```

### 3. `ItemCard.tsx` — botões em dois passos

Para itens `deposit_remainder` em status `confirmed`, o menu dropdown exibe:
- `deposit_transaction_id === null` → **"Pagar Entrada"**
- `deposit_transaction_id !== null` → **"Pagar Restante"**

Row de info visual adicionada abaixo dos amounts:
```
Entrada: R$ 500 ✓  |  Restante: R$ 1.300
```
O ✓ aparece apenas quando a entrada já foi paga.

### 4. `ProjetoDetalhe.tsx` — `handlePayItem` ciente de passos

```typescript
const data = await res.json();
if (data.step === "deposit") {
  // Entrada paga: item permanece "confirmed", só atualiza deposit_transaction_id
  return { ...i, deposit_transaction_id: data.deposit_transaction_id };
}
// Restante pago (ou pagamento único): status → "paid"
return { ...i, status: "paid" as const };
```

### 5. `src/app/api/projetos/itens/[id]/pagar/route.ts` — lógica de dois passos

Para `payment_type === "deposit_remainder"`:

**Passo 1** (sem `deposit_transaction_id`):
- Cria transação: `description = "${name} — Sinal"`, `amount = deposit_amount`, `status = "paid"`
- Atualiza `project_items.deposit_transaction_id`
- Item **permanece `confirmed`**
- Retorna `{ step: "deposit", deposit_transaction_id }`

**Passo 2** (`deposit_transaction_id` já existente):
- Cria transação: `description = "${name} — Restante"`, `amount = actual_amount - deposit_amount`, `status = "paid"`
- Atualiza `project_items.status = "paid"` + `remainder_transaction_id`
- Retorna `{ step: "remainder" }`

### 6. `investimentos/[id]/page.tsx` — query ampliada

```typescript
.select("id, name, actual_amount, budget_amount, expected_payment_date, status, payment_type, deposit_amount, remainder_date, deposit_transaction_id")
```

### 7. `InvestimentoDetalhe.tsx` — interface atualizada

`ProjectItemRef` ampliado com: `payment_type`, `deposit_amount`, `remainder_date`, `deposit_transaction_id`.

### 8. `ProjecaoView.tsx` — projeção dividida

Para itens `deposit_remainder` em status `confirmed`, dois eventos separados são gerados:

| Evento | Data | Valor |
|---|---|---|
| `${name} — Entrada` | `expected_payment_date` | `−deposit_amount` (se entrada ainda não paga) |
| `${name} — Restante` | `remainder_date` | `−(actual_amount − deposit_amount)` |

- Itens com `status = "paid"` não aparecem na projeção
- Se não houver nenhuma data futura, o item vai para a seção "Comprometido sem data prevista"

---

## Arquivos modificados (8)

```
src/app/(app)/projetos/[id]/_components/ItemModal.tsx
src/app/(app)/projetos/[id]/_components/ItemCard.tsx
src/app/(app)/projetos/[id]/_components/ProjetoDetalhe.tsx
src/app/api/projetos/itens/[id]/route.ts
src/app/api/projetos/itens/[id]/pagar/route.ts
src/app/(app)/investimentos/[id]/page.tsx
src/app/(app)/investimentos/[id]/_components/InvestimentoDetalhe.tsx
src/app/(app)/investimentos/[id]/_components/ProjecaoView.tsx
```

---

## Verificação

- `tsc --noEmit` → zero erros ✅
- Modal confirm `deposit_remainder`: 4 campos pré-preenchidos, cálculo do restante em tempo real ✅
- Modal confirm `cash`/`card_installment`: apenas valor real + data prevista ✅
- `confirmed` + `deposit_remainder` + sem entrada paga → menu mostra "Pagar Entrada" ✅
- Clicar "Pagar Entrada" → item permanece `confirmed`, `deposit_transaction_id` setado, menu muda para "Pagar Restante" ✅
- Clicar "Pagar Restante" → item vai para `paid` ✅
- Projeção: dois eventos separados (entrada na `expected_payment_date`, restante na `remainder_date`) ✅
- Após pagar entrada: evento da entrada desaparece, restante permanece ✅

---

## Commits

```
c632e75 feat: pagamento em dois passos para Sinal + Restante em Projetos
```

Push realizado para `origin/main`.

---

## Próxima sessão

**Sessão 024** — Redesign da navegação mobile.
