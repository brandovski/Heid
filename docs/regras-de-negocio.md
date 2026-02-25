# Couple
## Plataforma Pessoal de Gestão Financeira
### Documento de Regras de Negócio — v1.0

---

## 1. Visão Geral do Projeto

O **Couple** é uma aplicação web pessoal desenvolvida para dois usuários (casal), com o objetivo de substituir o gerenciamento financeiro feito no Notion. A plataforma oferece controle de orçamento por categoria, gestão de cartões de crédito (compras únicas, parcelamentos e assinaturas), acompanhamento de movimentações mensais com lançamentos futuros, e um dashboard visual consolidado.

### 1.1 Objetivos Principais

- Dashboard funcional com visão consolidada das finanças do mês
- Controle de faturas de cartão de crédito com suporte a compras únicas, parcelamentos e assinaturas recorrentes
- Orçamento mensal por categoria com clonagem automática do mês anterior
- Lançamentos futuros visíveis com status **"A Pagar"** / **"A Receber"**, gerados a partir de receitas e despesas fixas cadastradas
- Acesso seguro e exclusivo para os dois usuários do casal

### 1.2 Escopo Inicial (v1.0)

- Autenticação com dois usuários fixos (sem cadastro público)
- CRUD de categorias, cartões de crédito, receitas fixas e despesas fixas
- Lançamento manual de transações avulsas
- Geração automática de transações futuras a partir de entradas fixas e assinaturas
- Orçamento mensal por categoria com clonagem do mês anterior
- Fatura mensal por cartão com controle de pagamento e status
- Dashboard com resumo financeiro do mês

---

## 2. Stack Tecnológica

| Camada | Tecnologia / Serviço |
|---|---|
| Frontend | Next.js 14+ (App Router) com TypeScript |
| Estilização | Tailwind CSS |
| Gráficos / UI | **Tremor** |
| Backend / API | Next.js API Routes (TypeScript) |
| Banco de Dados | Supabase (PostgreSQL gerenciado) |
| Autenticação | Supabase Auth (e-mail + senha) |
| Segurança de dados | Row Level Security (RLS) no Postgres |
| Hospedagem Frontend | Vercel (gratuito) |
| Hospedagem BD + Auth | Supabase (plano Free ou Pro ~$25/mês) |
| Cron Jobs | Vercel Cron Functions (gratuito) |
| Câmbio (USD→BRL) | AwesomeAPI (gratuita, sem autenticação) |

### 2.1 Sobre o Tremor

O Tremor é a biblioteca de componentes escolhida para dashboards e gráficos. Componentes utilizados no projeto:

- `<AreaChart />` — evolução de receitas e despesas nos últimos 6 meses
- `<BarChart />` — comparativo mensal de categorias
- `<DonutChart />` — distribuição de gastos por categoria
- `<ProgressBar />` — acompanhamento de orçamento por categoria
- `<Card />`, `<Metric />`, `<Text />`, `<Badge />` — cards de resumo do dashboard
- `<Table />` — listagem de transações e faturas

---

## 3. Módulos do Sistema

### 3.1 Autenticação e Controle de Acesso

O sistema possui exatamente dois usuários cadastrados manualmente no Supabase. O cadastro público de novos usuários é desabilitado nas configurações do Supabase Auth. O login é feito via e-mail e senha.

- **Row Level Security (RLS):** toda tabela no banco possui políticas RLS ativas, garantindo que um usuário só acesse os próprios dados, mesmo que a API seja comprometida
- **Sessão:** gerenciada pelo Supabase Auth com JWT; o frontend valida o token em cada requisição
- **Dados compartilhados:** como os dois usuários gerenciam finanças em conjunto, as tabelas principais (cartões, categorias, orçamentos, transações) são compartilhadas entre os dois via política RLS de "família" — um campo `family_id` fixo vincula os dois usuários

---

### 3.2 Categorias

Categorias são a base do sistema de orçamento e classificação de transações. São customizáveis e gerenciadas pelos usuários.

**Campos:** `id`, `name`, `icon` (emoji ou identificador), `color` (hex), `created_at`

