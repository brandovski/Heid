# Heid — Diário de Desenvolvimento

> Este documento é o registro vivo do projeto. Atualizado ao fim de cada sessão.
> Serve como ponto de partida para retomar o contexto sem depender da memória da sessão anterior.
>
> Antes de criar ou alterar migrations, consultar também: `docs/padroes.md`

---

## Estado Atual do Projeto

**Fase:** UI/Branding — Dashboard redesign, componentes reutilizáveis
**Última sessão:** Sessão 042 — 2026-03-23
**Próxima ação:** Continuar revisão visual do Dashboard e demais páginas (orçamento, transações, cartões)

### O que está feito
- [x] Sessão 042 — Dashboard redesign completo: saudação serif (42px nome + 24px subtítulo), toggle de escopo pill, FluxoWidget acima do mês, grid 5 cards `InfoCard`; `MonthNavigator` reutilizável (pill label + botões pill, `gap-5`) aplicado em 7 páginas; `InfoCard` reutilizável (highlighted/colorVariant); `GraficoCategoria` Recharts idêntico ao Shadcn (innerRadius 62%, outerRadius 78%, label central total + "despesas", tooltip em linha); cor da categoria propagada de `computeCategoryDistribution` até o gráfico; paleta de 12 pastéis alinhados ao branding no seletor de cores do `CategoriaModal`; fix botão "Meu Perfil" (borda `border-brand-700`, sem divisor). Commits: `61d502a`–`a93480c`.
- [x] Sessão 041 — Fase UI/Branding: design system completo a partir do Figma (paleta `brand/accent/danger/surface`, tokens `card/panel/pill`, CSS vars); Sidebar desktop com card amarelo flutuante, logo real, nav agrupada, item ativo em pill; Navbar migrada para novos tokens, nav desktop removida; layout com `sm:ml-[260px]` e `sm:mt-0`; assets de logo completos (`logo.svg`, `logo-mark.svg`, `logo-white.svg`, PNGs 192/512, `icon.svg`, `apple-icon.png`, `opengraph-image.png`). Commits: `7d0655e`, `663df89`, `8a9d421`.
- [x] Sessão 040 — `billing_day` derivado automaticamente do dia de `start_date` (sem campo na UI); campo "Dia de cobrança" removido do `AssinaturaModal`; `start_date` full-width com label "Data de início (1ª cobrança)"; POST `/api/assinaturas` gera a 1ª transação imediatamente após criar a assinatura (`date=start_date`, `type=subscription`, `status=pending`, `auto_generated=true`, lógica promocional idêntica ao cron); PATCH `/api/assinaturas/[id]` não altera mais `billing_day`. Zero erros TypeScript. Commit: `3a93bff`.
- [x] Sessão 039 — Agrupamento de faturas por mês de **vencimento** (`due_day`): `getInvoiceMonth(date, closingDay, dueDay)` agora converte mês de fechamento → mês de vencimento (`due_day < closing_day` → +1 mês); `getFatureDateRange(dueMonth, closingDay, dueDay)` converte mês de vencimento → fechamento antes de calcular range; `fatura-utils.ts` reorganizado com `shiftMonth` antes das funções que o usam; `computeInvoiceCards` e ambas as chamadas em `TransacaoList.tsx` passam `card.due_day`; select de cartões em `transacoes/page.tsx` inclui `due_day`; range de fatura estendido para 2 meses atrás em `transacoes/page.tsx` e `dashboard/page.tsx`; `FaturaDetalheModal.tsx` passa `cartao.due_day`; `api/faturas/route.ts` seleciona `due_day` e o passa ao `getFatureDateRange`; migration 035 aplicada (corrige `reference_month` existente para cartões com `due_day < closing_day`). Zero erros TypeScript.
- [x] Sessão 038 — Fix FluxoWidget: prop `creditCards` substituída por `invoiceCards: InvoiceCardData[]` em `FluxoWidget.tsx`; lógica de cálculo de `faturaItems` reescrita para usar `invoiceCards` (já computado por `computeInvoiceCards` com range estendido e `closing_day`), eliminando a duplicação com a lógica incorreta que somava `transactions` de mês calendário com `status=pending`. `DashboardView.tsx` passa `invoiceCards={invoiceCards}` ao FluxoWidget. Testado em produção: totais do widget agora batem com os cards de fatura. Commit: `8bf6756`.
- [x] Sessão 037 — Cinco melhorias independentes: (1) Ciclo de faturamento correto por `closing_day`: `src/lib/fatura-utils.ts` criado com `getInvoiceMonth()` e `getFatureDateRange()`; `dashboard/page.tsx` adiciona query `faturaTransacoes` com range estendido; `computeInvoiceCards()` refatorado para usar `getInvoiceMonth`. (2) Fix: transações de cartão agora aparecem na lista principal de `/transacoes`. (3) Fix: data da compra preservada ao alternar para parcelado no modal de transações. (4) Fix: projeção de investimento familiar soma aportes de ambos os contribuidores (`monthly_contribution_amount` + `partner_contribution_amount`). (5) Badge com nome do contribuidor adicionado aos aportes na projeção de investimento. Commits: `227fc88`–`d27345e`.
- [x] Sessão 036 — Três melhorias independentes: (A) Fix resgate→transação pessoal: `transacoes/route.ts` — withdrawal agora usa `txScope="personal"` e `txUserId=user.id` (autenticado, não dono do investimento); `contributor_user_id=user.id` setado em ambos deposit e withdrawal (antes só em deposit). (B) Tags nos resgates: migration 033 — `project_item_id UUID REFERENCES project_items(id) ON DELETE SET NULL` em `investment_transactions`; backfill via `investment_deposit_id` (4 sinais linkados) + backfill via LIKE de notes (1 pagamento único — Fotografia); `pagar/route.ts` — os 3 inserts de investment_transactions passam `project_item_id: params.id`; `InvestimentoDetalhe.tsx` — badge do contribuinte exibido para deposits E withdrawals (antes só deposits); novo badge "Projeto · Nome" roxo quando `project_item_id` linkado; `page.tsx` e `ProjectItemRef` interface atualizados com `investment_deposit_id` e `project:projects(id, name)`; `InvestmentTransaction` em `database.ts` inclui `project_item_id`. (C) Assinaturas pessoais: migration 034 migra Netflix, Google One, Live Academia → scope=personal, user_id=User2; `AssinaturaModal` — ScopeSelector removido, estados `scope`/`isShared` removidos, payload sem scope/is_shared; `assinaturas/route.ts` hardcoda personal/user.id/false; `assinaturas/[id]/route.ts` remove bloco de atualização de scope; `AssinaturaCard` — scopeColor e badge Familiar/Pessoal removidos. Migrations 033–034 aplicadas. Zero erros TypeScript.
- [x] Sessão 035 — Correção de bug crítico: `deposit_transaction_id` tem FK para `transactions(id)`, mas código tentava salvar `investment_transactions.id` → violação de FK silenciosa (INSERT da invTx commitado, UPDATE do item falhava → orphaned withdrawals duplicados a cada clique). Solução: nova coluna `investment_deposit_id UUID REFERENCES investment_transactions(id) ON DELETE SET NULL` em `project_items` (migration 031). Backfill populou os 4 itens confirmed (Assessoria, Open Bar, Dia da Noiva, Villa Tarumã Açú) com os IDs corretos. `pagar/route.ts` agora usa `investment_deposit_id` na checagem do passo 1 e no UPDATE. `ItemCard.tsx`, `ProjetoDetalhe.tsx` e `computeProjectStats` aceitam ambas as colunas para `depositPaid`/`depositosParciais`. Migration 031 aplicada. Zero erros TypeScript.
- [x] Sessão 034 — Correção de 2 bugs pós-sessão 033: (1) Bug gasto_real em cards de projeto — `projetos/page.tsx` agora inclui `deposit_transaction_id` e `deposit_amount` no select, permitindo que `computeProjectStats` calcule `depositosParciais` corretamente; (2) Bug investimentos — migration 030 criou 4 investment_transactions faltantes para itens `confirmed+deposit_remainder` (Assessoria 750, Open Bar 1250, Dia da Noiva 225, Villa Tarumã Açú 3150) e deletou 5 transações erradas do extrato (Fotografia 3612.50 + 4 sinais); FK ON DELETE SET NULL nulou referências automaticamente; `pagar/route.ts` atualizado para suportar two-step deposit_remainder+investment (Passo 1 debita sinal do investimento, Passo 2 debita restante). Migration 030 aplicada. Zero erros TypeScript.
- [x] Sessão 033 — Melhorias e correções abrangentes (7 itens): (1) Assinaturas com valor promocional — migration 026 (`promotional_amount`, `promotional_months` em subscriptions), toggle no AssinaturaModal, APIs atualizadas, cron calcula mês ativo vs promo, badge "Promo" no AssinaturaCard; (2) Investimentos — tag de contribuinte: page.tsx busca profiles da família, InvestimentoDetalhe exibe badge `bg-brand-100 text-brand-700` com nome ao lado do aporte; (3) Resgate de investimento vira receita — migration 029 (`UPDATE transactions SET type='income' WHERE type='investment_withdrawal'`), API transacoes/route.ts usa `txType='income'` para withdrawal, INCOME_TYPES atualizado em transacoes/ e fluxo/, helper `getTypeLabel(type, investmentId)` criado para exibir "Resgate" quando income+investment_id; (4) Categorias com tipo + delete — migration 027 (coluna `type TEXT CHECK`), CategoriaModal com toggle Ambos/Receita/Despesa, CategoriaCard com badge de tipo e botão Trash2 para arquivadas, CategoriaList em 3 seções, DELETE endpoint com verificação de vínculos, filtro de categorias em TransacaoModal e FixaModal por type; (5) Recorrências — FixaModal renomeado para "Recorrente", ScopeSelector removido, scope hardcoded=personal nas APIs, PAGE_TITLES inclui `/fixas: "Recorrências"`, labels "Recorrente" nas transações, migration 028 migra family→personal; (6) Bug projetos — pagar/route.ts: payment_origin=investment verificado PRIMEIRO (antes dos branches de payment_type), elimina bug de investimento não debitado; (7) Bug saldo real — ProjetoDetalhe e computeProjectStats incluem `depositosParciais` de itens `confirmed+deposit_transaction_id`. Migrations 026–029 aplicadas. Zero erros TypeScript.
- [x] Sessão 032 — Criação retroativa de `supabase/migrations/024_partner_contribution.sql`: arquivo SQL da migration 024 criado no repositório para rastreabilidade — schema já estava aplicado no Supabase desde a sessão 029. Sequência 023→024→025 agora completa no repositório. 1 arquivo criado. Commit: `6188282`.
- [x] Sessão 031 — Hardening de segurança e qualidade das API routes: (1) CRON_SECRET fail-closed: 3 endpoints de cron (`generate-monthly`, `fetch-exchange-rate`, `supabase-keepalive`) corrigidos — `if (cronSecret && ...)` → `if (!cronSecret || ...)` para negar acesso quando variável não configurada; (2) `contributor_user_id` removido do corpo do `POST /api/investimentos/[id]/transacoes` — sempre usa `user.id` autenticado, impedindo falsificação de contribuinte; (3) `family_id` adicionado a todas as queries UPDATE/DELETE em 8 routes (`[id]` de transacoes, investimentos, assinaturas, receitas-fixas, despesas-fixas, orcamento, cartoes, projetos) — defesa em profundidade além do RLS; (4) Migration 025 criada e aplicada — trigger PostgreSQL `trg_system_categories_on_new_profile` + função que insere automaticamente as 3 categorias de sistema (Projeto, Caixa Familiar, Investimento) para cada nova família; corrige bug da migration 023 que hardcodava `family_id` da família de dev; backfill executado; (5) `loading.tsx` criado em 5 segments (`dashboard`, `transacoes`, `investimentos`, `orcamento`, `familia`) com skeletons `animate-pulse` correspondentes ao layout real; (6) `src/app/(app)/error.tsx` — Error Boundary global client com brand styling, ícone `AlertTriangle`, botão "Tentar novamente" (reset); (7) `.single()` error handling padronizado em ~17 arquivos — `profileError`, `itemError`, `subError`, `txError` verificados em todas as chamadas `.single()`. 33 arquivos alterados. Zero erros TypeScript. Commit: `b638a59`.
- [x] Sessão 030c — ConfirmModal + Header Desktop Fixo: (1) `src/components/ui/ConfirmModal.tsx` criado — wrapper sobre `Modal.tsx`, props `isOpen/onClose/onConfirm/title/description/confirmLabel/cancelLabel/variant`; ícone `AlertTriangle` em círculo colorido (danger=red-50/red-500, warning=amber-50/amber-500); loading state interno com spinner; botões flex-1 (cancelar=gray, confirmar=red-600 ou amber-500); renderiza via portal apenas quando `isOpen`; (2) 7 `confirm()` nativos substituídos por `ConfirmModal`: TransacaoCard (excluir, danger), FamiliaView (excluir tx, danger, `pendingDeleteTx` state), AssinaturaCard (cancelar assinatura, warning), ParcelamentoCard (cancelar parcelas, warning), InvestimentoModal (arquivar investimento, warning), ProjetoDetalhe (excluir grupo, danger, `pendingDeleteId` state + `doDeleteGroup()`), InvestimentoDetalhe (excluir movimentação, danger, `pendingDeleteId` state + `doDeleteTx()`); (3) Header desktop fixo: `Navbar.tsx` linha 135 — `fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 shadow-sm shadow-black/5` (parity com header mobile); `layout.tsx` — `sm:mt-0` → `sm:mt-16` (64px = h-16 do nav desktop). Zero erros TypeScript. Nenhum `confirm()` nativo restante.
- [x] Sessão 030b — Indicador de compra finalizada no ParcelamentoModal: (1) `ParcelamentoModal.tsx` — `estimatePaidInstallments()` substituído por `rawPaidCycles()` (sem clamp `totalCount - 1`); `rawCycles` via `useMemo` sem dependência de `count`; `isCompleted = count > 0 && rawCycles >= count`; `paidInstallments = isCompleted ? count : Math.min(rawCycles, count - 1)`; import `Clock` e `CheckCircle2` de lucide-react; 3 estados de banner: (a) sem cartão/data ou fatura não cobrada → texto cinza xs; (b) parcialmente pago → banner `bg-amber-50 border-l-4 border-amber-400` com ícone Clock e texto "X parcelas pagas, considerando o fechamento do cartão (dia Y). Restam Z a pagar."; (c) quitado → banner `bg-emerald-50 border-l-4 border-emerald-500` com ícone CheckCircle2 e título "Compra quitada"; preview da parcela exibe "· todas pagas" (text-emerald-600) quando quitado; (2) `route.ts` parcelamentos: validação `paidCount > count` (era `>= count`) — permite `paid_installments === count` para compras quitadas. Zero erros TypeScript.
- [x] Sessão 030 — Melhorias no formulário de nova compra parcelada: (1) `ParcelamentoModal.tsx` — removido `ScopeSelector` (import, estados `scope`/`isShared`, bloco JSX); campo "Data da 1ª parcela" renomeado para "Data da compra"; `estimatePaidInstallments()` adicionado (calcula parcelas pagas com base em `closing_day` do cartão e data da compra); `selectedCard` derivado via `useMemo`; `paidInstallments` calculado via `useMemo`; legenda automática abaixo do DatePicker (amber se >0, cinza se =0); preview do valor da parcela exibe "· X a pagar" quando há pagas; payload remove `scope`/`is_shared`, adiciona `paid_installments`; prop `cartoes` ampliada para incluir `closing_day`; (2) `page.tsx` parcelamentos: query de `credit_cards` inclui `closing_day`; (3) `ParcelamentoList.tsx`: tipo de `cartoes` inclui `closing_day`; (4) `route.ts` parcelamentos: aceita `paid_installments` (default 0); validação `paidCount >= count`; `scope: "personal"` e `is_shared: false` hardcoded; transações geradas com `status: "paid"` para índices `< paidCount`. Zero erros TypeScript.
- [x] Sessão 029 — Aportes mensais com confirmação manual: (1) Migration 024: `partner_contribution_amount`/`partner_contribution_day` em `investments` + constraint `chk_investments_partner_contribution` + `contributor_user_id UUID` em `investment_transactions`; (2) `src/types/database.ts` atualizado com novos campos; (3) `src/lib/investment-utils.ts` criado — tipos `InvestmentContributionRow`, `InvTransactionRow`, `AporteCardData` + função `computeAporteCards()`; (4) APIs: `POST /api/investimentos` e `PATCH /api/investimentos/[id]` aceitam `partner_contribution_*`; `POST /api/investimentos/[id]/transacoes` muda depósitos de `investment_deposit` para `expense` pessoal do contribuinte + salva `contributor_user_id`; (5) Cron `generate-monthly`: bloco de aportes automáticos de investimentos removido completamente; (6) `src/components/ui/ConfirmarAporteModal.tsx` criado — toggle integral/outro valor, DatePicker, notes, POST para transacoes; (7) `InvestimentoModal.tsx` reescrito com card expansível "Aporte Mensal" — escopo personal (1 bloco) ou family (dono + parceiro); (8) Dashboard `types.ts` reexporta tipos e `computeAporteCards` de `@/lib/investment-utils`; (9) Dashboard `page.tsx` adiciona 2 queries (investments + invTransactions) e passa `investments`, `invTransactions`, `currentUserId` ao DashboardView; (10) `DashboardView.tsx` — widget "Aportes do Mês" com `AporteCard` inline (badge de tipo, dia, valor, status) + `ConfirmarAporteModal`; (11) `investimentos/page.tsx` passa `userId` ao `InvestimentoList`; (12) `InvestimentoList.tsx` — banner amber de pendências com botão "Confirmar" + `ConfirmarAporteModal`. Zero erros TypeScript.
- [x] Sessão 028 — Categorias de sistema + remoção de categoria de itens de projeto + hard delete: (1) Migration 023: coluna `is_system BOOLEAN DEFAULT false` em categories + 3 categorias de sistema inseridas (Projeto 🏗️ #2563EB, Caixa Familiar 🤝 #7C3AED, Investimento 📈 #059669); (2) helper `getSystemCategoryId(supabase, familyId, name)` em `src/lib/supabase/system-categories.ts`; (3) `GET /api/categorias` filtra `is_system=false`; (4) `PATCH /api/categorias/[id]` retorna 403 se `is_system=true`; (5) `pagar/route.ts` usa categoria "Projeto" automaticamente; (6) `contribuicao/route.ts` usa categoria "Caixa Familiar"; (7) `transacoes/route.ts` (investimentos) usa categoria "Investimento"; (8) Cron `generate-monthly` usa categoria "Investimento" em aportes automáticos; (9) `project_items POST/PATCH` removido `category_id`; (10) `DELETE /projetos/itens/[id]?permanent=true` hard delete apenas para `status='cancelled'`; (11) ItemModal: campo categoria removido; (12) ItemCard: botão lixeira (Trash2) visível apenas para `isCancelled`; (13) page.tsx do projeto: fetch de categories removido; (14) Página de categorias: filtra `is_system=false`. Zero erros TypeScript.
- [x] Sessão 027 — Tipografia mobile + botões full-width: (1) Header mobile Navbar: `text-[1.5rem] font-bold font-serif` (Kaisei Tokumin 24px); (2) Saudação Dashboard: `text-[2rem] leading-[2.5rem]` (32px); (3) h1/div do corpo ocultados no mobile (`hidden sm:block` / `hidden sm:flex`) em cartoes, categorias, investimentos, familia, orcamento; (4) Botão "Novo X" full-width (`sm:hidden w-full rounded-xl py-3`) adicionado acima do conteúdo em CartaoList, CategoriaList, InvestimentoList, ProjetoList, TransacaoList, AssinaturaList, ParcelamentoList; (5) Header desktop preservado com `hidden sm:flex`; (6) Labels padronizados: "Novo Investimento", "Nova Transação", "Nova Assinatura", "Nova Compra", "Novo Projeto". Zero erros TypeScript.
- [x] Sessão 026 — Correções pós-rebrand: `globals.css` reduzido para `h1 { @apply font-serif; }` (h2/h3 removidos — serifa apenas em títulos de página); Navbar.tsx `font-serif` removido do brand "Heid" (agora Poppins); todos os active states da navbar `bg-brand-50` → `bg-brand-100` (#d5f0e7, mint claramente visível — 10 ocorrências). Zero erros TypeScript.
- [x] Sessão 025 — Rebrand Couple → Heid: nova identidade visual completa — fontes Kaisei Tokumin (serif, títulos) + Poppins (sans, body) via next/font; paleta brand-* (#1D2D28 como brand-600, deep forest green) substituindo blue-* em 90+ arquivos src/; `tailwind.config.ts` com colors.brand e fontFamily (sans/serif); `globals.css` com `@layer base { h1, h2, h3 { @apply font-serif; } }`; Navbar: "Heid" com `font-serif text-brand-700`; login page: acento brand + h1 Kaisei Tokumin; package.json: name "heid"; documentação e MEMORY.md atualizados. Zero erros TypeScript.
- [x] Sessão 024 — Redesign completo da navegação mobile: Desktop: Dashboard renomeado para Home (ícone Home), link Fluxo removido (acessado apenas via Dashboard); Mobile: novo header fixo (`h-14`, `bg-white/80 backdrop-blur-xl`) com título da página derivado do pathname via `PAGE_TITLES` map e botão de perfil com dropdown multi-nível (`MenuView: "main" | "cartoes"`) — Meu Perfil, Cartões → submenu (Gerenciar Cartões, Parcelas, Assinatura + botão voltar), Orçamento, Família; Mobile bottom nav glassmorphism com 4 links (Home, Transações, Projetos, Invest.) + slot central `flex-1` para FAB; FAB fixo `bottom-11` (44px) `left-1/2` com `ring-4 ring-white bg-blue-600`, 40px dentro da nav e 16px acima dela para projeção visual; quick-add modal com lazy fetch de `/api/categorias` (GET) e `/api/cartoes` (GET) + `TransacaoModal` + `router.refresh()` após criar; layout.tsx: `mt-14 sm:mt-0` para compensar header fixo mobile; `GET /api/categorias` e `GET /api/cartoes` adicionados. Zero erros TypeScript.
- [x] Sessão 023 — Fluxo two-step para `deposit_remainder` em Projetos + Projeção Dividida em Investimentos: ItemModal (modo confirm) com 4 campos pré-preenchidos para deposit_remainder (valor total, entrada, data entrada, data restante) e cálculo do restante em tempo real; fallback `budget_amount` no `actualAmount` para todos os tipos; PATCH confirm aceita `deposit_amount` e `remainder_date` opcionalmente; ItemCard exibe "Pagar Entrada" / "Pagar Restante" conforme `deposit_transaction_id` + info visual Entrada/Restante; ProjetoDetalhe.handlePayItem lê body da resposta (`step: "deposit"` → seta `deposit_transaction_id`; `step: "remainder"` → status→paid); pagar/route.ts dois passos: Passo 1 cria transação do sinal, deixa item em "confirmed", retorna `{step:"deposit"}`; Passo 2 cria transação do restante, status→"paid", retorna `{step:"remainder"}`; investimentos/[id]/page.tsx amplia query project_items com payment_type/deposit_amount/remainder_date/deposit_transaction_id; ProjectItemRef em InvestimentoDetalhe e ProjecaoView atualizado com novos campos; ProjecaoView cria dois eventos separados por item deposit_remainder (entrada na expected_payment_date, restante na remainder_date), skipa itens paid, envia para "sem data" apenas se sem nenhuma data futura. Zero erros TypeScript.
- [x] Sessão 022 — `expected_payment_date` em Projetos + ProjecaoView em Investimentos: ItemModal (modo confirm) agora exibe DatePicker opcional "Data prevista de pagamento" e envia `expected_payment_date` ao PATCH; API `/api/projetos/itens/[id]` atualizada para salvar a data na confirmação; FluxoProjecao removido e substituído por ProjecaoView (orquestrador) + ProjecaoTimeline + ProjecaoCalendario — seção unificada com navegação por mês, saldo acumulado por dia, aportes reais futuros, aportes mensais projetados (sem auto_generated), project_items com data, e seção inferior para itens sem data prevista; InvestimentoDetalhe usa ProjecaoView sempre (sem condicional). Zero erros TypeScript.
- [x] Fase 11 v2 — Revisão Fluxo Futuro (Sessão 021): FluxoWidget no Dashboard (4 próximas movimentações + link /fluxo); FluxoProjecao em Investimentos (tabela 12 meses); `/fluxo` expandido para 9 queries (+ fixed_incomes, fixed_expenses, credit_cards, partner profile); FluxoView v2 com agrupamento de fatura por cartão, projeção de fixas não-geradas (kind="fixed_projected"), escopo parceiro com nomes reais (sem "Familiar"/"Tudo"); FluxoTimeline e FluxoCalendario atualizados para kind="fatura" (ícone CreditCard, badge "fatura", "vence dia DD") e kind="fixed_projected" (badge "fixo · previsto", bg-blue-50/50); Navbar mobile: Fluxo → Orçamento restaurado. Zero erros TypeScript.
- [x] Fase 11 — Fluxo Futuro completo (Sessão 020): tela `/fluxo` com linha do tempo financeira mensal; Server Component com 5 queries em Promise.all (transações pagas, pendentes, investimentos ativos, investment_transactions auto_generated, project_items confirmados); FluxoView Client Component com tabs de escopo (Pessoal/Familiar/Tudo), navegação de mês, cálculo de saldo projetado acumulado por dia e toggle de layout; FluxoTimeline (lista agrupada por dia com saldo projetado no cabeçalho, ícones, badges, destaque para itens projetados); FluxoCalendario (grid 6×7 com dots coloridos por tipo, painel de detalhe ao clicar no dia); Navbar mobile: Orçamento → Fluxo; Navbar desktop: Fluxo adicionado após Investimentos. Zero erros TypeScript.
- [x] Fase 10 — Investimentos completo (Sessão 018): migration 018 aplicada (`investment_id` em `transactions`, policy `scoped_select` recriada); CRUD de investimentos (GET/POST/PATCH); aportes/resgates manuais com transaction vinculada; snapshots de saldo (append-only); página lista com tabs Ativos/Arquivados; página detalhe com stats, gráfico Recharts, movimentações; GraficoEvolucao LineChart; cron `generate-monthly` estendido com aportes automáticos (idempotente); integração Projetos: `payment_origin='investment'` no ItemModal, `investment_id` nos itens, fluxo pagar cria withdrawal no investimento sem lançar no extrato; link Investimentos na Navbar desktop com ícone TrendingUp.
- [x] Correção Saldo Atual em Investimentos (Sessão 019): 3 bugs corrigidos — `calcSaldoAtual` agora aceita `transactions`; sort secundário `created_at DESC` adicionado às queries de snapshots (evita ordem não-determinística com datas iguais); comparação `tx.date > last.date` substituída por `tx.created_at > last.created_at` (garante que aportes do mesmo dia do snapshot sejam contabilizados corretamente).
- [x] Fase 9 — Projetos completo (Sessão 017): módulo completo de projetos com grupos, itens, fluxo considering→confirmed→paid, geração de transações (cash/card_installment/deposit_remainder), navbar atualizada
- [x] Fase 8 — Dashboard completo + melhorias pós-fase: redesign de CartaoCard, FaturaDetalheModal, PagarFaturaModal compartilhado, FaturaGrupoCard em /transacoes
- [x] Reestruturação de escopo (Sessão 013): /transacoes com abas Meu/Parceiro, /dashboard com toggle pessoal/parceiro (nomes reais), /orcamento sempre pessoal, /perfil com avatar/iniciais/logout, parcelamento inline no TransacaoModal, toggle de compartilhamento persistente
- [x] Correções pós-escopo (Sessão 014): migration 022 — coluna `is_shared` em transactions + backfill + cláusula RLS; data fix no cartão "Itaú Click"; migration 021 — policy `profiles_select_family_members`
- [x] Navbar mobile glassmorphism (Sessão 015): flutuante bottom-5 com bg-white/60, backdrop-blur-xl, rounded-2xl, item ativo com pill bg-white/80; layout pb-32
- [x] Commits organizados e repositório limpo (Sessão 015): 8 commits atômicos por feature, push realizado, Vercel buildando
- [x] Revisão abrangente da documentação (Sessão 016): `regras-de-negocio.md`, `arquitetura.md`, `roadmap.md` atualizados para refletir decisões das sessões 005–015 (Tremor→Recharts, modelo de compartilhamento, is_shared em transactions, orçamento sempre pessoal, toggle com nomes reais, schema family_contributions, unicidade budgets, rotas em português, perfil, tabelas de investimentos)
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
- [x] Repositório GitHub criado: `gabrielbrandao-atus/heid`
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
- [x] Migration 015 (projects) — aplicada em sessão 017
- [x] Rodar migration 017 Parte 1 (ENUM: investment_deposit + investment_withdrawal) no Supabase
- [x] Rodar migration 017 Partes 2–4 (investments, investment_transactions, investment_snapshots) no Supabase
- [x] Rodar migration 017 Parte 5 (ALTER TABLE project_items) — aplicada em sessão 017
- [x] Migration 018 (investment_id em transactions) — aplicada em sessão 018
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

### Sessão 019 — 2026-02-27

**Objetivo:** Investigar e corrigir bugs no módulo de Investimentos (Fase 10)

**O que foi feito:**

*Diagnóstico:*
- Investigação completa do "Cofrinho do Casal" via consulta direta ao banco (REST API com service role)
- Reconstrução da timeline exata dos eventos por `created_at`
- Identificação de 3 bugs relacionados ao cálculo de `calcSaldoAtual`

*Correções (3 bugs, 5 arquivos, zero DB):*
- **Bug 1:** `calcSaldoAtual` ignorava transações — agora aceita `transactions` como segundo parâmetro e calcula o saldo incremental
- **Bug 2:** sort não-determinístico de snapshots com datas iguais — adicionado `.order("created_at", { ascending: false })` como sort secundário em `investimentos/page.tsx` e `investimentos/[id]/page.tsx`
- **Bug 3:** comparação `tx.date > last.date` (string de data) excluía aportes do mesmo dia do snapshot — substituído por `tx.created_at > last.created_at` (ISO timestamp)

*Resultado verificado:*
- "Cofrinho do Casal": Saldo Atual = R$6.029, Rentabilidade = +R$29 (+0,5%) ✅
- `tsc --noEmit` sem erros ✅

*Commit:* `131cfa9 fix: corrige Saldo Atual em Investimentos` — push realizado para `origin/main`

---

### Sessão 018 — 2026-02-27

**Objetivo:** Implementar Fase 10 — Investimentos

**O que foi feito:**

*Migration:*
- Migration 018 aplicada via Management API: `investment_id UUID` em `transactions` + índice parcial + policy `scoped_select` recriada

*API Routes (5 arquivos):*
- `GET + POST /api/investimentos` — listar e criar investimentos
- `PATCH /api/investimentos/[id]` — editar / arquivar
- `POST /api/investimentos/[id]/transacoes` — aporte/resgate (cria `investment_transaction` + `transaction` vinculada)
- `POST /api/investimentos/[id]/snapshots` — checkpoint de saldo real (append-only)
- `DELETE /api/investimentos/transacoes/[txId]` — excluir movimentação manual

*Pages e Componentes (10 arquivos):*
- `/investimentos/page.tsx` — Server Component, query paralela
- `_components/types.ts` — `INVESTMENT_TYPE_LABELS`, `calcTotalAportado`, `calcSaldoAtual`, `calcRentabilidade*`, `formatCurrency`
- `_components/InvestimentoList.tsx` — Client, tabs Ativos/Arquivados
- `_components/InvestimentoCard.tsx` — Client, stats resumidas + ProgressBar de meta
- `_components/InvestimentoModal.tsx` — Client, criar/editar com ScopeSelector
- `/investimentos/[id]/page.tsx` — Server Component, query paralela
- `[id]/_components/InvestimentoDetalhe.tsx` — Client, detalhe completo + modais
- `[id]/_components/TransacaoModal.tsx` — Client, aporte/resgate
- `[id]/_components/SnapshotModal.tsx` — Client, atualizar saldo
- `[id]/_components/GraficoEvolucao.tsx` — Client, Recharts LineChart de snapshots

*Cron:* `generate-monthly` estendido com bloco de aportes automáticos idempotente

*Integração Projetos:* `payment_origin='investment'` no `ItemModal`; fluxo `/pagar` cria `investment_transaction` de withdrawal sem lançar no extrato financeiro

*Navbar:* link "Investimentos" com ícone `TrendingUp` no desktop

*Build:* Next.js build sem erros de TypeScript ✅

---

### Sessão 017 — 2026-02-27

**Objetivo:** Implementar Fase 9 — Projetos

**O que foi feito:**

*Migrations:*
- Migration 015 aplicada via Management API: tabelas `projects`, `project_groups`, `project_items` com RLS
- Migration 017 Parte 5 aplicada: `project_items` com colunas `investment_id`, `expected_payment_date`, constraint expandida para `payment_origin='investment'`

*API Routes (7 arquivos):*
- `POST /api/projetos` — criar projeto
- `PATCH /api/projetos/[id]` — editar/mudar status do projeto
- `POST /api/projetos/[id]/grupos` — criar grupo
- `PATCH + DELETE /api/projetos/grupos/[id]` — editar/excluir grupo (cascade items)
- `POST /api/projetos/itens` — criar item (status: considering)
- `PATCH + DELETE /api/projetos/itens/[id]` — editar/confirmar item (soft-cancel)
- `POST /api/projetos/itens/[id]/pagar` — pagar item, gera transações por tipo: cash/card_installment/deposit_remainder

*Pages e Componentes (11 arquivos):*
- `/projetos/page.tsx` — Server Component, busca projetos + itens para calcular stats
- `_components/types.ts` — tipos ProjectWithStats, helpers computeProjectStats, formatCurrency, labels/cores
- `_components/ProjetoList.tsx` — Client, filtros por status (Ativos/Concluídos/Cancelados/Todos), card de totais
- `_components/ProjetoCard.tsx` — Client, card com ProgressBar, menu de ações
- `_components/ProjetoModal.tsx` — Client, criar/editar projeto com DatePicker
- `/projetos/[id]/page.tsx` — Server Component, query paralela de dados
- `[id]/_components/ProjetoDetalhe.tsx` — Client, header + summary cards + lista grupos + banner conclusão
- `[id]/_components/GrupoSection.tsx` — Client, seção expansível de grupo com itens
- `[id]/_components/ItemCard.tsx` — Client, card de item com ações por status
- `[id]/_components/ItemModal.tsx` — Client, criar/editar/confirmar item com campos condicionais por tipo de pagamento
- `[id]/_components/GrupoModal.tsx` — Client, criar/editar grupo

*Navbar:*
- Desktop: adicionado "Projetos" (ícone Target) após "Família"
- Mobile: substituído "Cartões" por "Projetos" (ícone Target)
- Mobile final: Dashboard · Transações · **Projetos** · Orçamento · Família

*Build:* Next.js build sem erros de TypeScript ✅

---

### Sessão 016 — 2026-02-27

**Objetivo:** Revisão abrangente da documentação — sincronizar `regras-de-negocio.md`, `arquitetura.md` e `roadmap.md` com as decisões implementadas nas sessões 005–015

**O que foi feito:**

*`docs/regras-de-negocio.md`:*
- Seção 2: substituído Tremor por Recharts + componentes próprios em `src/components/ui/`
- Seção 2.1 removida (sobre Tremor — obsoleta)
- Seção 3.5.1: adicionados tipos `investment_deposit` e `investment_withdrawal`
- Seção 3.5.2: adicionados campos `family_id`, `scope`, `user_id`, `is_shared`, `investment_id`; regra de compartilhamento automático via `profiles.share_with_partner`
- Seções 3.6, 3.7, 3.8: adicionados campos de escopo (`scope`, `user_id`, `is_shared`, `family_id`) nos campos das tabelas
- Seção 3.9: adicionados campos de escopo; unicidade atualizada para dois índices parciais (migration 019); orçamento documentado como sempre pessoal
- Seção 3.10 (nova): Perfil — `full_name`, `share_with_partner`, tela `/perfil`, avatar de iniciais, logout
- Seção 5: todas as referências a Tremor substituídas por Recharts e componentes próprios; toggle do dashboard documentado com nomes reais ("Gabriel | Heide")
- Seção 6.1: adicionadas tabelas `investments`, `investment_transactions`, `investment_snapshots`
- Seção 8: estrutura de pastas atualizada com rotas em português, sem Tremor, componentes `ui/` reais
- Seção 9: expandida para 12 linhas (Fase 1 a 11 + Fase 1.5), com status de cada fase
- Seção 10.2: modelo de compartilhamento atualizado (toggle global via `share_with_partner`, `is_shared` granular só em cartões)
- Seção 10.3: removido "toggle global no topo"; documentado comportamento por tela
- Seção 10.4: schema `family_contributions` atualizado (`effective_from→date`, `transaction_id FK`); contribuição documentada como movimento real

*`docs/arquitetura.md`:*
- Seção 2.5: substituída decisão Tremor por Recharts com motivo correto
- Seção 3.1: removida referência a "wrappers sobre Tremor"; listados componentes reais de `src/components/ui/`
- Seção 3.3: substituída menção "Tremor Charts" por "Recharts"
- Seção 7.3: atualizada para refletir `is_shared` próprio em transactions (migration 022); visibilidade não herdada de entidade-pai
- Seção 7.4: schema `family_contributions` atualizado; contribuição documentada como movimento real
- Timestamp: `2026-02-25` → `2026-02-27`

*`docs/roadmap.md`:*
- Fase 6: item de toggle "Orçamento pessoal e familiar separados" marcado com nota de remoção (Sessão 013)

**Decisões tomadas:**
- Revisão de documentação tratada como sessão própria (016) para rastreabilidade

**Problemas encontrados:**
- Nenhum (apenas escrita/edição de markdown)

**Próxima sessão:**
- Iniciar Fase 9: Projetos (rodar migration 015 e depois 017 Parte 5 no Supabase antes de iniciar)

---

### Sessão 015 — 2026-02-27

**Objetivo:** Navbar mobile glassmorphism + organização de commits acumulados das sessões 006–014

**O que foi feito:**

*Navbar mobile — glassmorphism:*
- `Navbar.tsx` — container mobile: `fixed bottom-5 left-4 right-4`, `bg-white/60 backdrop-blur-xl`, `rounded-2xl`, `shadow-lg shadow-black/10`, `border border-white/50`; item ativo: `bg-white/80 rounded-xl text-blue-600`
- `layout.tsx` — `pb-24` → `pb-32` para compensar altura flutuante

*Organização de commits:*
- 8 commits atômicos criados organizando todo o trabalho das sessões 006–014 que havia ficado sem commit
- Push realizado; build do Vercel restaurado (estava falhando por imports de arquivos não comitados)

*Documentação:*
- Sessões 013, 014 e 015 criadas retroativamente em `docs/sessoes/`
- `padroes.md` atualizado (seção 2.2 Navbar)
- `roadmap.md`, `session-start-prompt.md`, `diario-dev.md` atualizados

**Decisões tomadas:**
- `bottom-5 left-4 right-4` em vez de `bottom-0 left-0 right-0`: navbar flutuante é padrão visual mais moderno e exibe o conteúdo passando "atrás" do glass
- `pb-32` no layout: margem generosa para evitar sobreposição mesmo com scroll bounce no iOS

**Problemas encontrados:**
- Vercel build falhava: código comitado (ex: `dashboard/page.tsx`) importava diretórios nunca comitados (ex: `dashboard/_components/`) — resolvido comitando tudo em lote organizado

**Próxima sessão:**
- Iniciar Fase 9: Projetos (rodar migration 015 e depois 017 Parte 5 no Supabase antes de iniciar)

---

### Sessão 014 — 2026-02-27

**Objetivo:** Corrigir dois bugs pós-Sessão 013: cartão do parceiro visível em /cartoes e transações do parceiro ausentes no dashboard/transações

**O que foi feito:**

*Data fix (via Management API, sem migration):*
- `UPDATE credit_cards SET is_shared = false WHERE id = '55a19975-2ce2-49d1-997f-8b15f597d96d'` — cartão "Itaú Click" de Gabriel estava com `is_shared = true`, tornando-o visível para Heide pela RLS. Corrigido diretamente no banco.

*Migration 022 (`supabase/migrations/022_transactions_is_shared.sql`):*
- **Passo A**: `ALTER TABLE transactions ADD COLUMN is_shared BOOLEAN NOT NULL DEFAULT FALSE`
- **Passo B**: Backfill — 11 transações pessoais marcadas como `is_shared = true` para usuários com `share_with_partner = true`
- **Passo C**: Recriação da policy `scoped_select` em `transactions` com nova cláusula: `scope = 'personal' AND is_shared = true AND family_id = auth_family_id() AND user_id <> auth.uid()` — permite que o parceiro leia transações pessoais compartilhadas do usuário logado

**Decisões tomadas:**
- Nenhuma mudança de frontend necessária — queries em `dashboard/page.tsx` e `transacoes/page.tsx` já filtravam por `is_shared = true` corretamente; faltavam apenas a coluna e a cláusula RLS no banco
- Data fix executado via SQL direto (sem migration) pois é correção pontual de dado, não de schema

**Problemas encontrados:**
- `transactions.is_shared` não existia no banco apesar de estar nos tipos TypeScript e nas queries frontend — bug de implementação da Sessão 013 (campo foi adicionado ao tipo mas não ao schema)
- Cartão "Itaú Click" com `is_shared = true` herdado de criação anterior ao fix do CartaoModal

**Próxima sessão:**
- Iniciar Fase 9: Projetos (rodar migration 015 no Supabase antes de iniciar)

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
- Criado repositório GitHub privado `gabrielbrandao-atus/heid`
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
