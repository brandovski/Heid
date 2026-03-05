# Heid — Roadmap de Desenvolvimento

> Legenda de status: `[ ]` Não iniciado · `[~]` Em progresso · `[x]` Concluído · `[-]` Bloqueado

---

## Fase 1 — Setup Inicial

**Objetivo:** projeto rodando localmente com banco configurado e autenticação funcionando.

- [x] Criar projeto Next.js 14+ com TypeScript e App Router
- [x] Configurar Tailwind CSS
- [x] Instalar e configurar Tremor
- [x] Criar projeto no Supabase
- [x] Escrever e aplicar migrations iniciais (001–012)
- [x] Configurar RLS em todas as tabelas
- [x] Rodar seed com categorias padrão
- [x] Cadastrar os dois usuários manualmente no Supabase Auth
- [x] Desabilitar cadastro público no Supabase Auth
- [x] Implementar página de login com Supabase Auth
- [x] Implementar middleware de proteção de rotas (redirect para login)
- [x] Configurar variáveis de ambiente (`.env.local`)
- [x] Deploy inicial na Vercel (apenas para validar pipeline)

**Critério de conclusão:** login funciona, sessão é mantida, rotas protegidas redirecionam corretamente. ✅ **Concluído em 2026-02-25**

---

## Fase 1.5 — Modelo de Escopo (pré-Fase 2)

**Objetivo:** preparar o banco para suportar visão pessoal/familiar antes de construir CRUDs.

- [x] Definir modelo `scope` (`personal` | `family`) + `user_id` + `is_shared`
- [x] Migration 013: adicionar colunas de escopo a todas as entidades financeiras
- [x] Migration 014: criar `family_contributions` para o Caixa Familiar
- [x] Migration 015: criar `projects`, `project_groups`, `project_items`
- [x] Migration 016: substituir políticas `family_access` por `scoped_select`/`scoped_modify`
- [x] Rodar migrations 013, 014, 016 no Supabase (migration 015 aguarda Fase 9)
- [x] Atualizar `src/types/database.ts` com novos campos e interfaces

**Critério de conclusão:** banco suporta dados pessoais e familiares com RLS correto. ✅ **Concluído em 2026-02-25**

---

## Fase 2 — CRUD Base

**Objetivo:** usuário consegue cadastrar e gerenciar as entidades fundamentais do sistema.

### Categorias
- [x] Listagem de categorias
- [x] Criar categoria (nome, ícone, cor)
- [x] Editar categoria
- [x] Arquivar categoria (soft delete — não permitir exclusão com vínculos)

### Cartões de Crédito
- [x] Listagem de cartões (pessoais e da família)
- [x] Criar cartão com seleção de escopo e opção de compartilhamento
- [x] Editar cartão
- [x] Desativar cartão (is_active = false)

### Receitas Fixas
- [x] Listagem de receitas fixas (pessoais e da família)
- [x] Criar receita fixa com escopo e opção de compartilhamento
- [x] Editar receita fixa
- [x] Ativar / desativar receita fixa

### Despesas Fixas
- [x] Listagem de despesas fixas (pessoais e da família)
- [x] Criar despesa fixa com escopo, compartilhamento e vínculo opcional a cartão
- [x] Editar despesa fixa
- [x] Ativar / desativar despesa fixa

**Critério de conclusão:** todas as entidades base podem ser criadas com escopo correto, editadas e desativadas sem erros. ✅ **Concluído em 2026-02-25**

---

## Fase 3 — Transações Manuais

**Objetivo:** usuário consegue lançar, visualizar e gerenciar transações avulsas.

- [x] Listagem de transações com filtros (mês, tipo, status, categoria, escopo)
- [x] Criar transação de receita avulsa (`income`) com seleção de escopo
- [x] Criar transação de despesa avulsa (`expense`) com seleção de escopo
- [x] Marcar transação como `paid` (com data de pagamento opcional)
- [x] Marcar transação como `cancelled`
- [x] Editar transação lançada manualmente
- [x] Excluir transação (somente manuais; automáticas apenas cancelam)
- [x] Distinção visual de status (`pending` / `paid` / `cancelled`) com badges
- [x] Toggle de visão: Pessoal | Familiar