**Regras:**
- Não é possível excluir uma categoria que possua transações ou orçamentos vinculados; o sistema sugere arquivar
- O sistema pré-carrega um conjunto inicial de categorias: Alimentação, Transporte, Moradia, Saúde, Lazer, Educação, Vestuário, Outros

---

### 3.3 Receitas Fixas

Receitas fixas são entradas financeiras recorrentes com valor e dia de recebimento definidos. Servem como template para geração automática de transações futuras todo mês.

**Campos:** `id`, `description`, `amount` (BRL), `day_of_month` (1–31), `category_id`, `is_active`, `start_date`, `end_date` (nullable), `notes`

**Regras:**
- **Geração automática:** um cron job roda no dia 1 de cada mês e cria uma transação para cada receita fixa ativa, com data definida pelo `day_of_month` do mês corrente e status `pending` ("A Receber")
- **Dia inválido no mês:** se `day_of_month` é 31 e o mês tem 30 dias, usa-se o último dia do mês
- **Exemplo de uso:** salário recebido todo dia 5, freelance recorrente todo dia 15

---

### 3.4 Despesas Fixas

Despesas fixas são saídas financeiras recorrentes com valor e dia de vencimento definidos. São mantidas em tabela separada das receitas fixas por possuírem campos e comportamentos distintos.

**Campos:** `id`, `description`, `amount` (BRL), `day_of_month` (1–31), `category_id`, `is_active`, `start_date`, `end_date` (nullable), `notes`, `payment_method` (`account` ou `credit_card`), `credit_card_id` (nullable)

**Regras:**
- **Geração automática:** mesma lógica das receitas fixas — cron job no dia 1 cria uma transação para cada despesa fixa ativa com status `pending` ("A Pagar")
- **Vinculação ao cartão:** quando `payment_method` é `credit_card`, a transação gerada é vinculada ao cartão informado e entra na fatura correspondente
- **Exemplo de uso:** aluguel todo dia 10, academia todo dia 1, conta de luz dia 20

---

### 3.5 Transações

Transações representam toda e qualquer movimentação financeira registrada na plataforma, seja gerada automaticamente ou lançada manualmente.

#### 3.5.1 Tipos de Transação

| Tipo | Origem | Descrição |
|---|---|---|
| `income` | Manual | Receita avulsa: salário extra, freelance pontual, etc. |
| `expense` | Manual | Despesa avulsa paga em conta corrente |
| `installment` | Manual | Parcela de compra parcelada no cartão |
| `subscription` | Automática (cron) | Assinatura recorrente no cartão |
| `fixed_income` | Automática (cron) | Gerada a partir de uma Receita Fixa |
| `fixed_expense` | Automática (cron) | Gerada a partir de uma Despesa Fixa |

#### 3.5.2 Campos da Transação

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único |
| `description` | string | Texto livre |
| `amount` | numeric | Valor em BRL |
| `date` | date | Data de competência |
| `type` | enum | `income \| expense \| installment \| subscription \| fixed_income \| fixed_expense` |
| `status` | enum | `pending \| paid \| cancelled` |
| `category_id` | UUID (FK) | Referência à categoria |
| `credit_card_id` | UUID (FK, nullable) | Preenchido para transações no cartão |
| `installment_group_id` | UUID (FK, nullable) | Agrupa parcelas de uma mesma compra |
| `subscription_id` | UUID (FK, nullable) | Referencia a assinatura geradora |
| `fixed_income_id` | UUID (FK, nullable) | Referencia a receita fixa geradora |
| `fixed_expense_id` | UUID (FK, nullable) | Referencia a despesa fixa geradora |
| `exchange_rate` | numeric (nullable) | Cotação usada na conversão (assinaturas em moeda estrangeira) |
| `original_amount` | numeric (nullable) | Valor na moeda original |
| `original_currency` | string (nullable) | Ex: `USD` |
| `exchange_estimated` | boolean | `true` se a cotação veio de fallback (API indisponível) |
| `auto_generated` | boolean | `true` para transações criadas pelo cron job |
| `notes` | string (nullable) | Observações livres |
| `created_at` | timestamp | Auditoria |
| `updated_at` | timestamp | Auditoria |

