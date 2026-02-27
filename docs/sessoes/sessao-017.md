# Sessão 017 — 2026-02-27

**Fase:** Fase 9 — Projetos
**Resultado:** Concluído — módulo completo de projetos, build sem erros, commit + push realizados

---

## Objetivo

Implementar a Fase 9 do roadmap: módulo completo de Projetos — objetivos financeiros maiores (casamento, viagem, reforma) com orçamento, grupos de gasto, itens e geração automática de transações ao pagar.

---

## Pré-condições resolvidas

### Migration 015 — `projects`, `project_groups`, `project_items`

Aplicada via Management API (Node.js HTTPS, sem jq/Python). Criou:

| Tabela | RLS |
|---|---|
| `projects` | `scoped_select` + `scoped_modify` (por scope + family_id/user_id) |
| `project_groups` | `family_access` (herda via subquery em `projects`) |
| `project_items` | `family_access` (herda via subquery em `projects`) |

Triggers de `updated_at` em `projects` e `project_items`.

### Migration 017 Parte 5 — `ALTER TABLE project_items`

Aplicada em chamada separada (dependia de `project_items` existir). Adicionou:

- Coluna `investment_id UUID REFERENCES investments(id) ON DELETE SET NULL`
- Coluna `expected_payment_date DATE`
- Restrição `chk_item_payment_origin` expandida: `'personal' | 'family' | 'investment'`
- Restrição `chk_item_investment_required`: `investment_id` obrigatório quando `payment_origin = 'investment'`
- Índice `idx_project_items_investment` (parcial: `WHERE investment_id IS NOT NULL`)

---

## O que foi feito

### API Routes (7 arquivos)

| Arquivo | Método | Função |
|---|---|---|
| `src/app/api/projetos/route.ts` | POST | Criar projeto (`name`, `description`, `total_budget`, `target_date`, `scope`) |
| `src/app/api/projetos/[id]/route.ts` | PATCH | Editar / mudar status (`active`/`completed`/`cancelled`) |
| `src/app/api/projetos/[id]/grupos/route.ts` | POST | Criar grupo em projeto |
| `src/app/api/projetos/grupos/[id]/route.ts` | PATCH / DELETE | Editar / excluir grupo (cascade deleta itens via FK) |
| `src/app/api/projetos/itens/route.ts` | POST | Criar item com `status = 'considering'` |
| `src/app/api/projetos/itens/[id]/route.ts` | PATCH / DELETE | Editar, confirmar (flag `confirmar: true` + `actual_amount`) e soft-cancel (`status → cancelled`) |
| `src/app/api/projetos/itens/[id]/pagar/route.ts` | POST | Pagar item confirmado — gera transações conforme `payment_type` |

#### Lógica de geração de transações (`/pagar`)

```
cash:
  INSERT transactions (expense, paid, date=hoje)
  UPDATE project_items SET status='paid', transaction_id=tx.id

card_installment:
  INSERT installment_groups
  INSERT transactions × N (type='installment', pending, credit_card_id)
  UPDATE project_items SET status='paid', transaction_id=first_tx.id

deposit_remainder:
  INSERT transactions sinal (expense, paid, date=hoje)
  INSERT transactions restante (expense, pending, date=remainder_date)
  UPDATE project_items SET status='paid',
    deposit_transaction_id=sinal.id,
    remainder_transaction_id=restante.id
```

Mapeamento de `payment_origin` → scope da transação:
- `personal` → `scope='personal'`, `user_id=payment_user_id`
- `family` → `scope='family'`, `user_id=null`

### Pages e Componentes (11 arquivos)

#### `/projetos` — Listagem

| Arquivo | Tipo | Responsabilidade |
|---|---|---|
| `src/app/(app)/projetos/page.tsx` | Server | Query paralela projetos + itens (stats); passa para ProjetoList |
| `_components/types.ts` | — | `ProjectWithStats`, `ProjectGroupWithItems`, `ProjectItemWithRelations`; helpers `computeProjectStats`, `formatCurrency`, `formatDate`; labels/cores de status |
| `_components/ProjetoList.tsx` | Client | Tabs Ativos/Concluídos/Cancelados/Todos; card de totais (nº ativos + orçamento); botão "Novo projeto" |
| `_components/ProjetoCard.tsx` | Client | Card com nome + badges de status/scope + ProgressBar + data alvo; menu "..." com ações Editar/Concluir/Cancelar/Reativar |
| `_components/ProjetoModal.tsx` | Client | Criar/editar projeto: nome, descrição, orçamento, DatePicker, toggle Familiar/Pessoal |

