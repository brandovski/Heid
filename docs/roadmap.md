# Couple — Roadmap de Desenvolvimento

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

- [x] Listagem do orçamento do mês com barra de progresso (`<ProgressBar />`)
- [x] Orçamento pessoal e familiar separados (toggle)
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

- [x] Tela `/familia` com toggle Pessoal | Familiar na navegação principal
- [x] Configuração de contribuição mensal (cada usuário define o seu valor no Caixa Familiar)
- [x] Exibição do Caixa Familiar: contribuição de cada um + total disponível + saldo livre
- [x] Visão de despesas familiares do mês (scope = 'family')
- [x] Visualização de itens pessoais compartilhados pelo parceiro (is_shared = true, somente leitura)
- [x] Indicação clara de quem é dono de cada item pessoal compartilhado

**Critério de conclusão:** cada usuário vê sua visão pessoal e a visão familiar, com o Caixa Familiar calculado corretamente. ✅ **Concluído em 2026-02-26**

---

## Fase 8 — Dashboard

**Objetivo:** tela principal consolidada com visão financeira completa do mês.

- [ ] Cards de resumo: Receitas, Despesas, Saldo realizado, A receber, A pagar
- [ ] Toggle Pessoal | Familiar nos cards de resumo
- [ ] Gráfico de evolução dos últimos 6 meses (`<AreaChart />`)
- [ ] Gráfico de distribuição por categoria (`<DonutChart />`)
- [ ] Seção de orçamento por categoria com `<ProgressBar />`
- [ ] Cards de faturas por cartão com status e botão de pagamento
- [ ] Modal de registro de pagamento de fatura
- [ ] Tabela de próximos lançamentos (próximos 7–10 `pending`)
- [ ] Navegação entre meses no dashboard
- [ ] Loading states e tratamento de erros em todos os componentes

**Critério de conclusão:** dashboard exibe todos os dados corretamente para o mês corrente e meses anteriores.

---

## Fase 9 — Projetos

**Objetivo:** módulo de planejamento de compras/projetos com orçamento e rastreamento de pagamentos.

- [ ] Listar projetos (pessoais e familiares) com status e progresso de orçamento
- [ ] Criar projeto (nome, descrição, budget total, data alvo, escopo)
- [ ] Editar projeto / marcar como concluído ou cancelado
- [ ] Criar grupos dentro de um projeto
- [ ] Criar itens dentro de um grupo com tipo de pagamento:
  - `cash`: origem (Parceiro 1 / Parceiro 2 / Caixa Familiar) + método (débito/pix/dinheiro/transferência)
  - `card_installment`: cartão + nº de parcelas
  - `deposit_remainder`: valor do sinal + data do restante
- [ ] Confirmar item (status → `confirmed`) com definição do valor real
- [ ] Gerar transação(ões) ao confirmar pagamento (status → `paid`)
- [ ] Painel de resumo do projeto:
  - Total orçado vs. total real
  - Quanto foi pago vs. pendente
  - Estimativa de sobra/estouro do budget

**Critério de conclusão:** projeto completo funciona do planejamento ao pagamento, com transações geradas corretamente.

---

## Fase 10 — Investimentos

**Objetivo:** usuário consegue criar, acompanhar e projetar investimentos, com integração ao módulo de projetos.

### Schema (migrations)
- [x] Migration 017: tabelas `investments`, `investment_transactions`, `investment_snapshots`; alterações em `project_items` (migration 017 — criada em 2026-02-25)
- [ ] Migration 018: adicionar `investment_id` em `transactions`; atualizar `scoped_select` (diferida — rodar no início desta fase)

### CRUD de Investimentos
- [ ] Listar investimentos (pessoais e familiares) com saldo atual e rentabilidade
- [ ] Criar investimento (tipo, escopo, meta, aporte mensal, elegibilidade para projetos)
- [ ] Editar investimento
- [ ] Arquivar investimento (`is_active = false`)

### Aportes e Resgates
- [ ] Registrar aporte manual (`investment_transaction` tipo `deposit`)
- [ ] Registrar resgate manual (`investment_transaction` tipo `withdrawal`)
- [ ] Visualizar histórico de aportes/resgates com totais

### Snapshots de Saldo
- [ ] Registrar saldo de mercado atual (cria novo snapshot)
- [ ] Exibir histórico de snapshots com gráfico de evolução

### Cálculos e Projeções
- [ ] Exibir: total aportado, rentabilidade R$, rentabilidade %
- [ ] Projeção conservadora (sem retorno)
- [ ] Projeção com retorno (baseada no último retorno mensal)

### Integração com Projetos
- [ ] Exibir investimentos elegíveis como opção de pagamento em itens de projeto
- [ ] Exibir total comprometido com projetos confirmados na tela do investimento

### Automação (extensão do cron `generate-monthly`)
- [ ] Gerar aporte automático mensal para investimentos com `monthly_contribution_amount`
- [ ] Garantir idempotência via índice único `idx_inv_tx_auto_month`

**Critério de conclusão:** usuário consegue acompanhar todos os investimentos com saldo atualizado, projeção de crescimento e integração com projetos.

---

## Fase 11 — Fluxo Futuro / Calendário Financeiro

**Objetivo:** visualização temporal de todos os compromissos financeiros futuros — transações, aportes, vencimentos de projetos.

- [ ] Tela de calendário / linha do tempo mensal
- [ ] Exibir lançamentos pendentes (`status = pending`) ordenados por data
- [ ] Exibir aportes mensais de investimentos previstos
- [ ] Exibir `expected_payment_date` de itens de projeto confirmados
- [ ] Indicação visual de saldo projetado dia a dia
- [ ] Filtro por escopo (Pessoal / Familiar / Tudo)

**Critério de conclusão:** usuário consegue ver todos os compromissos financeiros do mês em uma única tela com saldo projetado.

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

*Atualizado em: 2026-02-25*
