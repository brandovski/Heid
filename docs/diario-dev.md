# Couple — Diário de Desenvolvimento

> Este documento é o registro vivo do projeto. Atualizado ao fim de cada sessão.
> Serve como ponto de partida para retomar o contexto sem depender da memória da sessão anterior.
>
> Antes de criar ou alterar migrations, consultar também: `docs/padroes.md`

---

## Estado Atual do Projeto

**Fase:** Reestruturação de Escopo Pessoal/Familiar (pré-Fase 9)
**Última sessão:** 2026-02-26
**Próxima ação:** Iniciar Fase 9 — Projetos (requer rodar migration 015 antes)

### O que está feito
- [x] Fase 8 — Dashboard completo + melhorias pós-fase: redesign de CartaoCard, FaturaDetalheModal, PagarFaturaModal compartilhado, FaturaGrupoCard em /transacoes
- [x] Regras de negócio documentadas com seções de Escopo, Projetos e Investimentos (`docs/regras-de-negocio.md`)
- [x] Roadmap atualizado para 11 fases + Fase 1.5 (`docs/roadmap.md`)
- [x] Arquitetura atualizada com Seção 7 (Escopo e Visibilidade) (`docs/arquitetura.md`)
- [x] Schema completo atualizado com todas as novas tabelas e colunas (`docs/banco-de-dados.md`)
- [x] Guia de setup do ambiente de desenvolvimento (`docs/setup.md`)
- [x] Projeto Next.js 14.2.35 criado e buildando sem erros
- [x] Dependências instaladas: @supabase/ssr, @supabase/supabase-js, @tremor/react, clsx, tailwind-merge
- [x] Tailwind CSS configurado (com path do Tremor no content)
- [x] 20 migrations SQL criadas (`supabase/migrations/001-020`)
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
- [x] Fase 3 — CRUD de Transações Manuais (`/transacoes`, filtros, modal, badges de status)
- [x] `react-day-picker` instalado — `DatePicker` reutilizável com bottom sheet mobile e popover desktop
- [x] Fase 4 — Parcelamentos e Assinaturas concluída
- [x] Fase 5 — Cron Jobs validados (middleware fix + idempotência por pré-filtro)
- [x] Fase 6 — Orçamento Mensal com ProgressBar, toggle escopo, clonar mês anterior
- [x] Fase 7 — Visão Familiar / Caixa Familiar (`/familia`, toggle Familiar/Pessoal, contribuições, saldo)

### O que está pendente
- [x] Rodar migration 013 no Supabase (aplicada em sessão anterior)
- [x] Rodar migration 014 no Supabase (aplicada em sessão anterior)
- [x] Rodar migration 016 no Supabase (aplicada em sessão anterior)
- [ ] Migration 015 (projects) — aguardar Fase 9
- [x] Rodar migration 017 Parte 1 (ENUM: investment_deposit + investment_withdrawal) no Supabase
- [x] Rodar migration 017 Partes 2–4 (investments, investment_transactions, investment_snapshots) no Supabase
- [ ] Rodar migration 017 Parte 5 (ALTER TABLE project_items) — diferida para após migration 015 (Fase 9)
- [ ] Migration 018 (investment_id em transactions) — diferida para início da Fase 10
- [x] Commit e push de todas as alterações desta sessão
- [x] Fase 2 — CRUD base concluída
- [x] Fase 3 — Transações Manuais concluída
- [x] Fase 4 — Parcelamentos e Assinaturas concluída
- [x] Implementar e validar Fase 5: Cron Jobs ✅
- [x] Implementar Fase 6: Orçamento Mensal ✅
- [x] Implementar Fase 7: Visão Familiar / Caixa Familiar ✅

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

### Sessão 013 — 2026-02-26

**Objetivo:** Reestruturação de Escopo Pessoal/Familiar — separação clara entre /transacoes (pessoal), /familia (familiar) e /orcamento (sempre pessoal)

**O que foi feito:**

*Banco (via Management API):*
- `UPDATE profiles SET full_name = 'Gabriel'` e `SET full_name = 'Heide'`
- `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS share_with_partner BOOLEAN NOT NULL DEFAULT false`
- `Transaction.is_shared` adicionado ao tipo em `src/types/database.ts`