#### `/projetos/[id]` — Detalhe

| Arquivo | Tipo | Responsabilidade |
|---|---|---|
| `src/app/(app)/projetos/[id]/page.tsx` | Server | Query paralela: projeto + grupos + itens (com credit_card join) + categorias + cartões |
| `_components/ProjetoDetalhe.tsx` | Client | Header com badges + botões Editar/Concluir; 4 cards de resumo (Orçamento Total, Previsto, Gasto Real, Saldo Real); lista de GrupoSection; banner de conclusão quando todos os itens não-cancelados estão `paid`; orquestra todos os modais |
| `_components/GrupoSection.tsx` | Client | Header com nome + subtotal + botões Adicionar/Editar/Excluir; lista expansível de ItemCard |
| `_components/ItemCard.tsx` | Client | 2 linhas: nome + badges de status/tipo de pagamento / valores orçado→real; menu de ações por status (considering: Editar/Confirmar/Cancelar; confirmed: Editar/Pagar/Cancelar; paid: read-only; cancelled: riscado) |
| `_components/ItemModal.tsx` | Client | 3 modos (create/edit/confirm); campos condicionais por tipo de pagamento (cash: método; card_installment: cartão + parcelas; deposit_remainder: sinal + DatePicker + preview do restante); modo confirm só pede `actual_amount` |
| `_components/GrupoModal.tsx` | Client | Criar/editar grupo: nome, descrição |

### Navbar

| Posição | Antes | Depois |
|---|---|---|
| Desktop (após Família) | — | Link "Projetos" com ícone `Target` |
| Mobile (posição 3) | "Cartões" (`CreditCard`) | "Projetos" (`Target`) |

Mobile final: `Dashboard · Transações · Projetos · Orçamento · Família`

---

## Arquivos criados / modificados

```
# API routes (7 novos)
src/app/api/projetos/route.ts
src/app/api/projetos/[id]/route.ts
src/app/api/projetos/[id]/grupos/route.ts
src/app/api/projetos/grupos/[id]/route.ts
src/app/api/projetos/itens/route.ts
src/app/api/projetos/itens/[id]/route.ts
src/app/api/projetos/itens/[id]/pagar/route.ts

# Pages e componentes (11 novos)
src/app/(app)/projetos/page.tsx
src/app/(app)/projetos/_components/types.ts
src/app/(app)/projetos/_components/ProjetoList.tsx
src/app/(app)/projetos/_components/ProjetoCard.tsx
src/app/(app)/projetos/_components/ProjetoModal.tsx
src/app/(app)/projetos/[id]/page.tsx
src/app/(app)/projetos/[id]/_components/ProjetoDetalhe.tsx
src/app/(app)/projetos/[id]/_components/GrupoSection.tsx
src/app/(app)/projetos/[id]/_components/ItemCard.tsx
src/app/(app)/projetos/[id]/_components/ItemModal.tsx
src/app/(app)/projetos/[id]/_components/GrupoModal.tsx

# Modificados
src/components/Navbar.tsx          ← Target importado, mobile substituído, desktop adicionado
docs/diario-dev.md                 ← estado atual, sessão 017 adicionada
docs/roadmap.md                    ← Fase 9 marcada como concluída
docs/sessoes/sessao-017.md         ← este arquivo
docs/session-start-prompt.md       ← referência atualizada para sessao-017
```

---

## Estado do banco ao final da sessão

Migrations aplicadas: 001–017, 019, 020, 021, 022
Migrations diferidas: 018 (Fase 10 — adiciona `investment_id` em `transactions`)

---

## Próxima sessão

**Fase 10 — Investimentos**

> ⚠️ Antes de iniciar: rodar migration 018 no Supabase via Management API.
> Migration 018: adiciona `investment_id UUID REFERENCES investments(id)` em `transactions` + atualiza `scoped_select`.

- Listar investimentos com saldo atual e tipo
- Criar / editar / arquivar investimento
- Registrar aportes e resgates manuais
- Snapshots de saldo de mercado com gráfico de evolução
- Cálculo de rentabilidade (total aportado vs. saldo atual)
- Integração com Projetos: investimentos elegíveis como opção de pagamento de item
