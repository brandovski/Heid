# Sessão 040 — billing_day derivado de start_date + primeira transação imediata

**Data:** 2026-03-06
**Commit:** `3a93bff`

## Contexto

`billing_day` era informado manualmente pelo usuário como campo separado de `start_date`, gerando inconsistência (ex: assinar no dia 6 mas informar dia 5). Além disso, a primeira transação só seria gerada pelo cron no mês seguinte — assinaturas criadas hoje nunca apareciam na fatura do mês atual.

## O que foi feito

### AssinaturaModal.tsx
- Removido estado `billingDay` e `setBillingDay`
- Removido `billing_day` da validação e do payload do form
- Substituído o `grid grid-cols-2` (billing_day + início) por um único DatePicker full-width com label **"Data de início (1ª cobrança)"**

### `src/app/api/assinaturas/route.ts` (POST)
- Removido `billing_day` do destructuring e da validação
- `billing_day` derivado automaticamente: `parseInt(start_date.split("-")[2], 10)`
- Após o INSERT da assinatura, gera a primeira transação imediatamente com `date = start_date`, respeitando lógica promocional (idêntica ao cron)

### `src/app/api/assinaturas/[id]/route.ts` (PATCH)
- Removido `billing_day` do destructuring e do bloco de updates — `billing_day` não é mais alterável via edição

## O que NÃO mudou
- Cron `generate-monthly`: sem alteração. Deduplicação por `subscription_id` garante que não haverá duplicatas
- Schema DB: coluna `billing_day` permanece — só muda quem a preenche (API, não UI)

## Resultado
- `npx tsc --noEmit` → zero erros
- Criar assinatura com `start_date = hoje` → transação `type=subscription, status=pending` aparece imediatamente na fatura do mês atual
- Campo "Dia de cobrança" removido do modal

## Pendência pós-deploy
- Acionar cron `generate-monthly` manualmente via Vercel dashboard para gerar transações das 4 assinaturas existentes (sem risco de duplicata)