*D — /orcamento (mais simples):*
- `page.tsx` — removido `escopo` de `searchParams`; sempre usa `scope='personal'` e `user_id` do usuário logado
- `OrcamentoList.tsx` — removido toggle Familiar/Pessoal; título "Orçamento Pessoal"; navegação sem `escopo` na URL
- `OrcamentoModal.tsx` — removido prop `escopo`; `scope: 'personal'` hardcoded

*C — /dashboard:*
- `types.ts` — `EscopoType` agora é `"personal" | "parceiro"` (antes `"family"`)
- `page.tsx` — busca `partnerName` dos profiles; default escopo = `"personal"`; query `"parceiro"` busca `.eq('is_shared', true).neq('user_id', user.id)`; orçamento sempre pessoal do usuário logado; links `/orcamento` sem param `escopo`
- `DashboardView.tsx` — toggle renomeado para nome do usuário / nome do parceiro (nomes reais); prop `partnerName` adicionada

*B — /transacoes:*
- `page.tsx` — adiciona `.eq('scope', 'personal')` na query; busca `partnerName` e `share_with_partner` dos profiles
- `TransacaoList.tsx` — remove aba "Tudo" e "Familiar"; adiciona tabs "Meu" e `partnerName`; toggle "Compartilhar com [Parceiro]" (PATCH `/api/profile/sharing`); grupos de fatura só na aba pessoal
- `TransacaoCard.tsx` — `onEdit` e `onPagar` tornados opcionais (exibição read-only na aba do parceiro)
- `TransacaoModal.tsx` — removido `ScopeSelector`; `scope: 'personal'` hardcoded; **parcelamento adicionado**: toggle À vista/Parcelado quando despesa + cartão; se parcelado → POST `/api/parcelamentos`
- `api/transacoes/route.ts` — lê `share_with_partner` do perfil e define `is_shared` automaticamente; `user_id` sempre preenchido para scope personal
- `api/profile/sharing/route.ts` ← **novo** — PATCH `share_with_partner` no perfil do usuário

*A — /familia:*
- `page.tsx` — adiciona queries de `categories` e `credit_cards` ao `Promise.all`; passa `categorias` e `cartoes` para `FamiliaView`
- `types.ts` — `FamilyTransaction` expandida com `auto_generated`, `category_id`, `credit_card_id`
- `FamiliaView.tsx` — botão "Nova Transação"; ações por card (editar/pagar/cancelar/excluir); modal de pagar inline (`PagarFamiliaModal`); render `TransacaoFamiliarModal`
- `TransacaoFamiliarModal.tsx` ← **novo** — modal completo: tipo Despesa/Receita, campos padrão, forma de pagamento, cartão, parcelamento (mesmo padrão do TransacaoModal), scope hardcoded `'family'`

**Decisões tomadas:**
- `is_shared` para transações pessoais é definido automaticamente no servidor com base em `profile.share_with_partner` (não enviado pelo cliente)
- Dashboard "Parceiro" filtra `is_shared = true AND user_id != meu_id` (transações pessoais compartilhadas do parceiro)
- Toggle de compartilhamento é persistente (salvo no banco), não por transação
- Transações de fatura de cartão exibidas apenas na aba "Meu" (são sempre do usuário logado)
- `PagarFamiliaModal` embutido no `FamiliaView` (não em arquivo separado) por ser simples e evitar arquivos extras
- EscopoType do dashboard mudou de `"family"` para `"parceiro"` — `searchParams.escopo` atualizado correspondentemente

**Problemas encontrados:**
- `Transaction` em `database.ts` não tinha `is_shared` → adicionado o campo ao interface
- Build passando sem erros após correção

**Próxima sessão:**
- Iniciar Fase 9: Projetos (rodar migration 015 no Supabase antes de iniciar)

---

### Sessão 012 — 2026-02-26

**Objetivo:** Melhorias pós-Fase 8 — redesign de cartões, modal de fatura unificado e agrupamento de transações por cartão em /transacoes

**O que foi feito:**

*API Route (1 arquivo modificado):*
- `POST /api/faturas` — agora aceita `paid_at` (data do pagamento; fallback = hoje); após inserir em `invoice_payments`, executa bulk-update `status = 'paid'` em todas as transactions do cartão no mês (`gte/lte date`, `neq status cancelled`)

