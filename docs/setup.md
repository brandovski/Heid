# Heid — Guia de Configuração do Ambiente

---

## Pré-requisitos

- Node.js 18+
- npm, yarn ou pnpm
- Conta no [Supabase](https://supabase.com)
- Conta na [Vercel](https://vercel.com)

---

## 1. Clonar e instalar dependências

```bash
git clone <repo-url>
cd couple
npm install
```

---

## 2. Configurar Supabase

### 2.1 Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Anote a **URL** e as **chaves** (Anon Key e Service Role Key) em Settings → API

### 2.2 Criar as tabelas

Execute as migrations na ordem definida em `docs/banco-de-dados.md`, via SQL Editor do Supabase ou Supabase CLI:

```bash
# Com Supabase CLI (opcional)
supabase db push
```

Ou copie o conteúdo de cada arquivo em `supabase/migrations/` e execute no SQL Editor do dashboard.

### 2.3 Configurar os usuários

1. Vá em Authentication → Users no dashboard do Supabase
2. Crie os dois usuários manualmente com e-mail e senha
3. **Desabilitar cadastro público:** Authentication → Settings → desmarque "Enable email confirmations" e desabilite "Allow new users to sign up"
4. Após criar os usuários, execute no SQL Editor:

```sql
-- Configuração aplicada em 2026-02-25 via Management API
UPDATE profiles SET family_id = 'cbe6f412-d190-49de-a062-10cc17b9b77d' WHERE id IN (
  'f860afbb-a0eb-4683-b82a-022a9fbe2e51',
  '6665da54-7400-4fb0-94dd-1cbd1c4d182d'
);
```

### 2.4 Rodar o seed de categorias

```sql
-- Substitua <family_id> pelo UUID definido no passo anterior
INSERT INTO categories (family_id, name, icon, color) VALUES
  ('<family_id>', 'Alimentação',  '🍔', '#F97316'),
  ('<family_id>', 'Transporte',   '🚗', '#3B82F6'),
  ('<family_id>', 'Moradia',      '🏠', '#8B5CF6'),
  ('<family_id>', 'Saúde',        '💊', '#EF4444'),
  ('<family_id>', 'Lazer',        '🎮', '#10B981'),
  ('<family_id>', 'Educação',     '📚', '#F59E0B'),
  ('<family_id>', 'Vestuário',    '👕', '#EC4899'),
  ('<family_id>', 'Outros',       '📦', '#6B7280');
```

---

## 3. Variáveis de ambiente

Crie o arquivo `.env.local` na raiz do projeto:

```env
# Supabase — disponíveis em Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<sua-service-role-key>

# Segurança dos cron jobs — gere um token aleatório
CRON_SECRET=<token-aleatorio-forte>
```

> **Atenção:** `SUPABASE_SERVICE_ROLE_KEY` e `CRON_SECRET` nunca devem ser expostos no cliente.
> O prefixo `NEXT_PUBLIC_` é obrigatório para variáveis acessadas no browser.

Para gerar um `CRON_SECRET` seguro:
```bash
openssl rand -base64 32
```

---

## 4. Rodar localmente

```bash
npm run dev
```

Acesse `http://localhost:3000`.

---

## 5. Configurar Vercel Cron Jobs

No arquivo `vercel.json` na raiz do projeto:

```json
{
  "crons": [
    {
      "path": "/api/cron/fetch-exchange-rate",
      "schedule": "30 5 1 * *"
    },
    {
      "path": "/api/cron/generate-monthly",
      "schedule": "0 6 1 * *"
    },
    {
      "path": "/api/cron/supabase-keepalive",
      "schedule": "0 9 */3 * *"
    }
  ]
}
```

Os crons são executados pela Vercel e passam o header `Authorization: Bearer <CRON_SECRET>`.

Para testar manualmente em desenvolvimento:
```bash
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/generate-monthly
```

---

## 6. Deploy na Vercel

1. Conecte o repositório no dashboard da Vercel
2. Adicione as variáveis de ambiente em Settings → Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`
3. A Vercel detecta automaticamente o Next.js — sem configurações adicionais
4. Os cron jobs são ativados automaticamente ao fazer deploy com o `vercel.json` configurado

---

## 7. Estrutura de pastas após setup

```
couple/
├── .env.local              # variáveis de ambiente (não commitado)
├── vercel.json             # configuração de crons
├── supabase/
│   ├── migrations/         # arquivos SQL numerados
│   └── seed.sql
├── app/
├── components/
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # createBrowserClient
│   │   └── server.ts       # createServerClient
│   └── utils/
├── types/
└── docs/                   # documentação do projeto
```

---

*Atualizado em: 2026-02-25*