#### 3.5.3 Status e Visualização de Lançamentos Futuros

Toda transação com `date` no futuro (maior que a data atual) é criada com status `pending` automaticamente, independentemente de ser receita ou despesa.

| Status | Significado | Exibição visual |
|---|---|---|
| `pending` | Lançamento futuro ou aguardando pagamento | Badge amarelo/laranja — "A Pagar" (despesa) ou "A Receber" (receita) |
| `paid` | Realizado / pago | Badge verde — exibe data de pagamento efetivo |
| `cancelled` | Cancelado | Badge cinza — mantido no histórico, não contabilizado nos totais |

**Regras:**
- A listagem de transações exibe sempre lançamentos realizados **e** futuros, distinguidos visualmente pelo status
- O usuário pode marcar um lançamento `pending` como `paid` diretamente pela listagem ou pelo card da fatura, informando opcionalmente a data real de pagamento (que pode diferir da data de competência)
- Transações `cancelled` não entram em nenhum cálculo de totais ou orçamento

---

### 3.6 Cartões de Crédito

**Campos:** `id`, `name`, `brand` (Visa, Mastercard, etc.), `closing_day` (dia de fechamento), `due_day` (dia de vencimento), `credit_limit`, `last_four_digits`, `color` (identificação visual), `is_active`

#### 3.6.1 Cálculo da Fatura

A fatura de um cartão para um determinado mês de referência (`YYYY-MM`) é calculada somando todas as transações vinculadas ao cartão cuja data de competência cai no **período de competência** da fatura: do dia seguinte ao fechamento do mês anterior até o dia de fechamento do mês de referência.

> **Exemplo:** cartão com `closing_day = 10` — a fatura de março agrupa transações de 11/fev até 10/mar.

- A fatura **não é uma entidade persistida**; é calculada dinamicamente via query
- Apenas o registro de pagamento é persistido na tabela `invoice_payments`

#### 3.6.2 Pagamento de Fatura

**Tabela `invoice_payments`:** `id`, `credit_card_id`, `reference_month` (YYYY-MM), `amount_paid`, `paid_at`, `notes`

**Regras:**
- Ao registrar um pagamento, todas as transações `pending` vinculadas àquela fatura têm o status atualizado automaticamente para `paid`
- **Pagamento parcial:** é possível pagar um valor diferente do total da fatura; o sistema registra o valor pago e exibe a diferença como "saldo devedor"
- A fatura é considerada **"Em Aberto"** enquanto não houver registro em `invoice_payments` para aquele cartão e mês de referência

---

### 3.7 Assinaturas

Assinaturas são cobranças recorrentes mensais vinculadas a um cartão de crédito. Não possuem data de término definida e não consomem limite além do valor mensal cobrado.

**Campos:** `id`, `name`, `amount_brl` (último valor convertido em BRL), `original_currency` (`BRL` ou `USD`), `amount_original` (valor na moeda original), `billing_day` (dia de cobrança), `credit_card_id`, `category_id`, `start_date`, `cancelled_at` (nullable), `notes`, `is_active`

#### 3.7.1 Assinaturas em Moeda Estrangeira

Para assinaturas com `original_currency = USD`, o sistema busca a cotação do dia na **AwesomeAPI** no momento de gerar a transação mensal. O valor convertido e a cotação são armazenados na transação para rastreabilidade histórica.

- **Fallback:** se a AwesomeAPI estiver indisponível, usa-se o último `amount_brl` registrado e a transação recebe `exchange_estimated = true`
- O campo `amount_brl` é atualizado a cada nova geração mensal bem-sucedida com a cotação do dia

#### 3.7.2 Geração Automática

O cron job do dia 1 verifica todas as assinaturas ativas (`is_active = true` e `cancelled_at IS NULL`) e cria uma transação do tipo `subscription` para cada uma, com:
- `date` = `billing_day` do mês corrente
- `status` = `pending`
- `auto_generated` = `true`