*Componente compartilhado (1 arquivo criado):*
- `src/components/ui/PagarFaturaModal.tsx` — modal reutilizado por 3 telas (Dashboard, Cartões, Transações); UX: radio "Valor total" (read-only com o montante) vs "Valor parcial" (input numérico); DatePicker com padrão "hoje" e seleção livre; campo de observações opcional

*Cartões (`/cartoes`):*
- `CartaoCard.tsx` — redesenho completo: layout `aspect-[8/5]` estilo cartão de crédito real; cor de fundo dinâmica (`cartao.color`), gradiente overlay, chip EMV decorativo, número mascarado, nome do titular e datas de fechamento/vencimento; badge de scope/compartilhamento; botões "Ver Fatura" + editar + ativar/desativar abaixo do cartão
- `FaturaDetalheModal.tsx` — formulário inline removido; botão "Pagar Fatura" abre `PagarFaturaModal`; status pago exibe banner verde com data e valor
- `CartaoList.tsx` — gerencia estado `viewingFatura` e renderiza `FaturaDetalheModal`

*Dashboard:*
- `FaturaModal.tsx` — reescrito como wrapper fino de `PagarFaturaModal` (sem duplicação de lógica)

*Transações (`/transacoes`):*
- `page.tsx` — adicionado `invoice_payments` do mês e `credit_cards` com `color` ao `Promise.all`; nova prop `invoicePayments` passada para `TransacaoList`
- `types.ts` — adicionados `InvoicePaymentSimple` e `FaturaGrupo`
- `FaturaGrupoCard.tsx` (novo) — card expansível: dot colorido + nome do cartão + bandeira + total + badge Pendente/Pago + chevron; expandido: lista compacta de transações read-only; rodapé com contagem e botão "Pagar Fatura" (unpaid) ou banner verde com data/valor (paid); usa `PagarFaturaModal`
- `TransacaoList.tsx` — separa transações com `credit_card_id` (→ grupos) das demais (→ lista flat); grupos renderizados fixos acima da lista flat com label "Faturas de cartão"; filtros aplicados apenas à lista flat; empty state cobre ausência de grupos e flat

**Decisões tomadas:**
- Transações de cartão removidas da lista flat — aparecem apenas dentro dos grupos (organização visual)
- Totais (Receitas/Despesas/Saldo) calculados só sobre transações fora de cartão; grupos exibem seus próprios totais no topo
- Pagamento de fatura via qualquer tela (Dashboard, Cartões, Transações) é consistente: o bulk-update da API garante que todas as telas refletem o status correto após `router.refresh()`
- `PagarFaturaModal` é o único lugar de lógica de pagamento — evita triplicação de código

**Problemas encontrados:**
- `FaturaDetalheModal` retornava dois elementos JSX irmãos (Modal + PagarFaturaModal) sem wrapper — corrigido com Fragment `<>...</>`

**Próxima sessão:**
- Iniciar Fase 9: Projetos (rodar migration 015 no Supabase antes de iniciar)

---

### Sessão 011 — 2026-02-26

**Objetivo:** Implementar Fase 8 — Dashboard

**O que foi feito:**

*API Route (1 arquivo):*
- `POST /api/faturas` — insere em `invoice_payments`; retorna 409 se `UNIQUE(credit_card_id, reference_month)` já existir

*Server Component (`/dashboard/page.tsx`):*
- `?mes=YYYY-MM` (padrão = mês corrente) + `?escopo=family|personal` (padrão = family)
- `Promise.all` com 6 queries paralelas: transações do mês, transações históricas (6 meses), orçamentos, cartões, pagamentos de fatura, próximos lançamentos
- Guard: se `profile.family_id` ausente, exibe aviso sem executar queries

*Client Components (3 arquivos em `_components/`):*
- `types.ts` — interfaces `TransactionRow`, `HistoricalTxRow`, `UpcomingRow`, `BudgetRow`, `CreditCardRow`, `InvoicePaymentRow`, `DashboardSummary`, `MonthlyTotal`, `CategoryAmount`, `BudgetWithStats`, `InvoiceCardData`; funções `computeSummary`, `computeMonthlyTotals`, `computeCategoryDistribution`, `computeBudgetStats`, `computeInvoiceCards`; helpers `formatCurrency`, `formatMonth`, `formatDate`, `shiftMonth`, `last6Months`
- `DashboardView.tsx` — header + toggle escopo + navegação de mês; 5 cards de resumo (Receitas/Despesas/Saldo/A receber/A pagar); `<AreaChart />` de evolução (últimos 6 meses); `<DonutChart />` de despesas por categoria; seção de orçamento com `<ProgressBar />` (top 5 + link "ver tudo"); cards de faturas por cartão com status e botão "Registrar pagamento"; tabela de próximos lançamentos pending
- `FaturaModal.tsx` — formulário com valor (default = total do mês no cartão) e observações; `POST /api/faturas` + `router.refresh()` + `onClose()`