**Critério de conclusão:** fluxo completo de lançamento e gestão de status funciona para transações manuais com escopo. ✅ **Concluído em 2026-02-25**

---

## Fase 4 — Parcelamentos e Assinaturas

**Objetivo:** usuário consegue cadastrar compras parceladas e assinaturas recorrentes.

### Parcelamentos
- [x] Cadastrar compra parcelada (total, nº parcelas, data da primeira parcela, cartão, categoria, escopo)
- [x] Geração automática das N transações do tipo `installment` ao cadastrar
- [x] Listagem de grupos de parcelamento com status das parcelas
- [x] Cancelar parcelas restantes de um grupo

### Assinaturas
- [x] Listagem de assinaturas ativas
- [x] Cadastrar assinatura (nome, moeda, valor, dia de cobrança, cartão, categoria, escopo)
- [x] Editar assinatura
- [x] Cancelar assinatura (`cancelled_at = now()`, `is_active = false`)
- [x] Integração com AwesomeAPI para cotação USD→BRL
- [x] Lógica de fallback quando a API de câmbio estiver indisponível

**Critério de conclusão:** parcelamentos geram transações corretamente; assinaturas em USD convertem com cotação real. ✅ **Concluído em 2026-02-25**

---

## Fase 5 — Cron Jobs

**Objetivo:** automações mensais funcionam de forma confiável e idempotente.

- [x] Implementar cron `fetch-exchange-rate` (dia 1, 05:30)
- [x] Implementar cron `generate-monthly` (dia 1, 06:00) — respeita `scope` e `user_id`
- [x] Garantir idempotência (verificar existência antes de inserir)
- [x] Implementar cron `supabase-keepalive` (a cada 3 dias)
- [x] Configurar `vercel.json` com os schedules dos crons
- [x] Testar geração manual via chamada direta ao endpoint

**Critério de conclusão:** ao acionar manualmente o cron, transações do mês são geradas corretamente e sem duplicatas. ✅ **Concluído em 2026-02-26**

---

## Fase 6 — Orçamento Mensal

**Objetivo:** usuário consegue definir e acompanhar o orçamento por categoria.

- [x] Listagem do orçamento do mês com barra de progresso (`<ProgressBar />` próprio)
- [x] Orçamento pessoal e familiar separados (toggle) — **toggle removido na Sessão 013; orçamento é agora sempre pessoal**
- [x] Detectar ausência de orçamento no mês e exibir modal de criação
- [x] Opção "Clonar do mês anterior"
- [x] Adicionar / editar / remover categoria do orçamento
- [x] Cálculo: gasto realizado vs. comprometido vs. planejado
- [x] Destaque visual para categorias acima do limite
- [x] Navegação entre meses

**Critério de conclusão:** orçamento pessoal e familiar criados e acompanhados com barras de progresso corretas. ✅ **Concluído em 2026-02-26**

---

## Fase 7 — Visão Familiar / Caixa Familiar

**Objetivo:** tela dedicada à gestão financeira conjunta do casal.

- [x] Tela `/familia` com navegação por mês
- [x] Registro de aportes reais ao Caixa Familiar (cria despesa pessoal vinculada via `transaction_id`)
- [x] Exibição do Caixa Familiar: total aportado por membro no mês + contagem de aportes
- [x] Totais: total aportado, gastos familiares, saldo livre
- [x] Visão de transações familiares do mês (scope = 'family')
- [x] Migration 020: renomeia `effective_from→date`, adiciona FK `transaction_id`, remove unique constraint

**Critério de conclusão:** Caixa Familiar reflete movimentos financeiros reais; saldo calculado dinamicamente. ✅ **Concluído em 2026-02-26**

---

## Fase 8 — Dashboard

**Objetivo:** tela principal consolidada com visão financeira completa do mês.

- [x] Cards de resumo: Receitas, Despesas, Saldo realizado, A receber, A pagar
- [x] Toggle Pessoal | Familiar nos cards de resumo
- [x] Gráfico de evolução dos últimos 6 meses (`<AreaChart />`)
- [x] Gráfico de distribuição por categoria (`<DonutChart />`)
- [x] Seção de orçamento por categoria com `<ProgressBar />`
- [x] Cards de faturas por cartão com status e botão de pagamento
- [x] Modal de registro de pagamento de fatura
- [x] Tabela de próximos lançamentos (próximos 7–10 `pending`)
- [x] Navegação entre meses no dashboard
- [x] Loading states e tratamento de erros em todos os componentes