---

### 3.8 Parcelamentos

**Tabela `installment_groups`:** `id`, `description`, `total_amount`, `installments_count`, `first_installment_date`, `credit_card_id`, `category_id`, `notes`

**Regras:**
- Ao cadastrar um parcelamento, o sistema cria automaticamente `N` transações do tipo `installment`, uma por mês a partir de `first_installment_date`, com `amount = total_amount / installments_count`
- Parcelas com `date` no futuro são criadas com `status = pending`; parcelas passadas ou do mês atual com `status = pending` aguardam o pagamento da fatura
- **Cancelamento:** é possível cancelar as parcelas restantes de um grupo, alterando o status das transações futuras para `cancelled`
- O grupo (`installment_groups`) não é excluído ao cancelar — mantém histórico das parcelas já pagas

---

### 3.9 Orçamento Mensal

**Tabela `budgets`:** `id`, `reference_month` (YYYY-MM), `category_id`, `planned_amount`, `notes`

**Regra de unicidade:** não é possível ter dois orçamentos para a mesma categoria no mesmo mês (`UNIQUE(reference_month, category_id)`).

#### 3.9.1 Criação do Orçamento Mensal

No primeiro acesso a um mês sem orçamento cadastrado, o sistema detecta a ausência e exibe um modal com duas opções:

1. **Clonar do mês anterior:** copia todos os registros de `budgets` do mês anterior para o mês atual com os mesmos `planned_amount`; o usuário pode editar individualmente após a clonagem
2. **Criar do zero:** abre formulário para adicionar categorias e valores manualmente

Após a criação inicial, adicionar uma nova categoria ao orçamento é feito diretamente na tela de orçamento, sem necessidade de configurações adicionais.

#### 3.9.2 Acompanhamento do Orçamento

Para cada categoria do orçamento do mês corrente, o sistema exibe via `<ProgressBar />` do Tremor:

| Métrica | Cálculo |
|---|---|
| Valor planejado | `planned_amount` do orçamento |
| Valor gasto | Soma de transações `paid` da categoria no mês |
| Valor comprometido | Soma de transações `pending` da categoria no mês |
| Progresso | `(gasto + comprometido) / planejado × 100` |

Categorias que ultrapassaram o orçamento são destacadas em vermelho (`color="red"` no Tremor).

---

## 4. Automações e Cron Jobs

Todas as automações são implementadas como **Vercel Cron Functions** (gratuito). Todos os jobs são **idempotentes**: verificam se a transação do tipo, mês e origem já existe antes de criar, evitando duplicatas.

| Job | Frequência | Ação |
|---|---|---|
| `generate-monthly` | Dia 1 de cada mês, 06:00 | Gera transações de receitas fixas, despesas fixas e assinaturas ativas para o mês corrente |
| `fetch-exchange-rate` | Dia 1 de cada mês, 05:30 | Busca cotação USD→BRL na AwesomeAPI e armazena em cache no banco para uso na geração mensal |
| `supabase-keepalive` | A cada 3 dias | Faz uma query simples para evitar que o projeto Supabase Free entre em modo inativo |

**Ordem de execução no dia 1:** `fetch-exchange-rate` (05:30) → `generate-monthly` (06:00), garantindo que a cotação esteja disponível quando as assinaturas forem processadas.

---

## 5. Dashboard

O dashboard é a tela principal do sistema e apresenta uma visão consolidada das finanças do mês corrente, com navegação para meses anteriores.

### 5.1 Cards de Resumo — `<Card />` + `<Metric />` (Tremor)

| Card | Cálculo |
|---|---|
| Receitas do mês | Soma de transações `income` e `fixed_income` com `status = paid` no mês |
| Despesas do mês | Soma de transações de despesa com `status = paid` no mês |
| Saldo realizado | Receitas pagas − Despesas pagas |
| A receber | Soma de transações de receita com `status = pending` no mês |
| A pagar | Soma de transações de despesa com `status = pending` no mês |

