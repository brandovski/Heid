# Sessão 029 — 2026-03-01

**Fase:** Aportes Mensais com Confirmação Manual + Melhorias no Dashboard
**Resultado:** Concluído (inclui sessão 029b) — 12 arquivos modificados, migration 024 aplicada, `tsc --noEmit` limpo, commit + push realizados

---

## Objetivo

Implementar um fluxo de aportes mensais para investimentos que:
1. Permite configurar valor e dia de aporte para cada membro (dono + parceiro)
2. Não gera transações automaticamente via cron — o usuário confirma manualmente todo mês
3. Exibe pendências de aporte no Dashboard e na lista de investimentos

---

## O que foi feito

### Sessão 029 — Core da feature

#### 1. Migration 024

```sql
-- Aportes do parceiro em investments
ALTER TABLE investments
  ADD COLUMN partner_contribution_amount NUMERIC(12,2),
  ADD COLUMN partner_contribution_day    INTEGER,
  ADD CONSTRAINT chk_investments_partner_contribution
    CHECK ((partner_contribution_amount IS NULL) = (partner_contribution_day IS NULL));

-- Identificação do contribuinte em investment_transactions
ALTER TABLE investment_transactions
  ADD COLUMN contributor_user_id UUID REFERENCES auth.users(id);
```

#### 2. `src/types/database.ts`

Atualizado com os novos campos `partner_contribution_amount`, `partner_contribution_day` e `contributor_user_id`.

#### 3. `src/lib/investment-utils.ts` — NOVO

```ts
// Tipos exportados
export type InvestmentContributionRow
export type InvTransactionRow
export type AporteCardData

// Função principal
export function computeAporteCards(
  investments: InvestmentContributionRow[],
  transactions: InvTransactionRow[],
  currentUserId: string,
  currentMonth: string  // "YYYY-MM"
): AporteCardData[]
```

Calcula para cada investimento se o aporte do mês atual foi confirmado ou está pendente, para o usuário atual.

#### 4. APIs de investimentos

| Endpoint | Mudança |
|---|---|
| `POST /api/investimentos` | Aceita `partner_contribution_amount` e `partner_contribution_day` |
| `PATCH /api/investimentos/[id]` | Aceita `partner_contribution_amount` e `partner_contribution_day` |
| `POST /api/investimentos/[id]/transacoes` | Depósitos passam de `investment_deposit` para `expense` pessoal do contribuinte + salva `contributor_user_id` |

#### 5. Cron `generate-monthly`

Bloco de aportes automáticos de investimentos **removido completamente**. O cron não gera mais transações de investimento — o usuário confirma manualmente.

#### 6. `src/components/ui/ConfirmarAporteModal.tsx` — NOVO

Modal para confirmação manual de aporte mensal:
- Toggle **Integral** (valor configurado) / **Outro valor**
- `DatePicker` para selecionar a data do aporte
- Campo de notas opcional
- `POST /api/investimentos/[id]/transacoes` com `{ type: "deposit", amount, date, notes, contributor_user_id }`

#### 7. `InvestimentoModal.tsx` — card expansível "Aporte Mensal"

Novo bloco expansível com `ChevronDown` que substitui os campos avulsos:

- **Escopo `personal`:** um bloco (valor + dia)
- **Escopo `family`:** dois blocos (Aporte de [você] + Aporte de [parceiro])

```tsx
<button onClick={() => setContributionOpen(v => !v)}>
  Aporte Mensal
  <ChevronDown className={contributionOpen ? "rotate-180" : ""} />
</button>
{contributionOpen && (
  <div> {/* campos de valor e dia */} </div>
)}
```

### Sessão 029b — Dashboard + InvestimentoList

#### 8. Dashboard — widget "Aportes do Mês"

`dashboard/page.tsx` adiciona 2 novas queries em `Promise.all`:
- `investments` (ativos da família)
- `invTransactions` (transações do mês atual com `contributor_user_id`)

`DashboardView.tsx` — widget com `AporteCard` inline:
- Badge de tipo de investimento
- Dia configurado, valor, status (Confirmado ✅ / Pendente ⏳)
- `ConfirmarAporteModal` ao clicar em "Confirmar"

#### 9. `InvestimentoList.tsx` — banner de pendências

Banner âmbar visível quando há aportes pendentes no mês:
```tsx
{pendentes.length > 0 && (
  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
    <p>{pendentes.length} aporte(s) pendente(s) este mês</p>
    <button onClick={() => setAporteModal(item)}>Confirmar</button>
  </div>
)}
```

`investimentos/page.tsx` passa `userId` ao `InvestimentoList`.

---

## Arquivos modificados (12)

```
supabase/migrations/024_partner_contribution.sql   ← NOVO
src/types/database.ts
src/lib/investment-utils.ts                        ← NOVO
src/components/ui/ConfirmarAporteModal.tsx         ← NOVO
src/app/api/investimentos/route.ts
src/app/api/investimentos/[id]/route.ts
src/app/api/investimentos/[id]/transacoes/route.ts
src/app/api/cron/generate-monthly/route.ts
src/app/(app)/investimentos/_components/InvestimentoModal.tsx
src/app/(app)/investimentos/_components/InvestimentoList.tsx
src/app/(app)/investimentos/page.tsx
src/app/(app)/dashboard/_components/DashboardView.tsx
src/app/(app)/dashboard/page.tsx
src/app/(app)/dashboard/types.ts
docs/diario-dev.md
```

---

## Verificação

- `tsc --noEmit` → zero erros ✅
- Migration 024 aplicada no Supabase ✅
- Cron não gera mais aportes automáticos de investimentos ✅
- Card expansível "Aporte Mensal" funciona para escopo personal e family ✅
- Widget Dashboard exibe pendências do mês com status correto ✅
- Banner InvestimentoList exibe pendências com botão "Confirmar" ✅
- `ConfirmarAporteModal` toggle integral/outro valor e DatePicker ✅
- `contributor_user_id` salvo corretamente nas transações de aporte ✅

---

## Commits

```
f518a3c feat: aportes mensais com confirmação manual e melhorias no Dashboard (sessões 029 e 029b)
```

Push realizado para `origin/main`.

---

## Próxima sessão

Sessão 030 — Melhorias no formulário de nova compra parcelada.