**Decisões tomadas:**
- `historicalTransactions` é uma query leve (só `amount, date, type, status`) — não carrega `category` nem `credit_card_id` para economizar banda
- Seção de faturas usa todos os cartões ativos (RLS define visibilidade); filtra exibição para cartões com movimentação no mês ou pagamento registrado
- Próximos lançamentos: sempre a partir de `todayStr` (independente do mês navegado); respeita o toggle de escopo
- `computeInvoiceCards` usa as `transactions` do mês corrente (já scoped) para calcular o total por cartão

**Próxima sessão:**
- Iniciar Fase 9: Projetos (requer rodar migration 015 no Supabase antes de iniciar)

---

### Sessão 010 — 2026-02-26

**Objetivo:** Implementar Fase 7 — Visão Familiar / Caixa Familiar

**O que foi feito:**

*Migration 020:*
- `020_update_family_contributions.sql` — renomeia `effective_from→date`, adiciona `transaction_id FK`, remove unique constraint, adiciona índice por `(family_id, date)`
- Modelo revisado: cada `family_contributions` = aporte real (não configuração); cria despesa pessoal vinculada

*API Route (1 arquivo):*
- `POST /api/familia/contribuicao` — 2 passos: (1) cria transação pessoal `expense/personal/paid`; (2) insere `family_contributions` com `transaction_id`; rollback manual se passo 2 falhar

*Server Component (`/familia/page.tsx`):*
- `?mes=YYYY-MM` (padrão = mês corrente)
- `Promise.all` com 3 queries: profiles + aportes do mês + transações familiares do mês

*Client Components (3 arquivos em `_components/`):*
- `types.ts` — interfaces `FamilyMember`, `FamilyContribution`, `FamilyTransaction`; `computeCaixaFamiliar` (soma aportes no mês por membro); helpers de formatação
- `FamiliaView.tsx` — navegação de mês; card Caixa Familiar (total + contagem por membro, totais, saldo livre); lista de transações familiares
- `ContribuicaoModal.tsx` — formulário: valor, data (padrão = hoje), notas opcionais

*Navbar:*
- Desktop: +Família (Users, posição 7)
- Mobile: Parcelas → Família

**Decisões tomadas:**
- Toggle Familiar/Pessoal removido — itens compartilhados já visíveis em `/fixas`, `/assinaturas`, `/cartoes`
- Contribuição = movimento real: sai da conta pessoal, entra no caixa coletivo
- Supabase JS infere join `category:categories(...)` como array → cast `as unknown as FamilyTransaction[]`

**Próxima sessão:**
- Iniciar Fase 8: Dashboard

---

### Sessão 009 — 2026-02-26

**Objetivo:** Implementar Fase 6 — Orçamento Mensal

**O que foi feito:**

*Migration:*
- `019_fix_budget_unique_constraint.sql` — removida `UNIQUE(family_id, reference_month, category_id)` e substituída por dois índices parciais: um para `scope='family'` e outro para `scope='personal'`; aplicada via Management API

*API Routes (3 arquivos):*
- `POST /api/orcamento` — cria item de orçamento; retorna 409 se categoria já orçada
- `POST /api/orcamento/clonar` — busca orçamentos do mês anterior; pré-filtra categorias já existentes no destino; insere apenas as novas (padrão pré-filtro, evita conflito com índice parcial)
- `PATCH /api/orcamento/[id]` — edita `planned_amount` e `notes`
- `DELETE /api/orcamento/[id]` — remove categoria do orçamento

*Server Component (`/orcamento/page.tsx`):*
- URL params `?mes=YYYY-MM` e `?escopo=family|personal`
- Busca paralela (`Promise.all`): budgets + transações de despesa + categorias ativas
- Filtra transações por scope; para personal, também filtra por user_id