### 5.2 Gráfico de Evolução — `<AreaChart />` (Tremor)

Exibe receitas e despesas dos últimos 6 meses para visualização de tendência. Dados: `[{ month, income, expense }]`.

### 5.3 Distribuição por Categoria — `<DonutChart />` (Tremor)

Distribuição percentual dos gastos do mês por categoria. Exibido ao lado dos cards de resumo.

### 5.4 Orçamento por Categoria — `<ProgressBar />` (Tremor)

Lista de todas as categorias com orçamento no mês, exibindo `planned_amount`, valor gasto, valor comprometido e barra de progresso. Categorias acima do limite em vermelho.

### 5.5 Faturas dos Cartões — `<Card />` (Tremor)

Um card por cartão ativo exibindo:
- Nome e bandeira do cartão
- Valor total da fatura do mês (calculado dinamicamente)
- Data de vencimento
- Status com `<Badge />`: `Em Aberto` (amarelo) / `Paga` (verde) / `Vencida` (vermelho)
- Botão de ação rápida: **"Registrar Pagamento"**

### 5.6 Próximos Lançamentos — `<Table />` (Tremor)

Lista dos próximos 7 a 10 lançamentos com `status = pending`, ordenados por `date` ascendente, exibindo descrição, categoria, valor e data prevista.

---

## 6. Modelagem do Banco de Dados

### 6.1 Tabelas

| Tabela | Descrição |
|---|---|
| `profiles` | Extensão do `auth.users` do Supabase com `family_id` para vincular o casal |
| `categories` | Categorias globais compartilhadas entre os dois usuários |
| `credit_cards` | Cartões de crédito (pessoais ou compartilhados) |
| `fixed_incomes` | Receitas fixas recorrentes |
| `fixed_expenses` | Despesas fixas recorrentes |
| `subscriptions` | Assinaturas recorrentes no cartão |
| `installment_groups` | Agrupador de parcelas de compras parceladas |
| `transactions` | Todas as movimentações financeiras |
| `budgets` | Orçamento mensal por categoria |
| `invoice_payments` | Registros de pagamento de faturas de cartão |
| `family_contributions` | Contribuições mensais de cada usuário ao caixa familiar |
| `projects` | Projetos do casal (viagem, casamento, compras maiores etc.) |
| `project_groups` | Grupos/categorias de gastos dentro de um projeto |
| `project_items` | Itens a considerar dentro de cada grupo do projeto |

### 6.2 Políticas de RLS

Com a introdução do escopo (ver Módulo 10), as políticas RLS passam a considerar duas dimensões:

- **Dados de família** (`scope = 'family'`): acessíveis por ambos os membros via `family_id`
- **Dados pessoais** (`scope = 'personal'`): acessíveis apenas pelo dono via `user_id = auth.uid()`
- **Dados pessoais compartilhados** (`scope = 'personal'` + `is_shared = true`): SELECT permitido ao parceiro da mesma família; INSERT/UPDATE/DELETE apenas pelo dono

```sql
-- Exemplo: política de leitura com escopo
CREATE POLICY "scoped_select" ON credit_cards FOR SELECT USING (
  (scope = 'family'   AND family_id = auth_family_id()) OR
  (scope = 'personal' AND user_id   = auth.uid())       OR
  (scope = 'personal' AND is_shared = true AND family_id = auth_family_id())
);

-- Exemplo: política de escrita (apenas dono ou família)
CREATE POLICY "scoped_modify" ON credit_cards FOR ALL USING (
  (scope = 'family'   AND family_id = auth_family_id()) OR
  (scope = 'personal' AND user_id   = auth.uid())
);
```

---

## 7. Regras de Negócio Gerais

