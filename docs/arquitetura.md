# Couple — Arquitetura e Decisões Técnicas

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                        Vercel                           │
│                                                         │
│   ┌─────────────────────┐   ┌────────────────────────┐  │
│   │   Next.js App       │   │   Cron Functions       │  │
│   │   (App Router)      │   │   generate-monthly     │  │
│   │                     │   │   fetch-exchange-rate  │  │
│   │  - React Server     │   │   supabase-keepalive   │  │
│   │    Components       │   └──────────┬─────────────┘  │
│   │  - API Routes       │              │                 │
│   └──────────┬──────────┘              │                 │
│              │                         │                 │
└──────────────┼─────────────────────────┼─────────────────┘
               │                         │
               ▼                         ▼
┌──────────────────────────────────────────────────────────┐
│                       Supabase                           │
│                                                          │
│   ┌──────────────┐    ┌────────────────────────────────┐ │
│   │  Auth (JWT)  │    │  PostgreSQL + RLS              │ │
│   │              │    │                                │ │
│   │  - 2 users   │    │  - profiles                   │ │
│   │  - Sessions  │    │  - categories                 │ │
│   └──────────────┘    │  - credit_cards               │ │
│                       │  - transactions                │ │
│                       │  - budgets                     │ │
│                       │  - ...                         │ │
│                       └────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────┐
│     AwesomeAPI      │
│  (cotação USD→BRL)  │
└─────────────────────┘
```

---

## 2. Decisões Técnicas

### 2.1 Next.js App Router

**Decisão:** usar App Router (não Pages Router).

**Motivo:** RSC (React Server Components) permite buscar dados diretamente no servidor sem camada de API intermediária para a maioria das leituras. Reduz round-trips e simplifica o código para telas de listagem e dashboard.

**Padrão adotado:**
- Server Components para leitura de dados (dashboard, listagens)
- Client Components (`"use client"`) apenas onde necessário: formulários, interatividade, estado local
- API Routes (`/app/api/`) para operações de escrita e para os cron jobs

### 2.2 Supabase como BaaS

**Decisão:** Supabase em vez de banco próprio ou outro BaaS.

**Motivo:** entrega PostgreSQL gerenciado + Auth + RLS em uma única plataforma, eliminando a necessidade de implementar autenticação do zero. O plano gratuito suporta bem o volume de dois usuários.

**Dois clientes Supabase:**
- `lib/supabase/client.ts` — client-side (usa `createBrowserClient`)
- `lib/supabase/server.ts` — server-side (usa `createServerClient` com cookies)

### 2.3 RLS como camada de segurança primária

**Decisão:** RLS ativo em todas as tabelas, não depender apenas de validações no código.

**Motivo:** garante que mesmo um bug na API não exponha dados de outros usuários. A política usa `family_id` para permitir acesso compartilhado entre o casal.

### 2.4 Fatura calculada dinamicamente

**Decisão:** fatura não é persistida, é calculada via query sempre que necessário.

**Motivo:** evita inconsistências de dados. O período de competência é determinado pelo `closing_day` do cartão, e qualquer transação adicionada retroativamente é automaticamente refletida na fatura correta.

### 2.5 Tremor para UI de dados

**Decisão:** Tremor em vez de Chart.js, Recharts ou Victory.

**Motivo:** oferece componentes de dashboard prontos (cards, gráficos, tabelas, badges) com visual consistente e integração nativa com Tailwind. Reduz o esforço de montar dashboards do zero.

---

## 3. Padrões do Projeto

### 3.1 Estrutura de componentes

```
components/
├── ui/              # Wrappers e customizações sobre Tremor
├── dashboard/       # Componentes específicos do dashboard
├── transactions/    # Listagem, formulários, badges de status
├── cards/           # Cards de crédito e faturas
└── budget/          # Barras de progresso de orçamento
```

**Regra:** componentes de `ui/` são genéricos e reutilizáveis. Componentes de módulo (`dashboard/`, `transactions/`, etc.) são específicos e podem conter lógica de negócio.

### 3.2 Nomenclatura

| Item | Convenção | Exemplo |
|---|---|---|
| Componentes React | PascalCase | `TransactionRow.tsx` |
| Funções utilitárias | camelCase | `formatCurrency()` |
| Arquivos de rota (Next.js) | kebab-case | `generate-monthly/route.ts` |
| Variáveis de ambiente | UPPER_SNAKE_CASE | `SUPABASE_URL` |
| Tabelas do banco | snake_case | `credit_cards` |
| Tipos TypeScript | PascalCase | `Transaction`, `CreditCard` |
| Enums TypeScript | PascalCase | `TransactionStatus` |

### 3.3 Server Components vs. Client Components

**Use Server Component quando:**
- Leitura de dados do Supabase (listagens, dashboard)
- Não há interatividade (sem onClick, onChange, useState)
- Componente é pesado e pode se beneficiar de cache no servidor

**Use Client Component (`"use client"`) quando:**
- Formulários e inputs
- Modais e drawers
- Hooks de estado (`useState`, `useEffect`)
- Bibliotecas que requerem DOM (Tremor Charts são client-side)

### 3.4 Tratamento de erros

- API Routes retornam `{ error: string }` com status HTTP adequado (400, 401, 404, 500)
- Server Components exibem `<ErrorBoundary />` ou mensagem inline
- Formulários exibem erros de validação inline nos campos

### 3.5 Loading states

- Server Components usam `loading.tsx` do App Router (Suspense automático)
- Client Components usam skeleton loaders (não spinners genéricos)

---

## 4. Fluxo de Dados

### Leitura (dashboard / listagens)
```
Page (Server Component)
  → createServerClient(cookies)
  → supabase.from('transactions').select(...)
  → renderiza RSC com dados