**Melhorias pós-fase (Sessão 012):**
- [x] Redesign `CartaoCard` — layout tipo cartão de crédito real (`aspect-[8/5]`, cor dinâmica, chip EMV, número mascarado)
- [x] `FaturaDetalheModal` — modal de detalhe da fatura com navegação de mês, lista de transações e botão "Pagar Fatura"
- [x] `PagarFaturaModal` — componente compartilhado com UX total/parcial + DatePicker + observações (usado por Dashboard, Cartões e Transações)
- [x] `POST /api/faturas` — ao pagar fatura faz bulk-update `status = 'paid'` em todas as transactions do cartão no mês
- [x] `FaturaGrupoCard` em `/transacoes` — agrupa transações de cartão por fatura no topo da lista; expansível; badge Pendente/Pago; botão "Pagar Fatura"

**Critério de conclusão:** dashboard exibe todos os dados corretamente para o mês corrente e meses anteriores. ✅ **Concluído em 2026-02-26**

---

## Fase 9 — Projetos

**Objetivo:** módulo de planejamento de compras/projetos com orçamento e rastreamento de pagamentos.

- [x] Listar projetos (pessoais e familiares) com status e progresso de orçamento
- [x] Criar projeto (nome, descrição, budget total, data alvo, escopo)
- [x] Editar projeto / marcar como concluído ou cancelado
- [x] Criar grupos dentro de um projeto
- [x] Criar itens dentro de um grupo com tipo de pagamento:
  - `cash`: origem (Pessoal / Caixa Familiar) + método (débito/pix/dinheiro/transferência)
  - `card_installment`: cartão + nº de parcelas
  - `deposit_remainder`: valor do sinal + data do restante
- [x] Confirmar item (status → `confirmed`) com definição do valor real
- [x] Gerar transação(ões) ao confirmar pagamento (status → `paid`)
- [x] Painel de resumo do projeto:
  - Total orçado vs. total real
  - Quanto foi pago vs. pendente
  - Estimativa de sobra/estouro do budget
- [x] Sugestão de conclusão quando todos os itens estão pagos
- [x] Projetos na navbar (desktop e mobile — substitui Cartões no mobile)

**Critério de conclusão:** projeto completo funciona do planejamento ao pagamento, com transações geradas corretamente. ✅ **Concluído em 2026-02-27**

---

## Fase 10 — Investimentos

**Objetivo:** usuário consegue criar, acompanhar e projetar investimentos, com integração ao módulo de projetos.

### Schema (migrations)
- [x] Migration 017: tabelas `investments`, `investment_transactions`, `investment_snapshots`; alterações em `project_items` (migration 017 — criada em 2026-02-25)
- [x] Migration 018: adicionar `investment_id` em `transactions`; atualizar `scoped_select` — aplicada em Sessão 018

### CRUD de Investimentos
- [x] Listar investimentos (pessoais e familiares) com saldo atual e rentabilidade
- [x] Criar investimento (tipo, escopo, meta, aporte mensal, elegibilidade para projetos)
- [x] Editar investimento
- [x] Arquivar investimento (`is_active = false`)

### Aportes e Resgates
- [x] Registrar aporte manual (`investment_transaction` tipo `deposit`)
- [x] Registrar resgate manual (`investment_transaction` tipo `withdrawal`)
- [x] Visualizar histórico de aportes/resgates com totais

### Snapshots de Saldo
- [x] Registrar saldo de mercado atual (cria novo snapshot)
- [x] Exibir histórico de snapshots com gráfico de evolução

### Cálculos e Projeções
- [x] Exibir: total aportado, rentabilidade R$, rentabilidade %
- [x] Projeção conservadora (sem retorno)
- [x] Projeção com retorno (baseada no último retorno mensal)

### Integração com Projetos
- [x] Exibir investimentos elegíveis como opção de pagamento em itens de projeto
- [x] Exibir total comprometido com projetos confirmados na tela do investimento

### Automação (extensão do cron `generate-monthly`)
- [x] Gerar aporte automático mensal para investimentos com `monthly_contribution_amount`
- [x] Garantir idempotência via índice único `idx_inv_tx_auto_month`