- **Moeda base:** todo valor armazenado no banco é em BRL. Valores em outras moedas são convertidos no momento da geração da transação e o câmbio é registrado junto
- **Datas:** todas as datas são armazenadas em UTC no banco; a exibição é convertida para `America/Sao_Paulo` no frontend
- **Exclusão lógica:** registros principais (cartões, categorias, entradas fixas, assinaturas) nunca são deletados fisicamente — possuem `is_active` ou `cancelled_at` para desativação
- **Transações geradas automaticamente:** possuem `auto_generated = true` para distinção das lançadas manualmente; podem ser editadas manualmente após geração
- **Totais do mês:** sempre calculados dinamicamente via query, nunca armazenados como cache no banco
- **Período de competência vs. data de pagamento:** o sistema distingue a `date` (quando o gasto ocorreu) da data de pagamento efetivo (`paid_at`); relatórios usam `date` por padrão
- **Idempotência dos cron jobs:** antes de criar qualquer transação, o job verifica existência de registro com mesmo `type`, `date` de referência e `source_id` (FK para a origem)

---

## 8. Estrutura de Pastas do Projeto

```
couple/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (app)/
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── cards/
│   │   │   └── [id]/           # Detalhe da fatura de um cartão
│   │   ├── budget/
│   │   ├── fixed/
│   │   │   ├── incomes/
│   │   │   └── expenses/
│   │   ├── subscriptions/
│   │   ├── family/             # Visão e orçamento familiar
│   │   ├── projects/           # Lista de projetos
│   │   │   └── [id]/           # Detalhe de um projeto
│   │   └── settings/
│   │       └── categories/
│   └── api/
│       ├── transactions/
│       ├── cards/
│       ├── budget/
│       ├── fixed/
│       ├── subscriptions/
│       ├── family/
│       ├── projects/
│       └── cron/
│           ├── generate-monthly/
│           ├── fetch-exchange-rate/
│           └── keepalive/
├── components/
│   ├── ui/                  # Componentes base (wrappers do Tremor)
│   ├── dashboard/
│   ├── transactions/
│   ├── cards/
│   ├── budget/
│   ├── family/
│   └── projects/
├── lib/
│   ├── supabase/            # Client + server client
│   ├── utils/
│   │   ├── currency.ts      # Formatação BRL, conversão câmbio
│   │   ├── date.ts          # Helpers de data / fuso horário
│   │   └── invoice.ts       # Cálculo de período de competência de fatura
│   └── api/
│       └── exchange.ts      # Integração AwesomeAPI
├── hooks/
├── types/
│   └── index.ts             # Tipos TypeScript globais
└── supabase/
    ├── migrations/          # Arquivos SQL versionados
    └── seed.sql             # Dados iniciais (categorias padrão)
```

---

## 9. Ordem de Implementação

| Fase | Entregável | Detalhes |
|---|---|---|
| 1 | Setup inicial | Supabase + migrations + RLS + Next.js + autenticação |
| 2 | CRUD base + Escopo | Categorias, cartões, receitas fixas, despesas fixas — já com suporte a escopo pessoal/família |
| 3 | Transações manuais | Lançamento, listagem com filtros, mudança de status, seleção de escopo |
| 4 | Parcelamentos e assinaturas | Geração de parcelas, cadastro de assinaturas + integração câmbio |
| 5 | Cron jobs | Geração automática mensal de transações |
| 6 | Orçamento mensal | CRUD, clonagem do mês anterior, acompanhamento com Tremor |
| 7 | Visão Familiar + Caixa Familiar | Toggle Pessoal/Família, tela de contribuições, dashboard familiar |
| 8 | Dashboard | Cards de resumo, AreaChart, DonutChart, faturas, próximos lançamentos |
| 9 | Projetos | CRUD de projetos, grupos, itens, tipos de pagamento, integração com transações |

---

## 10. Escopo e Visibilidade

### 10.1 Conceito de Escopo

Cada entidade financeira pertence a um de dois escopos:

| Escopo | Significado | Quem acessa |
|---|---|---|
| `personal` | Dado pessoal de um usuário | Apenas o dono (+ parceiro se `is_shared = true`) |
| `family` | Dado compartilhado do casal | Ambos os usuários |

**Campos adicionados às tabelas com escopo:**