```

### Escrita (formulários)
```
Form (Client Component)
  → POST /api/transactions
  → API Route valida + usa createServerClient
  → supabase.from('transactions').insert(...)
  → retorna { data } ou { error }
  → Client Component atualiza UI (router.refresh() ou revalidatePath)
```

### Cron Job
```
Vercel Cron → GET /api/cron/generate-monthly
  → valida CRON_SECRET no header Authorization
  → busca fixas/assinaturas ativas
  → verifica idempotência (já existe transação?)
  → insere transações
  → retorna { generated: N }
```

---

## 5. Variáveis de Ambiente

| Variável | Onde usar | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Chave pública do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Somente Server | Chave de service role (bypass RLS nos crons) |
| `CRON_SECRET` | Somente Server | Token para autenticar chamadas dos cron jobs |

> `SUPABASE_SERVICE_ROLE_KEY` **nunca** deve ser exposta no cliente. Usada apenas nos cron jobs para inserir transações sem depender de sessão de usuário.

---

## 6. Segurança

- Cadastro público desabilitado no Supabase Auth
- RLS em todas as tabelas — políticas de escopo em entidades financeiras; `family_id` nas demais
- Cron endpoints protegidos por `CRON_SECRET` no header `Authorization`
- `SUPABASE_SERVICE_ROLE_KEY` restrita ao servidor
- Validação de input nas API Routes antes de qualquer operação no banco

---

## 7. Modelo de Escopo e Visibilidade

### 7.1 Conceito

Cada entidade financeira (cartão, receita fixa, despesa fixa, assinatura, parcelamento, transação, orçamento) possui três campos adicionais:

| Campo | Tipo | Descrição |
|---|---|---|
| `scope` | `'personal' \| 'family'` | A quem o item pertence |
| `user_id` | `UUID \| null` | Dono (obrigatório quando scope='personal') |
| `is_shared` | `boolean` | Parceiro pode visualizar (somente leitura) |

Categorias e `invoice_payments` são sempre **familiares** — sem escopo pessoal.

### 7.2 Regras de visibilidade

| Situação | Quem vê |
|---|---|
| `scope='family'` | Ambos os usuários da família |
| `scope='personal'` | Apenas o dono (`user_id = auth.uid()`) |
| `scope='personal'` + `is_shared=true` | Dono + parceiro (leitura) |

**Escrita:** sempre restrita ao dono ou à família, nunca ao parceiro via `is_shared`.

### 7.3 Visibilidade de transações

Transações não têm `is_shared` próprio. A visibilidade de transações pessoais pelo parceiro é **herdada da entidade-pai** (cartão, receita fixa, etc.):

```sql
-- Parceiro vê transação pessoal SE a entidade-pai está compartilhada
scope = 'personal' AND family_id = auth_family_id() AND (
  credit_card_id IN (SELECT id FROM credit_cards WHERE is_shared = true AND user_id != auth.uid())
  -- ... mesma lógica para fixed_incomes, fixed_expenses, subscriptions, installment_groups
)
```

### 7.4 Caixa Familiar (`family_contributions`)

- Cada usuário define um valor de contribuição mensal (`effective_from` como data de vigência)
- Saldo do Caixa Familiar: `SUM(contribuições do mês) - SUM(transactions.amount WHERE scope='family')`
- Calculado dinamicamente — não armazenado

### 7.5 Toggle de visão na UI

A UI apresenta um toggle **Pessoal | Familiar** nas telas principais.

- **Pessoal:** exibe apenas itens do usuário autenticado (scope='personal' AND user_id = uid) + itens familiares relevantes
- **Familiar:** exibe itens com scope='family' + itens pessoais do parceiro que têm is_shared=true (somente leitura)

### 7.6 Origem do pagamento em Projetos

Itens de projeto têm `payment_origin`:
- `'personal'` + `payment_user_id` → transação com `scope='personal'`, `user_id=payment_user_id`
- `'family'` → transação com `scope='family'`

---

*Atualizado em: 2026-02-25*
