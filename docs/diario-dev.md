# Couple — Diário de Desenvolvimento

> Este documento é o registro vivo do projeto. Atualizado ao fim de cada sessão.
> Serve como ponto de partida para retomar o contexto sem depender da memória da sessão anterior.

---

## Estado Atual do Projeto

**Fase:** Fase 2 — CRUD Base
**Última sessão:** 2026-02-25
**Próxima ação:** Implementar CRUD de categorias, cartões, receitas fixas e despesas fixas

### O que está feito
- [x] Regras de negócio documentadas (`docs/regras-de-negocio.md`)
- [x] Roadmap criado com 7 fases e checklist rastreável (`docs/roadmap.md`)
- [x] Arquitetura e decisões técnicas documentadas (`docs/arquitetura.md`)
- [x] Schema completo do banco de dados com DDL e políticas RLS (`docs/banco-de-dados.md`)
- [x] Guia de setup do ambiente de desenvolvimento (`docs/setup.md`)
- [x] Projeto Next.js 14.2.35 criado e buildando sem erros
- [x] Dependências instaladas: @supabase/ssr, @supabase/supabase-js, @tremor/react, clsx, tailwind-merge
- [x] Tailwind CSS configurado (com path do Tremor no content)
- [x] 12 migrations SQL criadas (`supabase/migrations/001-012`)
- [x] Seed de categorias padrão (`supabase/seed.sql`)
- [x] Clientes Supabase: browser, server e service role
- [x] Tipos TypeScript do schema completo (`src/types/database.ts`)
- [x] Middleware de proteção de rotas com `getUser()` (seguro)
- [x] Página de login com formulário funcional
- [x] Layout protegido `(app)` com verificação server-side
- [x] Dashboard placeholder com aviso de `family_id` pendente
- [x] `vercel.json` com 3 cron schedules configurados
- [x] `.env.local` configurado com chaves do Supabase
- [x] Repositório GitHub criado: `gabrielbrandao-atus/couple`
- [x] Push inicial para o GitHub

### O que está pendente
- Todos os itens da Fase 2 em diante (ver roadmap)

### Referências do ambiente
- **Supabase project ref:** `djteloswmyjsqeplzkxy`
- **family_id:** `cbe6f412-d190-49de-a062-10cc17b9b77d`
- **User 1:** `f860afbb-a0eb-4683-b82a-022a9fbe2e51`
- **User 2:** `6665da54-7400-4fb0-94dd-1cbd1c4d182d`

### Bloqueios / Decisões pendentes
- 4 vulnerabilidades de segurança no Next.js 14 (DoS via Image Optimizer e RSC). Fix requer upgrade para Next.js 16 (breaking change). Risco baixo para app privado — avaliar upgrade em sessão futura.

---

## Papéis no Projeto

| Papel | Responsabilidade |
|---|---|
| **Gestor (usuário)** | Define prioridades, valida entregas, aprova decisões de produto |
| **Desenvolvedor (Claude)** | Propõe soluções técnicas, implementa, documenta, atualiza este diário |

---

## Log de Sessões

---

### Sessão 002 — 2026-02-25

**Objetivo:** Implementar Fase 1 — Setup do projeto

**O que foi feito:**
- Identificado projeto Supabase "Couple" já existente via Management API
- Criado repositório GitHub privado `gabrielbrandao-atus/couple`
- Setup manual do projeto Next.js 14.2.35 (create-next-app falhou por restrição de nome do diretório com letra maiúscula)
- Criadas todas as dependências, configurações e arquivos de source
- Corrigidas 3 issues identificadas pelo agente de planejamento:
  - FK de `family_id` removida (impossível com dois usuários por família)
  - Tipo explícito em `setAll()` dos clientes Supabase (erro TypeScript com strict mode)
  - Constraint `chk_credit_card_required` em `fixed_expenses`
- Build passando sem erros de compilação
- Push inicial para o GitHub

**Decisões tomadas:**
- Usando Next.js 14.2.35 (não 15+) para garantir compatibilidade com Tremor v3/React 18
- `next.config.mjs` em vez de `.ts` (suporte a `.ts` é apenas no Next.js 15+)
- `cookies()` em `server.ts` é síncrono no Next.js 14 — o `await` é no-op mas não causa erro

**Problemas encontrados:**
- `create-next-app` rejeita diretório com letra maiúscula ("Heidebriel") — resolvido criando arquivos manualmente
- `autoprefixer` não era dependência explícita — adicionado como devDependency
- Tipos do `setAll()` no `@supabase/ssr` precisavam de tipagem explícita com `strict: true`

**Próxima sessão:**
- Iniciar Fase 2: CRUD base (categorias, cartões, receitas e despesas fixas)

---

### Sessão 001 — 2026-02-25

**Objetivo:** Planejamento inicial e estruturação da documentação

**O que foi feito:**
- Leitura e análise do documento de regras de negócio (`RegrasNegocio.md`)
- Definição da estrutura de documentação do projeto
- Inclusão do conceito de "diário de desenvolvimento" para rastreabilidade entre sessões
- Definição de papéis: gestor (usuário) e desenvolvedor (Claude)
- Criação da pasta `/docs` com os seguintes arquivos:
  - `regras-de-negocio.md` — regras de negócio movidas da raiz
  - `roadmap.md` — roadmap em 7 fases com checklist rastreável
  - `arquitetura.md` — decisões técnicas, padrões e fluxo de dados
  - `banco-de-dados.md` — DDL completo, índices, políticas RLS, ordem de migrations
  - `setup.md` — guia de configuração do ambiente (Supabase, Vercel, variáveis de ambiente)
  - `diario-dev.md` — este arquivo

**Decisões tomadas:**
- Nenhuma decisão técnica nova — o documento de regras de negócio já estava bem definido e foi respeitado integralmente
- Estrutura de documentação aprovada pelo gestor antes da criação

**Observações:**
- O arquivo original `RegrasNegocio.md` na raiz pode ser removido pelo gestor após confirmação de que a versão em `docs/` está correta

**Próxima sessão:**
- Iniciar Fase 1: criar projeto Next.js 14+, configurar Tailwind, Tremor, Supabase e autenticação

---

<!-- Template para próximas sessões:

### Sessão NNN — YYYY-MM-DD

**Objetivo:**

**O que foi feito:**
-

**Decisões tomadas:**
-

**Problemas encontrados:**
-

**Próxima sessão:**
-

-->