| Campo | Tipo | Descrição |
|---|---|---|
| `scope` | `TEXT DEFAULT 'personal'` | `'personal'` ou `'family'` |
| `user_id` | `UUID` | Dono do registro (NULL se família) |
| `is_shared` | `BOOLEAN DEFAULT false` | Parceiro pode visualizar (somente leitura) |

**Tabelas com escopo:** `credit_cards`, `fixed_incomes`, `fixed_expenses`, `subscriptions`, `installment_groups`, `transactions`, `budgets`.

**Tabela sem escopo:** `categories` — globais, compartilhadas sempre entre os dois usuários.

### 10.2 Compartilhamento Voluntário

Um usuário pode marcar qualquer entidade pessoal como `is_shared = true`. O efeito:
- O parceiro **visualiza** o item e suas transações vinculadas
- O parceiro **não pode editar ou excluir** (somente o dono)
- Caso prático: "quero que meu parceiro veja as parcelas do meu cartão pessoal"

### 10.3 Interface — Toggle Pessoal / Família

A interface oferece um toggle global no topo da aplicação:

- **Pessoal:** exibe dados do usuário autenticado + itens compartilhados com ele pelo parceiro
- **Família:** exibe apenas dados com `scope = 'family'`

O contexto do toggle é mantido durante a navegação e resolvido no servidor via cookie de sessão.

### 10.4 Caixa Familiar

O caixa familiar é o "fundo conjunto" do casal. Cada usuário configura uma contribuição mensal.

**Tabela `family_contributions`:**

| Campo | Tipo | Descrição |
|---|---|---|
| `user_id` | UUID | Quem está contribuindo |
| `amount` | NUMERIC(12,2) | Valor da contribuição mensal |
| `effective_from` | DATE | A partir de quando essa contribuição vale |
| `notes` | TEXT | Observações opcionais |

**Cálculo do caixa:**
- Saldo disponível = soma das contribuições dos dois usuários no mês − despesas com `scope = 'family'` no mês

**Tela Familiar exibe:**
- Contribuição de cada parceiro no mês
- Total disponível no caixa
- Total gasto do caixa
- Saldo restante

### 10.5 Origem do Pagamento

Ao registrar qualquer pagamento (transação manual ou item de projeto), o usuário informa a origem — de onde o dinheiro está saindo:

| Origem | Escopo gerado na transação |
|---|---|
| Parceiro 1 (nome real) | `scope = 'personal'`, `user_id = id do parceiro 1` |
| Parceiro 2 (nome real) | `scope = 'personal'`, `user_id = id do parceiro 2` |
| Caixa Familiar | `scope = 'family'` |

Para pagamentos via cartão de crédito, a origem é inferida pelo cartão selecionado.

---

## 11. Projetos

### 11.1 Visão Geral

Projetos são objetivos financeiros maiores com orçamento próprio e prazo definido. Exemplos: casamento, viagem, reforma, compra de móveis. Cada projeto tem vida própria — começa, evolui e termina — e seu orçamento é **independente** do orçamento mensal do sistema.

Projetos podem ter escopo `personal` (meu projeto) ou `family` (projeto do casal).

### 11.2 Dados do Projeto

**Tabela `projects`:**

| Campo | Tipo | Descrição |
|---|---|---|
| `name` | TEXT | Nome do projeto |
| `description` | TEXT | Descrição livre |
| `total_budget` | NUMERIC(12,2) | Orçamento total definido |
| `target_date` | DATE (nullable) | Data alvo (ex: data do casamento) |
| `status` | TEXT | `active` / `completed` / `cancelled` |
| `scope` | TEXT | `personal` ou `family` |
| `user_id` | UUID | Criador (dono) |
| `family_id` | UUID | Vínculo com a família |

### 11.3 Grupos do Projeto

Grupos são categorias de gasto específicas do projeto — independentes das categorias globais do sistema.

**Tabela `project_groups`:**

| Campo | Tipo | Descrição |
|---|---|---|
| `project_id` | UUID (FK) | Projeto ao qual pertence |
| `name` | TEXT | Nome do grupo (ex: Decoração, Buffet) |
| `description` | TEXT | Observações do grupo |
| `order` | SMALLINT | Ordem de exibição |

