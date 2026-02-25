# Couple — Diário de Desenvolvimento

> Este documento é o registro vivo do projeto. Atualizado ao fim de cada sessão.
> Serve como ponto de partida para retomar o contexto sem depender da memória da sessão anterior.

---

## Estado Atual do Projeto

**Fase:** Fase 1.5 — Modelo de Escopo (finalização) + Módulo de Investimentos (schema)
**Última sessão:** 2026-02-25
**Próxima ação:** Rodar migration 017 Parte 1 (ENUM isolado) → Partes 2–5 (tabelas) no Supabase; após Fase 9, rodar migration 018; commit e push; iniciar Fase 2

### O que está feito
- [x] Regras de negócio documentadas com seções de Escopo, Projetos e Investimentos (`docs/regras-de-negocio.md`)
- [x] Roadmap atualizado para 11 fases + Fase 1.5 (`docs/roadmap.md`)
- [x] Arquitetura atualizada com Seção 7 (Escopo e Visibilidade) (`docs/arquitetura.md`)
- [x] Schema completo atualizado com todas as novas tabelas e colunas (`docs/banco-de-dados.md`)
- [x] Guia de setup do ambiente de desenvolvimento (`docs/setup.md`)
- [x] Projeto Next.js 14.2.35 criado e buildando sem erros
- [x] Dependências instaladas: @supabase/ssr, @supabase/supabase-js, @tremor/react, clsx, tailwind-merge
- [x] Tailwind CSS configurado (com path do Tremor no content)
- [x] 18 migrations SQL criadas (`supabase/migrations/001-018`)
- [x] Seed de categorias padrão (`supabase/seed.sql`)
- [x] Clientes Supabase: browser, server e service role
- [x] Middleware de proteção de rotas com `getUser()` (seguro)
- [x] Página de login com formulário funcional
- [x] Layout protegido `(app)` com verificação server-side
- [x] Dashboard placeholder com aviso de `family_id` pendente
- [x] `vercel.json` com 3 cron schedules configurados
- [x] `.env.local` configurado com chaves do Supabase
- [x] Repositório GitHub criado: `gabrielbrandao-atus/couple`
- [x] Migrations 001–012 aplicadas no Supabase
- [x] `src/types/database.ts` atualizado com tipos de investimento e campos de migration 017

### O que está pendente
- [x] Rodar migration 013 no Supabase (aplicada em sessão anterior)
- [x] Rodar migration 014 no Supabase (aplicada em sessão anterior)
- [x] Rodar migration 016 no Supabase (aplicada em sessão anterior)
- [ ] Migration 015 (projects) — aguardar Fase 9
- [x] Rodar migration 017 Parte 1 (ENUM: investment_deposit + investment_withdrawal) no Supabase
- [x] Rodar migration 017 Partes 2–4 (investments, investment_transactions, investment_snapshots) no Supabase
- [ ] Rodar migration 017 Parte 5 (ALTER TABLE project_items) — diferida para após migration 015 (Fase 9)
- [ ] Migration 018 (investment_id em transactions) — diferida para início da Fase 10
- [ ] Commit e push de todas as alterações desta sessão
- [ ] Iniciar Fase 2: CRUD base

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

### Sessão 004 — 2026-02-25

**Objetivo:** Design e implementação do schema do Módulo de Investimentos (migrations 017 + 018)

**O que foi feito:**
- Criada migration `017_create_investments.sql` com 5 partes:
  - Parte 1: extensão do ENUM `transaction_type` com `investment_deposit` e `investment_withdrawal` (deve ser executada isolada no Supabase)
  - Parte 2: tabela `investments` com scope, user_id NOT NULL, 10 tipos, aporte mensal, elegibilidade para projetos, RLS scoped_select/scoped_modify
  - Parte 3: tabela `investment_transactions` (aportes/resgates) com índice único de idempotência para cron
  - Parte 4: tabela `investment_snapshots` (saldo de mercado, append-only, sem updated_at)
  - Parte 5: colunas `investment_id` e `expected_payment_date` em `project_items`; constraint `payment_origin` expandida para incluir `'investment'`; constraint `chk_item_investment_required` adicionada
- Criada migration `018_add_investment_to_transactions.sql` (diferida para Fase 10):
  - Adiciona `investment_id` em `transactions`
  - Atualiza `scoped_select` de `transactions` para incluir visibilidade de investimentos elegíveis do parceiro