**Critério de conclusão:** usuário consegue acompanhar todos os investimentos com saldo atualizado, projeção de crescimento e integração com projetos. ✅ **Concluído em 2026-02-27**

---

## Fase 11 — Fluxo Futuro / Calendário Financeiro

**Objetivo:** visualização temporal de todos os compromissos financeiros futuros — transações, aportes, vencimentos de projetos.

- [x] Tela de calendário / linha do tempo mensal
- [x] Exibir lançamentos pendentes (`status = pending`) ordenados por data
- [x] Exibir aportes mensais de investimentos previstos
- [x] Exibir `expected_payment_date` de itens de projeto confirmados
- [x] Indicação visual de saldo projetado dia a dia
- [x] Filtro por escopo (Pessoal / Familiar / Tudo)

**Melhorias pós-fase (Sessões 021–024):**
- [x] FluxoWidget no Dashboard (4 próximas movimentações + link /fluxo)
- [x] FluxoProjecao em Investimentos substituída por ProjecaoView (timeline + calendário unificados)
- [x] ProjecaoView: eventos `deposit_remainder` divididos em entrada + restante (Sessão 023)
- [x] `/fluxo` expandido para 9 queries (fixed_incomes, fixed_expenses, credit_cards, partner profile)
- [x] FluxoView v2: agrupamento de fatura por cartão, projeção de fixas não-geradas, escopo parceiro com nomes reais
- [x] Navbar mobile redesenhada: header fixo com título + perfil dropdown multi-nível; FAB para quick-add transação; bottom nav glassmorphism (Sessão 024)

**Critério de conclusão:** usuário consegue ver todos os compromissos financeiros do mês em uma única tela com saldo projetado. ✅ **Concluído em 2026-02-28**

---

## Melhorias pós-Fase 11 (Sessões 028–030c)

**Objetivo:** melhorias incrementais de qualidade, UX e estrutura aplicadas após a conclusão das 11 fases principais.

### Categorias de sistema (Sessão 028)
- [x] Migration 023: coluna `is_system` em `categories` + 3 categorias internas (Projeto, Caixa Familiar, Investimento)
- [x] Helper `getSystemCategoryId()` — usado automaticamente nas APIs de pagamento
- [x] `GET /api/categorias` filtra categorias de sistema; `PATCH` protege contra edição
- [x] Projetos: campo `category_id` removido de itens; `ItemModal` simplificado
- [x] Hard delete de itens de projeto cancelados (`?permanent=true`) com botão `Trash2`

### Aportes mensais com confirmação manual (Sessão 029)
- [x] Migration 024: `partner_contribution_amount/day` em `investments` + `contributor_user_id` em `investment_transactions`
- [x] `src/lib/investment-utils.ts`: `computeAporteCards()` para calcular pendências do mês
- [x] `ConfirmarAporteModal` — toggle integral/outro valor, DatePicker, notes
- [x] `InvestimentoModal` com card expansível "Aporte Mensal" (personal e family)
- [x] Cron `generate-monthly` não gera mais aportes automáticos — confirmação é manual
- [x] Dashboard: widget "Aportes do Mês" com status e botão "Confirmar"
- [x] `InvestimentoList`: banner âmbar de pendências com botão "Confirmar"

### Formulário de parcelamento inteligente (Sessão 030)
- [x] `ScopeSelector` removido do `ParcelamentoModal` (scope hardcoded como personal)
- [x] Campo "Data da 1ª parcela" renomeado para "Data da compra"
- [x] `rawPaidCycles()` + detecção automática de parcelas pagas via `closing_day` do cartão
- [x] Banner com 3 estados: neutro / âmbar (parcialmente pago) / verde (compra quitada)
- [x] `route.ts` aceita `paid_installments` com geração de transações `paid` retroativas

### ConfirmModal + header desktop fixo (Sessão 030c)
- [x] `src/components/ui/ConfirmModal.tsx`: wrapper sobre `Modal.tsx` com variants `danger`/`warning`, loading state, spinner
- [x] 7 `confirm()` nativos substituídos por `ConfirmModal` em toda a aplicação
- [x] Header desktop fixo com `backdrop-blur-xl` (parity com mobile)
- [x] `layout.tsx`: `sm:mt-16` para compensar o nav desktop fixo