### 11.4 Itens do Projeto

Itens são os gastos individuais dentro de cada grupo. Cada item passa por um ciclo: considerando → confirmado → pago.

**Tabela `project_items`:**

| Campo | Tipo | Descrição |
|---|---|---|
| `project_group_id` | UUID (FK) | Grupo ao qual pertence |
| `project_id` | UUID (FK) | Projeto (denormalizado para queries) |
| `name` | TEXT | Nome do item (ex: "Buffet — Empresa X") |
| `description` | TEXT | Descrição adicional |
| `budget_amount` | NUMERIC(12,2) | Valor orçado / estimado |
| `actual_amount` | NUMERIC(12,2) | Valor real fechado |
| `payment_type` | TEXT | `cash` / `card_installment` / `deposit_remainder` |
| `payment_origin` | TEXT | `personal` / `family` |
| `payment_user_id` | UUID (nullable) | Quem paga (se `payment_origin = personal`) |
| `payment_method` | TEXT (nullable) | `debit` / `pix` / `cash` / `transfer` (somente `payment_type = cash`) |
| `credit_card_id` | UUID (nullable) | Cartão (se `card_installment`) |
| `installments_count` | SMALLINT (nullable) | Nº de parcelas (se `card_installment`) |
| `deposit_amount` | NUMERIC(12,2) (nullable) | Valor do sinal (se `deposit_remainder`) |
| `remainder_date` | DATE (nullable) | Data do pagamento restante (se `deposit_remainder`) |
| `category_id` | UUID (FK, nullable) | Categoria global para a transação gerada |
| `notes` | TEXT | Observações livres |
| `status` | TEXT | `considering` / `confirmed` / `paid` / `cancelled` |
| `transaction_id` | UUID (FK, nullable) | Transação gerada (pagamento único ou à vista) |
| `deposit_transaction_id` | UUID (FK, nullable) | Transação do sinal |
| `remainder_transaction_id` | UUID (FK, nullable) | Transação do restante |

**Regra:** `remainder_amount` é sempre calculado: `actual_amount − deposit_amount`. Não é armazenado.

### 11.5 Tipos de Pagamento

**À vista (`cash`)**
Campos exibidos: origem do pagamento (Parceiro 1 / Parceiro 2 / Caixa Familiar) + método (débito, pix, dinheiro, transferência).

**Parcelado no cartão (`card_installment`)**
Campos exibidos: cartão (selecionado do cadastro) + número de parcelas. A origem é inferida pelo cartão.

**Sinal + Restante (`deposit_remainder`)**
Campos exibidos: valor do sinal + data do pagamento restante + origem. O valor do restante é exibido automaticamente (`actual_amount − deposit_amount`).

### 11.6 Painel de Resumo do Projeto

Exibido no topo da tela do projeto:

| Métrica | Cálculo |
|---|---|
| Budget total | `projects.total_budget` |
| Previsto para gastar | Soma de `budget_amount` de todos os itens ativos |
| Saldo estimado | `total_budget − previsto para gastar` |
| Já gasto (real) | Soma de `actual_amount` dos itens com `status = paid` |
| Saldo real | `total_budget − já gasto` |

### 11.7 Integração com Transações

Quando um item é marcado como `confirmed` ou `paid` com valor real informado, o sistema **gera transações reais** na tabela `transactions`:

- `cash`: 1 transação com a origem e método informados
- `card_installment`: N transações do tipo `installment` vinculadas ao cartão
- `deposit_remainder`: 2 transações — uma do sinal (imediata) e uma do restante (na `remainder_date`)

Todas as transações geradas recebem a `category_id` escolhida pelo usuário e uma referência ao `project_item_id` para rastreabilidade.

### 11.8 Status do Projeto

Quando todos os itens de um projeto estão com `status = paid` ou `cancelled`, o sistema exibe uma sugestão para marcar o projeto como `completed`.

---

*Couple — Documento de Regras de Negócio v1.1 — Confidencial, uso interno do casal*
