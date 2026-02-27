# Sessão 019 — 2026-02-27

**Fase:** Correção de bugs — Fase 10 (Investimentos)
**Resultado:** Concluído — 2 bugs corrigidos, `tsc --noEmit` limpo, commit + push realizados

---

## Objetivo

Investigar e corrigir o bug reportado no "Cofrinho do Casal": Saldo Atual exibindo R$2.029 (incorreto) com rentabilidade de −R$3.971, sem se atualizar após aportes ou após clicar em "Atualizar Saldo".

---

## Diagnóstico

### Dados reais no banco (ordenados por `created_at`)

| Hora UTC    | Evento                    | Valor    |
|-------------|---------------------------|----------|
| 20:15:13    | Aporte R$2.000 (tx-1)    | —        |
| 20:15:35    | Snapshot (snap-1)         | R$2.029  |
| 20:16:22    | Snapshot (snap-2)         | R$4.029  |
| 20:16:49    | Snapshot (snap-3)         | R$4.029  |
| 20:19:40    | Aporte R$2.000 (tx-2)    | —        |
| 20:21:23    | Aporte R$2.000 (tx-3)    | —        |
| 20:36:50    | Snapshot (snap-4)         | R$6.029  ← correto |

Snapshot mais recente por `created_at`: **R$6.029**. Saldo esperado: R$6.029. Rentabilidade: +R$29.

---

### Bug 1 — Sort não-determinístico de snapshots (crítico)

**Causa:** as queries de snapshots ordenavam apenas por `date DESC`:

```ts
.order("date", { ascending: false })
```

Todos os 4 snapshots tinham `date = "2026-02-27"`. Com empate de datas, o PostgreSQL retorna a ordem que bem entender — e estava retornando snap-1 (R$2.029, mais antigo por `created_at`) como `snapshots[0]`. O algoritmo `calcSaldoAtual` usa `snapshots[0]` como referência, resultando no valor errado.

**Fix:** adicionar sort secundário `created_at DESC` em ambas as pages de investimentos:

```ts
.order("date", { ascending: false })
.order("created_at", { ascending: false })
```

---

### Bug 2 — Comparação de data-string falha no mesmo dia

**Causa:** `calcSaldoAtual` filtrava transações posteriores ao snapshot usando comparação de datas (strings):

```ts
.filter((tx) => tx.date > last.date)
// "2026-02-27" > "2026-02-27" → false
```

Quando aportes são registrados no mesmo dia do snapshot (cenário mais comum no uso diário), `tx.date === last.date`, então `>` é `false` e o aporte é excluído do cálculo — mesmo que tenha sido registrado **depois** do snapshot.

**Fix:** comparar `created_at` (ISO timestamp) em vez de `date` (string de data):

```ts
.filter((tx) => tx.created_at > last.created_at)
// "2026-02-27T20:21Z" > "2026-02-27T20:36Z" → false ✓ (tx antes do snap)
// "2026-02-27T20:40Z" > "2026-02-27T20:36Z" → true  ✓ (tx depois do snap)
```

---

### Bug 3 — `calcSaldoAtual` não aceitava `transactions` (pré-existente)

**Causa (já corrigido na mesma sessão, antes do diagnóstico):** `calcSaldoAtual(snapshots)` retornava apenas o valor do último snapshot, ignorando transações. Aportes sem snapshot posterior nunca eram refletidos no Saldo Atual.

**Fix:** nova assinatura e algoritmo:

```ts
export function calcSaldoAtual(
  snapshots: InvestmentSnapshot[],
  transactions: InvestmentTransaction[]
): number | null {
  if (snapshots.length === 0 && transactions.length === 0) return null;
  if (snapshots.length === 0) return calcTotalAportado(transactions);

  const last = snapshots[0]; // mais recente (date DESC, created_at DESC)
  const afterNet = transactions
    .filter((tx) => tx.created_at > last.created_at)
    .reduce((s, tx) => (tx.type === "deposit" ? s + tx.amount : s - tx.amount), 0);

  return last.value + afterNet;
}
```

---

## Comportamento correto após os fixes

| Situação | Saldo Atual |
|---|---|
| Sem snapshot + sem transações | `—` |
| Sem snapshot, com aportes | net de todos os aportes |
| Com snapshot, sem aportes posteriores | valor do snapshot |
| Com snapshot + aportes posteriores | snapshot + net dos aportes após o `created_at` do snapshot |

---

## Arquivos modificados (5)

```
src/app/(app)/investimentos/_components/types.ts
  ← calcSaldoAtual: nova assinatura + algoritmo com created_at
  ← calcRentabilidadeReais: repassa transactions para calcSaldoAtual

src/app/(app)/investimentos/_components/InvestimentoCard.tsx
  ← calcSaldoAtual(snapshots, transactions)

src/app/(app)/investimentos/[id]/_components/InvestimentoDetalhe.tsx
  ← calcSaldoAtual(snapshots, transactions)

src/app/(app)/investimentos/page.tsx
  ← .order("created_at", { ascending: false }) adicionado aos snapshots

src/app/(app)/investimentos/[id]/page.tsx
  ← .order("created_at", { ascending: false }) adicionado aos snapshots
```

---

## Verificação

- `tsc --noEmit` → zero erros ✅
- "Cofrinho do Casal": Saldo Atual = R$6.029, Rentabilidade = +R$29 (+0,5%) ✅

---

## Commits

```
131cfa9 fix: corrige Saldo Atual em Investimentos
fba7404 feat: Fase 10 — módulo de Investimentos completo  ← do push anterior
```

Push realizado para `origin/main`.

---

## Próxima sessão

**Fase 11** — a definir com o gestor.
