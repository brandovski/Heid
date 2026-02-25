# Couple — Roadmap de Desenvolvimento

> Legenda de status: `[ ]` Não iniciado · `[~]` Em progresso · `[x]` Concluído · `[-]` Bloqueado

---

## Fase 1 — Setup Inicial

**Objetivo:** projeto rodando localmente com banco configurado e autenticação funcionando.

- [ ] Criar projeto Next.js 14+ com TypeScript e App Router
- [ ] Configurar Tailwind CSS
- [ ] Instalar e configurar Tremor
- [ ] Criar projeto no Supabase
- [ ] Escrever e aplicar migrations iniciais (todas as tabelas)
- [ ] Configurar RLS em todas as tabelas
- [ ] Rodar seed com categorias padrão
- [ ] Cadastrar os dois usuários manualmente no Supabase Auth
- [ ] Desabilitar cadastro público no Supabase Auth
- [ ] Implementar página de login com Supabase Auth
- [ ] Implementar middleware de proteção de rotas (redirect para login)
- [ ] Configurar variáveis de ambiente (`.env.local`)
- [ ] Deploy inicial na Vercel (apenas para validar pipeline)

**Critério de conclusão:** login funciona, sessão é mantida, rotas protegidas redirecionam corretamente.

---

## Fase 2 — CRUD Base

**Objetivo:** usuário consegue cadastrar e gerenciar as entidades fundamentais do sistema.

### Categorias
- [ ] Listagem de categorias
- [ ] Criar categoria (nome, ícone, cor)
- [ ] Editar categoria
- [ ] Arquivar categoria (soft delete — não permitir exclusão com vínculos)

### Cartões de Crédito
- [ ] Listagem de cartões
- [ ] Criar cartão (nome, bandeira, closing_day, due_day, limite, últimos 4 dígitos, cor)
- [ ] Editar cartão
- [ ] Desativar cartão (is_active = false)

### Receitas Fixas
- [ ] Listagem de receitas fixas
- [ ] Criar receita fixa
- [ ] Editar receita fixa
- [ ] Ativar / desativar receita fixa

### Despesas Fixas
- [ ] Listagem de despesas fixas
- [ ] Criar despesa fixa (com vínculo opcional a cartão)
- [ ] Editar despesa fixa
- [ ] Ativar / desativar despesa fixa

**Critério de conclusão:** todas as entidades base podem ser criadas, editadas e desativadas sem erros.

---

## Fase 3 — Transações Manuais

**Objetivo:** usuário consegue lançar, visualizar e gerenciar transações avulsas.

- [ ] Listagem de transações com filtros (mês, tipo, status, categoria)
- [ ] Criar transação de receita avulsa (`income`)
- [ ] Criar transação de despesa avulsa (`expense`)
- [ ] Marcar transação como `paid` (com data de pagamento opcional)
- [ ] Marcar transação como `cancelled`
- [ ] Editar transação lançada manualmente
- [ ] Excluir transação (somente manuais; automáticas apenas cancelam)
- [ ] Distinção visual de status (`pending` / `paid` / `cancelled`) com badges

**Critério de conclusão:** fluxo completo de lançamento e gestão de status funciona para transações manuais.

---

## Fase 4 — Parcelamentos e Assinaturas

**Objetivo:** usuário consegue cadastrar compras parceladas e assinaturas recorrentes.

### Parcelamentos
- [ ] Cadastrar compra parcelada (total, nº parcelas, data da primeira parcela, cartão, categoria)
- [ ] Geração automática das N transações do tipo `installment` ao cadastrar
- [ ] Listagem de grupos de parcelamento com status das parcelas
- [ ] Cancelar parcelas restantes de um grupo

### Assinaturas
- [ ] Listagem de assinaturas ativas
- [ ] Cadastrar assinatura (nome, moeda, valor, dia de cobrança, cartão, categoria)
- [ ] Editar assinatura
- [ ] Cancelar assinatura (`cancelled_at = now()`, `is_active = false`)
- [ ] Integração com AwesomeAPI para cotação USD→BRL
- [ ] Lógica de fallback quando a API de câmbio estiver indisponível

**Critério de conclusão:** parcelamentos geram transações corretamente; assinaturas em USD convertem com cotação real.

---

## Fase 5 — Cron Jobs

**Objetivo:** automações mensais funcionam de forma confiável e idempotente.

- [ ] Implementar cron `fetch-exchange-rate` (dia 1, 05:30) — busca e armazena cotação do dia
- [ ] Implementar cron `generate-monthly` (dia 1, 06:00) — gera transações de fixas e assinaturas
- [ ] Garantir idempotência em ambos os jobs (verificar existência antes de inserir)
- [ ] Implementar cron `supabase-keepalive` (a cada 3 dias)
- [ ] Configurar `vercel.json` com os schedules dos crons
- [ ] Testar geração manual via chamada direta ao endpoint
- [ ] Validar tratamento de erros e log de execução

**Critério de conclusão:** ao acionar manualmente o cron, transações do mês são geradas corretamente e sem duplicatas.

---

## Fase 6 — Orçamento Mensal

**Objetivo:** usuário consegue definir e acompanhar o orçamento por categoria.

- [ ] Listagem do orçamento do mês corrente com barra de progresso (Tremor `<ProgressBar />`)
- [ ] Detectar ausência de orçamento no mês e exibir modal de criação
- [ ] Implementar opção "Clonar do mês anterior"
- [ ] Implementar opção "Criar do zero"
- [ ] Adicionar categoria ao orçamento do mês
- [ ] Editar valor planejado de uma categoria
- [ ] Remover categoria do orçamento do mês
- [ ] Cálculo correto de gasto realizado vs. comprometido vs. planejado
- [ ] Destaque visual para categorias acima do limite (cor vermelha)
- [ ] Navegação entre meses

**Critério de conclusão:** orçamento do mês é criado, clonado e acompanhado com barras de progresso corretas.

---

## Fase 7 — Dashboard

**Objetivo:** tela principal consolidada com visão financeira completa do mês.

- [ ] Cards de resumo: Receitas, Despesas, Saldo realizado, A receber, A pagar
- [ ] Gráfico de evolução dos últimos 6 meses (`<AreaChart />`)
- [ ] Gráfico de distribuição por categoria (`<DonutChart />`)
- [ ] Seção de orçamento por categoria com `<ProgressBar />`
- [ ] Cards de faturas por cartão com status e botão de pagamento
- [ ] Modal de registro de pagamento de fatura (total ou parcial)
- [ ] Tabela de próximos lançamentos (próximos 7–10 `pending`)
- [ ] Navegação entre meses no dashboard
- [ ] Loading states e tratamento de erros em todos os componentes

**Critério de conclusão:** dashboard exibe todos os dados corretamente para o mês corrente e meses anteriores.

---

## Backlog (pós v1.0)

Funcionalidades consideradas mas fora do escopo inicial:

- Relatórios e exportação (PDF / CSV)
- Filtros avançados na listagem de transações
- Notificações (e-mail / push) para vencimentos próximos
- Modo escuro
- App mobile (PWA ou React Native)
- Importação de extrato bancário (OFX / CSV)
- Múltiplas moedas além de USD

---

*Atualizado em: 2026-02-25*
