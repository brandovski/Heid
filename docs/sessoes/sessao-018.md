# Sessão 018 — 2026-02-27

**Fase:** Fase 10 — Investimentos
**Resultado:** Concluído — módulo completo de investimentos, build sem erros, commit + push realizados

---

## Objetivo

Implementar a Fase 10 do roadmap: módulo completo de Investimentos — aportes/resgates manuais, snapshots de saldo, rentabilidade, gráfico de evolução, aportes automáticos via cron e integração com Projetos como origem de pagamento.

---

## Pré-condições resolvidas

### Migration 018 — `investment_id` em `transactions`

Aplicada via Management API. Adicionou:

- Coluna `investment_id UUID REFERENCES investments(id) ON DELETE SET NULL` em `transactions`
- Índice `idx_transactions_investment_id` (parcial: `WHERE investment_id IS NOT NULL`)
- Policy `scoped_select` recriada incluindo visibilidade de transações geradas por investimentos elegíveis do parceiro

---

## O que foi feito

### API Routes (5 arquivos)

| Arquivo | Método | Função |
|---|---|---|
| `src/app/api/investimentos/route.ts` | GET, POST | Listar investimentos da família; criar investimento |
| `src/app/api/investimentos/[id]/route.ts` | PATCH | Editar / arquivar (`is_active: false`) |
| `src/app/api/investimentos/[id]/transacoes/route.ts` | POST | Registrar aporte/resgate; cria `investment_transaction` + `transaction` financeira vinculada |
| `src/app/api/investimentos/[id]/snapshots/route.ts` | POST | Registrar saldo real da corretora (append-only) |
| `src/app/api/investimentos/transacoes/[txId]/route.ts` | DELETE | Excluir aporte/resgate manual; nega `auto_generated=true` |

### Pages e Componentes (10 arquivos)

#### `/investimentos` — Listagem

| Arquivo | Tipo | Responsabilidade |
|---|---|---|
| `src/app/(app)/investimentos/page.tsx` | Server | Query paralela: investimentos + transactions + snapshots; filtra por `family_id` |
| `_components/types.ts` | — | `INVESTMENT_TYPE_LABELS`; `calcTotalAportado`, `calcSaldoAtual`, `calcRentabilidadeReais`, `calcRentabilidadePct`; `formatCurrency` |
| `_components/InvestimentoList.tsx` | Client | Tabs Ativos/Arquivados; modal de criação |
| `_components/InvestimentoCard.tsx` | Client | Nome + badges (tipo, escopo, elegível-projetos); grid stats (Aportado/Saldo/Rentabilidade); ProgressBar de meta |
| `_components/InvestimentoModal.tsx` | Client | Criar/editar: nome, tipo (select PT-BR), descrição, ScopeSelector, meta, aporte mensal (amount + day), elegível para projetos, arquivar |

#### `/investimentos/[id]` — Detalhe

| Arquivo | Tipo | Responsabilidade |
|---|---|---|
| `src/app/(app)/investimentos/[id]/page.tsx` | Server | Query paralela: investment + transactions (DESC) + snapshots (DESC) + project_items vinculados |
| `[id]/_components/InvestimentoDetalhe.tsx` | Client | Header com badges + botões de ação; cards de stats; ProgressBar de meta; gráfico; lista de movimentações; seção "Comprometido com Projetos"; orquestra modais |
| `[id]/_components/TransacaoModal.tsx` | Client | Registrar aporte ou resgate com valor, data e notas |
| `[id]/_components/SnapshotModal.tsx` | Client | Informar saldo real da corretora (checkpoint) |
| `[id]/_components/GraficoEvolucao.tsx` | Client | Recharts LineChart da evolução temporal de snapshots; paleta blue-600 |

### Cron — `generate-monthly` estendido

**Arquivo:** `src/app/api/cron/generate-monthly/route.ts`

Bloco adicionado ao final do handler:
1. Busca `investment_transactions` com `auto_generated=true` no mês atual → Set de `investment_id` já processados (idempotência)
2. Busca `investments` com `is_active=true AND monthly_contribution_amount NOT NULL`
3. Filtra não processados
4. Para cada um: insere `transaction` (tipo `investment_deposit`, `status=paid`, `investment_id`) + `investment_transaction` (`deposit`, `auto_generated=true`, `transaction_id`)
5. Resposta inclui `generated.investments`

Idempotência garantida por pré-filtro via Set + índice único `idx_inv_tx_auto_month`.

### Integração com Projetos

- `projetos/[id]/page.tsx` — query de `investments` elegíveis adicionada
- `ProjetoDetalhe.tsx` — repassa `eligibleInvestments` para `ItemModal`
- `ItemModal.tsx` — terceira opção "Investimento" no toggle de origem; select de elegíveis; valida seleção; inclui `investment_id` no payload
- `POST /api/projetos/itens` e `PATCH /api/projetos/itens/[id]` — aceitam `investment_id`
- `POST /api/projetos/itens/[id]/pagar` — bloco `investment`: cria `investment_transaction` tipo `withdrawal`; não cria transação no extrato financeiro

### Navbar

| Posição | Antes | Depois |
|---|---|---|
| Desktop (após Projetos) | — | Link "Investimentos" com ícone `TrendingUp` |
| Mobile | sem alteração | Investimentos apenas no desktop |

---

## Arquivos criados / modificados

```
# API routes (5 novos)
src/app/api/investimentos/route.ts
src/app/api/investimentos/[id]/route.ts
src/app/api/investimentos/[id]/transacoes/route.ts
src/app/api/investimentos/[id]/snapshots/route.ts
src/app/api/investimentos/transacoes/[txId]/route.ts

# Pages e componentes (10 novos)
src/app/(app)/investimentos/page.tsx
src/app/(app)/investimentos/_components/types.ts
src/app/(app)/investimentos/_components/InvestimentoList.tsx
src/app/(app)/investimentos/_components/InvestimentoCard.tsx
src/app/(app)/investimentos/_components/InvestimentoModal.tsx
src/app/(app)/investimentos/[id]/page.tsx
src/app/(app)/investimentos/[id]/_components/InvestimentoDetalhe.tsx
src/app/(app)/investimentos/[id]/_components/TransacaoModal.tsx
src/app/(app)/investimentos/[id]/_components/SnapshotModal.tsx
src/app/(app)/investimentos/[id]/_components/GraficoEvolucao.tsx

# Modificados
src/app/api/cron/generate-monthly/route.ts    ← bloco de aportes automáticos
src/app/(app)/projetos/[id]/page.tsx          ← query eligibleInvestments
src/app/(app)/projetos/[id]/_components/ProjetoDetalhe.tsx  ← repassa prop
src/app/(app)/projetos/[id]/_components/ItemModal.tsx       ← opção Investment
src/app/api/projetos/itens/route.ts           ← aceita investment_id
src/app/api/projetos/itens/[id]/route.ts      ← aceita investment_id
src/app/api/projetos/itens/[id]/pagar/route.ts ← bloco investment
src/components/Navbar.tsx                      ← link Investimentos desktop
docs/diario-dev.md
docs/roadmap.md
```

---

## Estado do banco ao final da sessão

Migrations aplicadas: 001–022 (todas)
Migrations diferidas: nenhuma

---

## Próxima sessão

**Sessão 019 — Correção de bugs Fase 10**

Bug reportado após uso: "Saldo Atual" não reflete aportes/resgates registrados no mesmo dia do snapshot, e mostra valor errado quando múltiplos snapshots têm a mesma data.