*Client Components (4 arquivos em `_components/`):*
- `types.ts` — `BudgetEntry`, `BudgetWithStats`, `CategoryStats`, helpers `computeStats`, `formatCurrency`, `formatMonth`, `shiftMonth`
- `OrcamentoList.tsx` — toggle Familiar/Pessoal, navegação de mês, card de totais (Planejado/Pago/Comprometido/Disponível), estado vazio com CTAs "Clonar do mês anterior" e "Criar do zero", botão "Adicionar categoria"
- `OrcamentoCard.tsx` — `<ProgressBar />` Tremor, valores gasto/comprometido/planejado, badge "Acima do limite" em vermelho, exclusão com confirmação inline
- `OrcamentoModal.tsx` — criar (seletor de categoria filtrando as já orçadas) / editar (categoria bloqueada)

*Navbar:*
- Desktop: 8 itens (+Orçamento com ícone PieChart)
- Mobile: Fixas substituída por Orçamento (Fixas é configuração; Orçamento é uso diário)

**Decisões tomadas:**
- Toggle Familiar/Pessoal altera URL param `?escopo` → server re-fetch (consistente com navegação de mês)
- "Clonar" usa pré-filtro (mesmo padrão de `generate-monthly`) — não usa upsert com ignoreDuplicates
- Exclusão de item: confirmação inline no card (sem modal separado) para fluxo mais rápido
- Cálculo de "disponível" = planejado − pago − comprometido; negativo → vermelho

**Problemas encontrados:**
- `Modal` não tem prop `isOpen` — resolvido com `if (!isOpen) return null` no topo do `OrcamentoModal`

**Próxima sessão:**
- Iniciar Fase 7: Visão Familiar e Caixa Familiar

---

### Sessão 008 — 2026-02-26

**Objetivo:** Implementar Fase 5 — Cron Jobs

**O que foi feito:**

*API Routes (3 arquivos):*
- `GET /api/cron/fetch-exchange-rate` — busca cotação USD/BRL da AwesomeAPI; atualiza `amount_brl` de todas as assinaturas ativas em USD; timeout 5s; retorna `{ rate, updated }` ou `503`
- `GET /api/cron/generate-monthly` — gera transações mensais para `fixed_incomes`, `fixed_expenses` e `subscriptions` ativas; datas com clamping para meses curtos (ex: dia 31 → dia 28 em fevereiro); idempotente via `upsert({ ignoreDuplicates: true })` + índices únicos do banco; retorna `{ ok, month, attempted, errors }` com HTTP 207 se houver erros parciais
- `GET /api/cron/supabase-keepalive` — query leve em `profiles` para manter o projeto Supabase gratuito ativo; retorna `{ ok, ts }`

*Padrões adotados:*
- `createServiceClient()` em todos os crons (bypassa RLS; acessa dados de toda a família)
- Validação do `CRON_SECRET` via header `Authorization: Bearer ...`; skip em dev (quando env var não está definida)
- `ignoreDuplicates: true` no upsert → gera `ON CONFLICT DO NOTHING` → idempotência garantida pelos índices únicos existentes
- Filtros de data em `fixed_incomes`/`fixed_expenses`: `start_date <= lastDay AND (end_date IS NULL OR end_date >= firstDay)`
- `exchange_rate` e `original_amount` preenchidos nas transações de assinatura USD

**Decisões tomadas:**
- Todos os três crons usam `GET` (Vercel cron jobs só disparam GET)
- `generate-monthly` retorna HTTP 207 se alguma das 3 etapas falhar, mas as demais prosseguem (falha parcial não aborta o job inteiro)
- `fetch-exchange-rate` deve rodar em dia 1 às 05:30 e `generate-monthly` às 06:00 — cotação atualizada antes da geração das transações de assinatura

**Problemas encontrados:**
- `upsert({ ignoreDuplicates: true })` não funciona com índices parciais via Supabase JS: gera `ON CONFLICT (id) DO NOTHING` (só verifica PK), e o índice parcial ainda lança constraint violation. Corrigido com pré-filtro: busca IDs já existentes no mês antes de inserir e usa `.insert()` apenas para os novos.
- Middleware bloqueava `/api/cron/*` (redirect para /login). Corrigido adicionando `/api/cron` ao array `publicRoutes`.

**Próxima sessão:**
- Iniciar Fase 6: Orçamento Mensal