- Atualizado `src/types/database.ts`:
  - `TransactionType`: adicionados `investment_deposit` e `investment_withdrawal`
  - `PaymentOrigin`: adicionado `'investment'`
  - `Transaction`: adicionado `investment_id: string | null`
  - `ProjectItem`: adicionados `investment_id` e `expected_payment_date`
  - Novos tipos: `InvestmentType`, `InvestmentTransactionType`
  - Novas interfaces: `Investment`, `InvestmentTransaction`, `InvestmentSnapshot`
- Atualizada documentação:
  - `docs/regras-de-negocio.md`: Seção 12 completa (10 subseções)
  - `docs/banco-de-dados.md`: DDL das 3 novas tabelas + project_items atualizado + transactions atualizado + migrations 017/018 na ordem de execução
  - `docs/roadmap.md`: Fase 10 (Investimentos) e Fase 11 (Fluxo Futuro) adicionadas

**Decisões tomadas:**
- `user_id NOT NULL` em `investments` — desvio intencional do padrão de outras entidades; necessário pois o user_id define o dono do aporte automático gerado pelo cron
- Migration 018 diferida para Fase 10: migration 017 já está completa e segura para rodar isoladamente
- Idempotência de aportes automáticos via `UNIQUE INDEX` em `(investment_id, date_trunc('month', date)) WHERE auto_generated = true` — não usa a função `year_month_key` (já usada em transactions) pois `date_trunc` é nativamente IMMUTABLE no PostgreSQL para timezone fixo
- `investment_snapshots` sem `updated_at` — cada snapshot é imutável por design
- RLS de `investment_transactions` e `investment_snapshots` herda visibilidade do investimento pai via subquery (mesmo padrão de project_groups/project_items)

**Problemas encontrados:**
- `date_trunc('month', date)` não é IMMUTABLE no PostgreSQL — índice rejeitado. Corrigido para `year_month_key(date)` (função IMMUTABLE já existente no projeto). Migration 017 Parte 3 corrigida no arquivo.
- Migration 017 Parte 5 (ALTER TABLE project_items) não pôde ser executada pois migration 015 ainda não foi aplicada — diferida para Fase 9.

**Próxima sessão:**
- Rodar migration 017 no Supabase (Parte 1 isolada, depois Partes 2–5)
- Rodar migrations 013, 014, 016 no Supabase
- Commit e push de todas as alterações
- Iniciar Fase 2: CRUD base

---

### Sessão 003 — 2026-02-25

**Objetivo:** Design e documentação do modelo de Escopo Pessoal/Familiar e do Módulo de Projetos antes de iniciar a Fase 2

**O que foi feito:**
- Analisado o modelo atual (tudo compartilhado via `family_id`) e identificada a necessidade de suporte a dados pessoais
- Projetado modelo `scope` + `user_id` + `is_shared` para entidades financeiras
- Definido conceito de Caixa Familiar com contribuições mensais configuráveis por usuário
- Projetado Módulo de Projetos com grupos, itens e três tipos de pagamento (cash, card_installment, deposit_remainder)
- Definido conceito de `payment_origin` (Parceiro 1 / Parceiro 2 / Caixa Familiar) que determina o `scope` da transação gerada
- Criadas migrations 013, 014, 015, 016
- Atualizada documentação completa: regras-de-negocio.md, banco-de-dados.md, roadmap.md, arquitetura.md, diario-dev.md
- Atualizado `src/types/database.ts` com novos campos e interfaces

**Decisões tomadas:**
- Categorias permanecem globais da família (sem escopo pessoal)
- Visibilidade de transações pessoais é herdada da entidade-pai (não armazenada na transação)
- Saldo do Caixa Familiar é calculado dinamicamente, não armazenado
- O `remainder` do item (Sinal + Restante) é calculado: `actual_amount - deposit_amount`; não armazenado
- Migration 015 (projetos) será executada apenas na Fase 9
- Roadmap reestruturado de 7 para 9 fases + Fase 1.5

**Problemas encontrados:**
- Nenhum problema técnico nesta sessão (sessão de planejamento e documentação)

**Próxima sessão:**
- Rodar migrations 013/014/016 no Supabase via Management API
- Commit e push de todas as alterações
- Iniciar Fase 2: CRUD base (categorias, cartões, receitas e despesas fixas com suporte a escopo)

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
