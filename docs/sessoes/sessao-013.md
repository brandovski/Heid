# Sessão 013 — 2026-02-26

**Fase:** Reestruturação de Escopo Pessoal/Familiar (pós-Fase 8)
**Resultado:** Concluído — pronto para Sessão 014 (correção de bugs)

---

## Objetivo

Separar claramente os escopos de dados em cada tela:

- `/transacoes` — apenas pessoal (usuário logado); aba do parceiro mostra transações compartilhadas
- `/familia` — apenas familiar (scope = 'family')
- `/orcamento` — sempre pessoal (sem toggle)
- `/dashboard` — toggle pessoal / parceiro (nomes reais dos usuários)
- Perfil de usuário (`/perfil`) com avatar/iniciais e toggle de compartilhamento
- Parcelamento inline no `TransacaoModal` (despesa + cartão → opção de parcelar)

---

## O que foi feito

### Banco (via Management API — sem migration)

- `UPDATE profiles SET full_name = 'Gabriel'` e `SET full_name = 'Heide'`
- `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS share_with_partner BOOLEAN NOT NULL DEFAULT false`
- `Transaction.is_shared` adicionado ao tipo em `src/types/database.ts`

### A — /familia

| Arquivo | Mudança |
|---|---|
| `page.tsx` | Adiciona queries de `categories` e `credit_cards` ao `Promise.all`; passa `categorias` e `cartoes` para `FamiliaView` |
| `types.ts` | `FamilyTransaction` expandida com `auto_generated`, `category_id`, `credit_card_id` |
| `FamiliaView.tsx` | Botão "Nova Transação"; ações por card (editar/pagar/cancelar/excluir); modal de pagar inline (`PagarFamiliaModal`); render `TransacaoFamiliarModal` |
| `TransacaoFamiliarModal.tsx` | **Novo** — modal completo: tipo Despesa/Receita, campos padrão, forma de pagamento, cartão, parcelamento (mesmo padrão do TransacaoModal), scope hardcoded `'family'` |

### B — /transacoes

| Arquivo | Mudança |
|---|---|
| `page.tsx` | Adiciona `.eq('scope', 'personal')` na query principal; busca `partnerName` e `share_with_partner` dos profiles |
| `TransacaoList.tsx` (lógica interna) | Remove abas "Tudo" e "Familiar"; adiciona tabs "Meu" e `partnerName` (nome real); toggle "Compartilhar com [Parceiro]" (PATCH `/api/profile/sharing`) |
| `TransacaoCard.tsx` | `onEdit` e `onPagar` tornados opcionais — exibição read-only na aba do parceiro |
| `TransacaoModal.tsx` | Remove `ScopeSelector`; `scope: 'personal'` hardcoded; **parcelamento adicionado**: toggle À vista/Parcelado ao selecionar despesa + cartão; se parcelado → POST `/api/parcelamentos` |
| `api/transacoes/route.ts` | Lê `share_with_partner` do perfil e define `is_shared` automaticamente; `user_id` sempre preenchido para scope personal |

### C — /dashboard

| Arquivo | Mudança |
|---|---|
| `_components/types.ts` | `EscopoType` muda de `"family"` para `"parceiro"` |
| `page.tsx` | Busca `partnerName` dos profiles; default escopo = `"personal"`; query `"parceiro"` filtra `.eq('is_shared', true).neq('user_id', user.id)`; orçamento sempre pessoal |
| `_components/DashboardView.tsx` | Toggle renomeado para nome real do usuário / nome do parceiro; prop `partnerName` adicionada |

### D — /orcamento

| Arquivo | Mudança |
|---|---|
| `page.tsx` | Remove `escopo` de `searchParams`; sempre usa `scope='personal'` e `user_id` do usuário logado |
| `_components/OrcamentoList.tsx` | Remove toggle Familiar/Pessoal; título "Orçamento Pessoal"; navegação sem `escopo` na URL |
| `_components/OrcamentoModal.tsx` | Remove prop `escopo`; `scope: 'personal'` hardcoded |