---

### Sessão 007 — 2026-02-25

**Objetivo:** Implementar Fase 4 — Parcelamentos e Assinaturas completa

**O que foi feito:**

*API Routes (5 arquivos):*
- `POST /api/parcelamentos` — cria `installment_group` + gera N transações `installment` em lote; distribui centavos restantes na última parcela; datas calculadas com clamping correto para meses curtos (ex: dia 31 → dia 28/29 em fevereiro)
- `DELETE /api/parcelamentos/[id]` — cancela todas as parcelas `pending` do grupo (soft cancel; parcelas pagas permanecem)
- `GET /api/cotacao` — proxy para AwesomeAPI (`USD-BRL`); timeout 5s; retorna `{ rate }` ou `503`
- `POST /api/assinaturas` — cria assinatura; aceita BRL ou USD; `amount_brl` calculado no frontend com rate da API
- `PATCH /api/assinaturas/[id]` — edita campos da assinatura
- `DELETE /api/assinaturas/[id]` — cancela assinatura (`is_active = false`, `cancelled_at = now()`)

*Server Components (2 arquivos):*
- `/parcelamentos/page.tsx` — busca grupos + transações do tipo `installment` (todos os meses); computa progresso no client
- `/assinaturas/page.tsx` — busca assinaturas com joins em credit_card e category

*Client Components (8 arquivos):*

Parcelamentos:
- `types.ts` — `InstallmentGroupWithRelations`, `InstallmentSummary`, helpers `computeSummary`, `groupStatus`, `formatCurrency`, `formatDate`
- `ParcelamentoList.tsx` — filtro por status (Em andamento / Concluídos / Todos)
- `ParcelamentoCard.tsx` — barra de progresso das parcelas + próxima data + botão cancelar restantes
- `ParcelamentoModal.tsx` — formulário de criação; preview do valor da parcela em tempo real

Assinaturas:
- `types.ts` — `SubscriptionWithRelations`, helpers de formatação
- `AssinaturaList.tsx` — filtro Ativas / Todas; card de total mensal ativo
- `AssinaturaCard.tsx` — badge USD quando moeda estrangeira; valor BRL + original USD
- `AssinaturaModal.tsx` — criação/edição; auto-fetch de cotação ao selecionar USD; fallback para input manual de BRL se API indisponível

*Navbar:*
- Desktop: 7 itens (+ Parcelas + Assinaturas)
- Mobile: 5 itens fixos (Início, Transações, Parcelas, Assinat., Fixas) — Categorias e Cartões removidos do mobile por serem itens de configuração menos frequentes

**Decisões tomadas:**
- Distribuição de centavos: último parcela absorve o arredondamento (ex: R$ 100/3 → R$ 33,33 + R$ 33,33 + R$ 33,34)
- Datas de parcelas: clamping para último dia do mês quando o dia original não existe (ex: 31/jan + 1 mês → 28/fev)
- AwesomeAPI chamada do frontend via `/api/cotacao` (proxy); montante BRL enviado ao server já calculado; `exchange_estimated` marcado se inserido manualmente
- Parcelamentos listados sem filtro por mês (todos os grupos ativos são exibidos)
- Mobile nav reorganizada: Categorias/Cartões só no desktop (configuração); Parcelas/Assinaturas no mobile (uso frequente)

**Problemas encontrados:**
- Nenhum — build passou sem erros na primeira tentativa

**Próxima sessão:**
- Iniciar Fase 5: Cron Jobs (fetch-exchange-rate, generate-monthly, supabase-keepalive)

---

### Sessão 006 — 2026-02-25

**Objetivo:** Implementar Fase 3 — Transações Manuais completa

**O que foi feito:**

*API Routes (2 arquivos):*
- `POST /api/transacoes` — cria transação manual (`income`/`expense`), extrai `family_id`/`user_id` da sessão, `auto_generated = false`
- `PATCH /api/transacoes/[id]` — edita campos e/ou muda status (paid/cancelled/pending); `paid_at` preenchido automaticamente ao marcar como pago
- `DELETE /api/transacoes/[id]` — exclui apenas se `auto_generated = false`, caso contrário retorna 403

*Server Component (`/transacoes/page.tsx`):*
- Navegação por mês via URL param `?mes=YYYY-MM` (padrão = mês corrente)
- Busca transactions com join `category:categories` e `credit_card:credit_cards` via Supabase select alias
- Busca categorias e cartões ativos para o formulário