**Critério de conclusão:** zero `confirm()` nativos, aportes confirmados manualmente, formulário de parcelamento com detecção automática de parcelas pagas, navbar desktop fixa. ✅ **Concluído em 2026-03-02**

---

## Hardening de Segurança e Qualidade (Sessão 031)

**Objetivo:** resolver vulnerabilidades identificadas em revisão abrangente do projeto.

### Segurança de API
- [x] CRON_SECRET fail-closed: `if (cronSecret && ...)` → `if (!cronSecret || ...)` em 3 endpoints de cron
- [x] `contributor_user_id` removido do body do `POST /api/investimentos/[id]/transacoes` — sempre usa `user.id` autenticado
- [x] `family_id` adicionado a todas as queries UPDATE/DELETE em 8 routes de `[id]` (defesa em profundidade além do RLS)
- [x] `.single()` error handling padronizado em ~17 arquivos — `profileError`/`itemError`/`subError`/`txError` verificados

### Migration 025 — Categorias de sistema automáticas
- [x] Trigger `trg_system_categories_on_new_profile` cria automaticamente as 3 categorias de sistema por família
- [x] Corrige bug da migration 023 que hardcodava `family_id` da família de desenvolvimento
- [x] Backfill executado para família existente via `insert_system_categories_for_family()`

### Qualidade e UX
- [x] `loading.tsx` criado em 5 segments (`dashboard`, `transacoes`, `investimentos`, `orcamento`, `familia`) com skeletons `animate-pulse`
- [x] `src/app/(app)/error.tsx` — Error Boundary global (client component) com brand styling e botão reset

**Critério de conclusão:** zero vulnerabilidades críticas nas API routes; loading states e error boundary em todos os segmentos principais. ✅ **Concluído em 2026-03-02**

---

## Melhorias pós-Fase 11 — Sessões 032–036

### Migrations retrospectivas (Sessão 032)
- [x] `supabase/migrations/024_partner_contribution.sql` criado retroativamente para rastreabilidade (schema já aplicado)

### Fix: investment_deposit_id (Sessão 035)
- [x] Migration 031: `investment_deposit_id UUID REFERENCES investment_transactions(id)` em `project_items` — corrige bug de FK incorreta com `deposit_transaction_id`
- [x] Migration 032: coluna `paid_at DATE` em `project_items` para data real de pagamento
- [x] `pagar/route.ts` usa `investment_deposit_id` como guard de two-step e salva via UPDATE

### Fix: resgate → transação pessoal (Sessão 036)
- [x] `transacoes/route.ts`: withdrawal usa `scope="personal"` e `user_id=user.id` (autenticado) — não mais o dono do investimento
- [x] `contributor_user_id` setado em aportes **e** resgates (antes só em aportes)

### Tags nos resgates (Sessão 036)
- [x] Migration 033: `project_item_id UUID REFERENCES project_items(id)` em `investment_transactions`
- [x] Backfill de 5 transações existentes via `investment_deposit_id` e padrão de notes
- [x] `pagar/route.ts`: `project_item_id` setado nos 3 tipos de insert (sinal, restante, único)
- [x] `InvestimentoDetalhe`: badge de contribuinte em aportes e resgates + badge roxo "Projeto · Nome"

### Assinaturas sempre pessoais (Sessão 036)
- [x] Migration 034: 3 assinaturas `family` migradas para `personal` (Netflix, Google One, Live Academia → User 2)
- [x] `AssinaturaModal`: `ScopeSelector` removido; scope hardcoded na UI e nas APIs
- [x] `AssinaturaCard`: badge de escopo removido

**Critério de conclusão:** resgates contabilizados corretamente no extrato pessoal; movimentações rastreáveis por contribuinte e por projeto; assinaturas sempre pessoais. ✅ **Concluído em 2026-03-05**

---

## Backlog (pós v1.0)

- Relatórios e exportação (PDF / CSV)
- Filtros avançados na listagem de transações
- Notificações (e-mail / push) para vencimentos próximos
- Modo escuro
- App mobile (PWA ou React Native)
- Importação de extrato bancário (OFX / CSV)
- Múltiplas moedas além de USD

---

*Atualizado em: 2026-03-05 (sessão 036)*
