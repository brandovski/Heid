# Sessão 035 — Correção de Bug: investment_deposit_id

**Data:** 2026-03-05
**Tipo:** Correção de bug crítico
**Status:** Concluída

---

## Problema

A sessão 034 introduziu um bug crítico no fluxo de pagamento de sinais de itens de projeto com `payment_origin=investment`:

1. `project_items.deposit_transaction_id` tem FK `REFERENCES transactions(id)`
2. O código tentava salvar `investment_transactions.id` nesse campo → violação de FK
3. O INSERT em `investment_transactions` já estava commitado, mas o UPDATE do item falhava com erro 500
4. Resultado: cada clique em "Pagar Entrada" criava um novo withdrawal duplicado (orphaned), sem atualizar o item

Adicionalmente, a migration 030 havia deletado as transações do extrato, fazendo o `ON DELETE SET NULL` nular `deposit_transaction_id` em todos os itens confirmed. A UI dependia desse campo para exibir "Pagar Restante" vs "Pagar Entrada".

---

## Solução

Nova coluna `investment_deposit_id UUID REFERENCES investment_transactions(id) ON DELETE SET NULL` em `project_items`, com FK correta para `investment_transactions`.

---

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `supabase/migrations/031_add_investment_deposit_id.sql` | Nova coluna + backfill + DELETE de duplicatas |
| `src/types/database.ts` | Campo `investment_deposit_id: string \| null` em `ProjectItem` |
| `src/app/(app)/projetos/_components/types.ts` | `computeProjectStats`: `depositosParciais` aceita `investment_deposit_id` |
| `src/app/(app)/projetos/page.tsx` | Select e Pick type incluem `investment_deposit_id` |
| `src/app/(app)/projetos/[id]/_components/ItemCard.tsx` | `depositPaid = !!(deposit_transaction_id \|\| investment_deposit_id)` |
| `src/app/(app)/projetos/[id]/_components/ProjetoDetalhe.tsx` | `depositosParciais` aceita ambas; `handlePayItem` seta `investment_deposit_id` para origin=investment |
| `src/app/api/projetos/itens/[id]/pagar/route.ts` | Passo 1: checa `investment_deposit_id`; UPDATE salva `investment_deposit_id`; retorna `investment_deposit_id` |

---

## Migration 031

- **ADD COLUMN:** `investment_deposit_id UUID REFERENCES investment_transactions(id) ON DELETE SET NULL`
- **Backfill:** 4 itens confirmed atualizados (Assessoria 750, Open Bar 1250, Dia da Noiva 225, Villa Tarumã Açú 3150)
- **Sem duplicatas** a deletar (1 investment_transaction por item, sem extras)

---

## Verificação Final

- [x] 4 itens confirmed têm `investment_deposit_id` populado
- [x] ItemCard mostra "Pagar Restante" (não "Pagar Entrada") para os 4 itens
- [x] `depositosParciais` no ProjetoDetalhe inclui os sinais corretamente
- [x] `computeProjectStats` (page.tsx listing) inclui os sinais no `gasto_real`
- [x] Novo clique em "Pagar Restante" usa `investment_deposit_id` como guard (sem duplicatas)
- [x] `tsc --noEmit` sem erros