### E — /perfil + API

**Novo: `src/app/(app)/perfil/page.tsx`** — page de perfil com:
- Avatar com iniciais do nome (gerado automaticamente)
- Nome completo e e-mail do usuário
- Botão de logout

**Novo: `src/app/(app)/perfil/_components/LogoutButton.tsx`** — client component para logout via Supabase

**Novo: `src/app/api/profile/sharing/route.ts`** — `PATCH` para atualizar `share_with_partner` no perfil do usuário logado

---

## Decisões tomadas

| Decisão | Motivo |
|---|---|
| `is_shared` definido automaticamente no servidor | Evita que o cliente manipule visibilidade de dados — o server lê `profile.share_with_partner` e decide |
| Dashboard "Parceiro" filtra `is_shared = true AND user_id != meu_id` | Mostra apenas o que o parceiro optou por compartilhar |
| Toggle de compartilhamento é persistente (salvo no banco) | Não por transação — comportamento global mais simples e seguro |
| Transações de fatura de cartão exibidas apenas na aba "Meu" | São sempre do usuário logado; irrelevante na aba do parceiro |
| `EscopoType` do dashboard: `"family"` → `"parceiro"` | Semântica mais clara — não é a família em si, é a perspectiva do parceiro |
| `PagarFamiliaModal` embutido no `FamiliaView` | Modal simples e sem reutilização — arquivo separado seria desnecessário |

---

## Problemas encontrados

- `Transaction` em `database.ts` não tinha `is_shared` → adicionado o campo ao interface
- Build passando sem erros após correção

---

## Arquivos criados / modificados

```
src/types/database.ts                              ← +is_shared em Transaction

src/app/(app)/perfil/
├── page.tsx                                       ← novo
└── _components/
    └── LogoutButton.tsx                           ← novo

src/app/api/profile/
└── sharing/
    └── route.ts                                   ← novo

src/app/(app)/familia/_components/
├── FamiliaView.tsx                                ← +botão Nova Transação, ações por card
├── TransacaoFamiliarModal.tsx                     ← novo
└── types.ts                                       ← +campos em FamilyTransaction

src/app/(app)/familia/page.tsx                     ← +categories, +credit_cards ao Promise.all

src/app/(app)/transacoes/
├── page.tsx                                       ← +scope=personal filter, +partnerName
└── _components/
    ├── TransacaoCard.tsx                          ← onEdit/onPagar opcionais
    ├── TransacaoList.tsx                          ← abas Meu/Parceiro, toggle compartilhamento
    ├── TransacaoModal.tsx                         ← sem ScopeSelector; +parcelamento inline
    └── types.ts                                   ← updates menores

src/app/(app)/dashboard/page.tsx                   ← escopo parceiro, nomes reais
src/app/(app)/dashboard/_components/
├── DashboardView.tsx                              ← toggle com nomes reais
└── types.ts                                       ← EscopoType: "family"→"parceiro"

src/app/(app)/orcamento/page.tsx                   ← sem escopo, sempre personal
src/app/(app)/orcamento/_components/
├── OrcamentoList.tsx                              ← sem toggle Familiar/Pessoal
└── OrcamentoModal.tsx                             ← scope hardcoded personal

src/app/api/transacoes/route.ts                    ← is_shared automático via profile

docs/diario-dev.md                                 ← sessão 013 adicionada
docs/sessoes/sessao-013.md                         ← este arquivo
```

---

## Estado do banco ao final da sessão

Migrations aplicadas: 001–014, 016, 017 (Partes 1–4), 019, 020, 021
Migrations diferidas: 015 (Fase 9), 017 Parte 5 (Fase 9), 018 (Fase 10), 022 (aplicada na Sessão 014)

---

## Próxima sessão

**Sessão 014 — Correção de bugs pós-escopo:**
- Cartão do parceiro visível em `/cartoes` (cartão com `is_shared = true` incorreto)
- Transações do parceiro ausentes no dashboard/transações (coluna `is_shared` não existia no banco)