*Client Components (5 arquivos em `_components/`):*
- `types.ts` — `TransactionWithRelations`, helpers de filtragem, formatação e navegação de mês
- `TransacaoList.tsx` — filtros (escopo Tudo/Pessoal/Familiar, tipo, status, categoria), resumo do mês (receitas/despesas/saldo), navegação de mês, gerenciamento de modais
- `TransacaoCard.tsx` — layout 2 linhas; badge de status + escopo + tipo; ações contextuais por status: Editar (manual), Pagar (pending), Cancelar (não cancelado), Excluir (manual + cancelado)
- `TransacaoModal.tsx` — criar/editar; tipo Receita/Despesa (bloqueado na edição); campos: descrição, valor, data, categoria, forma de pagamento, cartão, notas, escopo
- `PagarModal.tsx` — confirma pagamento com data opcional (padrão = hoje)

*Navbar:*
- Adicionado link "Transações" com ícone `ArrowLeftRight` (2ª posição)

**Decisões tomadas:**
- Mês gerenciado via URL param (server-side re-fetch a cada troca de mês) — mais simples e consistente com Next.js App Router
- `types.ts` isolado na pasta `_components/` para compartilhar tipos e helpers entre os 4 componentes sem poluir `src/types/database.ts`
- Excluir = apenas transações manuais canceladas (botão aparece só nesse estado)
- Cancelar = disponível para qualquer status exceto `cancelled` (tanto manual quanto automática)
- Saldo na barra de resumo exclui transações canceladas do cálculo

**Problemas encontrados:**
- Nenhum — build passou sem erros na primeira tentativa

**Próxima sessão:**
- Iniciar Fase 4: Parcelamentos e Assinaturas

---

### Sessão 005 — 2026-02-25

**Objetivo:** Implementar Fase 2 (CRUD Base) + ajustes de UX e mobile pós-teste

**O que foi feito:**

*Fase 2 — CRUD Base:*
- Instalada dependência `lucide-react` para ícones
- Criada Navbar com ícones (Dashboard, Categorias, Cartões, Fixas, Sair)
- Criados componentes compartilhados: `Modal.tsx` e `ScopeSelector.tsx`
- CRUD completo de **Categorias**, **Cartões de Crédito**, **Receitas e Despesas Fixas**
- 8 API Routes com validação, `family_id`/`user_id` via session, RLS automático
- Página `/fixas` com abas (Receitas | Despesas) em único layout

*Ajustes de UX pós-teste:*
- `Modal.tsx` refatorado: `max-h-[70vh]`, header/footer fixos, conteúdo scrollável
- Modal como **bottom sheet** no mobile (`items-end`, `rounded-t-2xl`)
- Prop `footer` separada nos modais; botões de submit via atributo `form=""`; erro sempre visível no footer
- `Navbar.tsx`: bottom navigation bar no mobile (`fixed bottom-0`), top bar no desktop
- `layout.tsx`: `pb-24 sm:pb-0` para não sobrepor bottom nav
- `FixaCard.tsx`: layout de 2 linhas (nome+valor / metadata+badge+ações)
- `FixaList.tsx`: tabs `w-full sm:w-fit` com `flex-1` no mobile
- Padrões de UI/mobile formalizados em `docs/padroes.md` (nova Seção 2)

*Infraestrutura:*
- Git configurado globalmente: `gabriel.brandao@atus.cloud` / `Gabriel Brandão`
- 13 commits reescritos com email correto via `git filter-branch`; force push feito
- `next.config.mjs`: `devIndicators` habilitado no canto inferior direito
- Erros 404 de cache stale: resolvidos com `rm -rf .next`

**Decisões tomadas:**
- Categorias sem scope (globais da família)
- Mutações via API Routes (não Server Actions)
- `router.refresh()` após mutações para re-fetch server-side
- Modal como bottom sheet no mobile — padrão de apps financeiros (Nubank-like)

**Problemas encontrados:**
- Cache stale do `.next` causando erros 404 ao trocar de porta → `rm -rf .next`
- Timeout aparente no Vercel → na verdade cookie de sessão expirado no browser. Não era bug.

**Próxima sessão:**
- Iniciar Fase 3: Transações Manuais

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
