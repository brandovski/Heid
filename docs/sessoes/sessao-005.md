# Sessão 005 — 2026-02-25

**Fase:** Fase 2 — CRUD Base + Ajustes de UX/Mobile
**Resultado:** Fase 2 concluída e validada em produção; padrões de UI/mobile estabelecidos

---

## Objetivo

Implementar o CRUD das entidades base (Fase 2) e, após testes do gestor, aplicar ajustes de UX focados em modal e experiência mobile.

---

## O que foi feito

### Fase 2 — CRUD Base

**Dependências instaladas**
- `lucide-react` — biblioteca de ícones

**Componentes compartilhados criados**
- `src/components/Navbar.tsx` — navegação principal com ícones
- `src/components/ui/Modal.tsx` — wrapper de modal reutilizável
- `src/components/ui/ScopeSelector.tsx` — seletor pessoal/familiar + toggle compartilhamento

**Categorias** (`/categorias`)
- Listagem em grid com ícone, nome e swatch de cor
- Criar / editar via modal (emoji + seletor de 12 cores preset)
- Arquivar / reativar (soft delete via `is_active`)

**Cartões de Crédito** (`/cartoes`)
- Listagem em grid com badge de escopo e borda colorida
- Criar / editar: nome, bandeira, fechamento, vencimento, limite, 4 últimos dígitos, cor, scope
- Desativar / reativar

**Receitas e Despesas Fixas** (`/fixas`)
- Página única com abas (Receitas | Despesas)
- Campos: descrição, valor, dia do mês, categoria, data de início, notas, scope
- Despesas: forma de pagamento (conta/pix/débito ou cartão de crédito)
- Ativar / desativar

**API Routes (8 endpoints)**

| Rota | Métodos |
|---|---|
| `/api/categorias` | POST |
| `/api/categorias/[id]` | PATCH |
| `/api/cartoes` | POST |
| `/api/cartoes/[id]` | PATCH |
| `/api/receitas-fixas` | POST |
| `/api/receitas-fixas/[id]` | PATCH |
| `/api/despesas-fixas` | POST |
| `/api/despesas-fixas/[id]` | PATCH |

`family_id` e `user_id` extraídos da sessão autenticada — nunca expostos no formulário.

---

### Ajustes de UX pós-teste

**Modal refatorado**
- `max-h-[70vh]` — nunca extrapola a tela
- Header (título + fechar) fixo no topo
- Conteúdo (campos) scrollável (`overflow-y-auto`)
- Footer (botões + erro) fixo na base — sempre visível
- Prop `footer` separada; submit via atributo HTML `form="<id>"`
- Mensagem de erro movida para o footer

**Mobile — Navbar**
- Desktop (`sm:`): top navbar horizontal
- Mobile: bottom navigation bar fixo (`fixed bottom-0`) com ícone + label curto
- `pb-24 sm:pb-0` no `<main>` para não sobrepor bottom nav

**Mobile — Modal**
- Bottom sheet no mobile (`items-end sm:items-center`, `rounded-t-2xl sm:rounded-xl`)

**Mobile — FixaCard**
- Layout de 2 linhas: nome + valor na primeira; metadata + badge + ações na segunda

**Mobile — FixaList**
- Tabs `w-full sm:w-fit` com botões `flex-1 sm:flex-none`

**Padrões de UI/Mobile**
- Seção 2 criada em `docs/padroes.md` com 6 padrões formalizados

---

### Infraestrutura / Ambiente

- **Git configurado globalmente:** `Gabriel Brandão <gabriel.brandao@atus.cloud>`
- **13 commits reescritos** com email correto via `git filter-branch` + force push
- **`next.config.mjs`:** `devIndicators` habilitado (bolinha do Next no canto inferior direito)

---

## Decisões tomadas

| Decisão | Motivo |
|---|---|
| Categorias sem scope | São globais da família, conforme regras de negócio |
| Mutações via API Routes (não Server Actions) | Padrão já definido na arquitetura |
| `router.refresh()` após mutações | Re-fetch server-side sem reload de página |
| Modal como bottom sheet no mobile | Padrão nativo de apps financeiros; melhor UX em touch |
| Prop `footer` separada no Modal | Garante que botões e erro sejam sempre visíveis, independente do scroll |
| Botão submit com `form="<id>"` | Permite separar o botão do `<form>` sem quebrar o submit nativo |

---

## Problemas encontrados

| Problema | Causa | Resolução |
|---|---|---|
| Erros 404 de JS/CSS no dev server | Cache `.next` stale ao trocar de porta | `rm -rf .next && npm run dev -- --port 3001` |
| Timeout aparente na Vercel | Cookie de sessão expirado do primeiro login (Fase 1) | Limpar cookies do navegador. Não era bug de código. |
| Commits sem email do GitHub | Git não configurado globalmente | `git config --global` + `git filter-branch` para reescrever histórico |

---

## Arquivos criados / modificados

```
src/
├── components/
│   ├── Navbar.tsx                          ← novo + atualizado (mobile)
│   └── ui/
│       ├── Modal.tsx                       ← novo + refatorado
│       └── ScopeSelector.tsx               ← novo
├── app/
│   ├── (app)/
│   │   ├── layout.tsx                      ← pb-24 sm:pb-0
│   │   ├── categorias/
│   │   │   ├── page.tsx                    ← novo
│   │   │   └── _components/ (3 arquivos)   ← novos
│   │   ├── cartoes/
│   │   │   ├── page.tsx                    ← novo
│   │   │   └── _components/ (3 arquivos)   ← novos
│   │   └── fixas/
│   │       ├── page.tsx                    ← novo
│   │       └── _components/ (3 arquivos)   ← novos + atualizados
│   └── api/
│       ├── categorias/ (2 arquivos)        ← novos
│       ├── cartoes/ (2 arquivos)           ← novos
│       ├── receitas-fixas/ (2 arquivos)    ← novos
│       └── despesas-fixas/ (2 arquivos)    ← novos
next.config.mjs                             ← devIndicators
docs/padroes.md                             ← Seção 2: UI/Mobile
```

---

## Estado do banco ao final da sessão

Sem alterações no banco nesta sessão. Migrations aplicadas até o momento:
- 001–014: aplicadas
- 015: diferida (Fase 9)
- 016: aplicada
- 017 (Partes 1–4): aplicadas
- 017 (Parte 5): diferida (Fase 9, após migration 015)
- 018: diferida (Fase 10)

---

## Próxima sessão

**Fase 3 — Transações Manuais**

- Listagem de transações com filtros (mês, tipo, status, categoria, escopo)
- Criar transação de receita / despesa avulsa com seleção de escopo
- Marcar transação como `paid` (com data de pagamento opcional)
- Marcar transação como `cancelled`
- Editar transação lançada manualmente
- Toggle de visão: Pessoal | Familiar
