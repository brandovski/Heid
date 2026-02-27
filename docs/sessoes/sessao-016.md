# Sessão 016 — 2026-02-27

**Fase:** Documentação — revisão abrangente pós-sessões 005–015
**Resultado:** Concluído — docs sincronizados com o estado real do projeto

---

## Objetivo

Revisar e sincronizar os três documentos principais (`regras-de-negocio.md`, `arquitetura.md`, `roadmap.md`) com todas as decisões arquiteturais e de produto tomadas nas sessões 005–015, que nunca haviam sido refletidas na documentação original (escrita nas sessões 001–004).

---

## Contexto

10 divergências identificadas entre docs e implementação:

1. Tremor **removido** e substituído por Recharts + componentes próprios
2. Modelo de compartilhamento mudou de **por-entidade** para **por-perfil** (`profiles.share_with_partner`)
3. Transações ganharam `is_shared` próprio (migration 022) — não herdado de entidade-pai
4. Orçamento é **sempre pessoal** (toggle Familiar/Pessoal foi removido na sessão 013)
5. Toggle do dashboard mudou de "Pessoal | Familiar" para **nomes reais** ("Gabriel | Heide")
6. `family_contributions` com schema alterado: `effective_from` → `date`, `transaction_id` FK adicionado
7. Unicidade de `budgets` mudou para dois índices parciais por escopo (migration 019)
8. Rotas em **português** (não inglês como na estrutura documentada)
9. `profiles` ganhou `full_name` e `share_with_partner`
10. Tabelas de investimentos existem no banco mas não apareciam na seção de BD

---

## O que foi feito

### `docs/regras-de-negocio.md`

| Seção | Mudança |
|---|---|
| 2 (Stack) | Tremor → Recharts + componentes próprios em `src/components/ui/` |
| 2.1 | Removida (sobre Tremor — obsoleta) |
| 3.5.1 (Tipos) | Adicionados `investment_deposit` e `investment_withdrawal` |
| 3.5.2 (Campos) | Adicionados `family_id`, `scope`, `user_id`, `is_shared`, `investment_id`; regra de `is_shared` automático documentada |
| 3.6 (Cartões) | Adicionados `family_id`, `scope`, `user_id`, `is_shared` |
| 3.7 (Assinaturas) | Adicionados `family_id`, `scope`, `user_id`, `is_shared` |
| 3.8 (Parcelamentos) | Adicionados `family_id`, `scope`, `user_id` |
| 3.9 (Orçamento) | Adicionados campos de escopo; unicidade = dois índices parciais; orçamento sempre pessoal; ProgressBar próprio |
| 3.10 (Perfil) | **Nova seção** — `full_name`, `share_with_partner`, avatar de iniciais, logout |
| 5 (Dashboard) | Tremor → Recharts/Tailwind próprios; toggle com nomes reais ("Gabriel \| Heide") |
| 6.1 (Tabelas) | Adicionadas `investments`, `investment_transactions`, `investment_snapshots` |
| 8 (Pastas) | Estrutura atualizada: rotas em português, componentes `ui/` reais |
| 9 (Implementação) | Expandida: 12 linhas cobrindo Fases 1–11 + Fase 1.5, com status atual |
| 10.2 | Compartilhamento via `share_with_partner` (toggle global); `is_shared` granular apenas em cartões |
| 10.3 | Removido "toggle global no topo"; comportamento documentado por tela |
| 10.4 | Schema `family_contributions` correto; contribuição = movimento real |

### `docs/arquitetura.md`

| Seção | Mudança |
|---|---|
| 2.5 | Decisão Tremor → Recharts com motivo real documentado |
| 3.1 | Componentes `ui/` reais listados; sem referência a Tremor |
| 3.3 | "Recharts" em vez de "Tremor Charts" como exemplo de biblioteca client-side |
| 7.3 | `is_shared` próprio em transactions; não herdado de entidade-pai |
| 7.4 | Schema `family_contributions` atualizado; contribuição = movimento real |
| Timestamp | `2026-02-25` → `2026-02-27` |

### `docs/roadmap.md`

- Fase 6: item "Orçamento pessoal e familiar separados (toggle)" anotado como removido na Sessão 013

### `docs/diario-dev.md`

- Sessão 016 adicionada no topo do log de sessões
- "Última sessão" atualizado de 015 → 016
- Item de revisão de docs adicionado ao "O que está feito"

---

## Verificação pós-edição

- Busca por "Tremor" em `regras-de-negocio.md` → **0 ocorrências**
- Busca por "Tremor" em `arquitetura.md` → apenas na seção 2.5 como contexto histórico da decisão (correto)
- Campos de `transactions` incluem todos os campos reais do banco
- Seção 10 reflete o comportamento real do toggle por tela
- Seção 9 alinhada com o roadmap (11 fases + Fase 1.5)

---

## Arquivos criados / modificados

```
docs/regras-de-negocio.md    ← revisão abrangente (~220 inserções, ~123 remoções)
docs/arquitetura.md          ← 6 seções atualizadas
docs/roadmap.md              ← nota sobre toggle removido na Fase 6
docs/diario-dev.md           ← sessão 016 adicionada
docs/sessoes/sessao-016.md   ← este arquivo
```

---

## Estado do banco ao final da sessão

Sem alterações de banco nesta sessão (apenas documentação).

Migrations aplicadas: 001–014, 016, 017 (Partes 1–4), 019, 020, 021, 022
Migrations diferidas: 015 (Fase 9), 017 Parte 5 (Fase 9), 018 (Fase 10)

---

## Próxima sessão

**Fase 9 — Projetos**

> ⚠️ Antes de iniciar: rodar migration 015 no Supabase via Management API (cria `projects`, `project_groups`, `project_items`).
> Em seguida, rodar migration 017 Parte 5 (ALTER TABLE project_items — depende de project_items existir).

- Listar projetos (pessoais e familiares) com status e progresso de orçamento
- Criar projeto (nome, descrição, budget total, data alvo, escopo)
- Editar / concluir / cancelar projeto
- Grupos e itens com tipos de pagamento: `cash`, `card_installment`, `deposit_remainder`
- Confirmar item (status → `confirmed`) + gerar transação (status → `paid`)
- Painel de resumo do projeto (orçado vs. real, pago vs. pendente)
