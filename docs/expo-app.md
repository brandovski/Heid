# Heid — App Mobile (Expo + React Native)

> Documento de planejamento para o desenvolvimento futuro do app mobile do Heid.
> A versão web deve ser concluída antes de iniciar este projeto.
> Consultar também: `docs/arquitetura.md` para referência da stack web.

---

## 1. Visão Geral

App mobile nativo para iOS e Android, compartilhando o mesmo backend (Supabase) da versão web. O objetivo é oferecer a experiência do Heid como app instalável nas lojas, com acesso rápido ao dia a dia financeiro do casal.

**Repositório:** separado do projeto web (novo repositório no GitHub).
**Nome sugerido:** `heid-app` ou `heid-mobile`

---

## 2. Stack do App Mobile

| Camada | Tecnologia | Motivo |
|---|---|---|
| Framework | **Expo SDK** (managed workflow) | Simplifica build iOS/Android, OTA updates via Expo Go |
| Linguagem | **TypeScript** | Consistência com a web |
| Navegação | **Expo Router** | File-based routing, igual ao Next.js App Router — curva de aprendizado mínima |
| Estilização | **NativeWind v4** | Tailwind CSS para React Native — reutiliza classes e familiaridade |
| Backend | **Supabase JS SDK** (`@supabase/supabase-js`) | Mesmo SDK da web, sem adaptação |
| Auth | **Supabase Auth** via `@supabase/supabase-js` | Mesmos 2 usuários fixos, mesmo JWT |
| Gráficos | **Victory Native XL** | Melhor performance em React Native; alternativa: `react-native-gifted-charts` |
| Storage local | **Expo SecureStore** | Armazenamento seguro do token de sessão |
| Ícones | **@expo/vector-icons** (MaterialCommunityIcons) | Já familiar no projeto web; conjunto amplo |
| Build / Distribuição | **EAS Build + EAS Submit** | Serviço oficial da Expo para gerar IPA/APK e publicar nas lojas |

---

## 3. O que é reaproveitado do projeto web

### Integralmente reutilizável (zero mudança)
- **Backend Supabase:** mesmo projeto, mesmo banco, mesma RLS, mesmos endpoints de API
- **Cron jobs Vercel:** continuam rodando na web; o app mobile apenas consome os dados
- **Regras de negócio:** escopo pessoal/familiar, cálculo de faturas, projeções de investimento
- **`src/types/database.ts`:** tipos TypeScript do schema — copiar para o app mobile (ou extrair para pacote compartilhado futuramente)
- **Variáveis de ambiente Supabase:** mesmos `SUPABASE_URL` e `SUPABASE_ANON_KEY`

### Adaptável (reescrita leve)
- **Lógica de queries Supabase:** mesmas queries (`.from().select().eq()`), mas chamadas de dentro de hooks React Native (sem Server Components)
- **Formatação:** funções utilitárias como `formatCurrency`, `formatDate` — copiar direto
- **Constantes e enums:** `TransactionStatus`, `Scope`, etc.

### Não reutilizável (reescrever do zero)
- **Todos os componentes UI:** `<div>`, `<button>`, Tailwind classes → `<View>`, `<TouchableOpacity>`, NativeWind/StyleSheet
- **Recharts:** substituir por Victory Native XL ou similar
- **Next.js API Routes:** o app mobile chama as mesmas APIs REST (`/api/faturas`, `/api/transacoes`, etc.) via `fetch` normal
- **Modais / Bottom Sheets:** usar `@gorhom/bottom-sheet` ou `expo-modal` no lugar dos componentes web

---

## 4. Arquitetura do App Mobile

```
heid-app/
├── app/                        # Expo Router (file-based routing)
│   ├── (auth)/
│   │   └── login.tsx
│   ├── (tabs)/                 # Bottom tab navigator
│   │   ├── index.tsx           # Dashboard
│   │   ├── transacoes.tsx
│   │   ├── fluxo.tsx
│   │   ├── orcamento.tsx
│   │   └── mais.tsx            # Cartões, Investimentos, Projetos, Família, Categorias
│   └── _layout.tsx
├── components/
│   ├── ui/                     # Componentes base (Button, Card, Badge, ProgressBar)
│   ├── dashboard/
│   ├── transacoes/
│   └── ...
├── lib/
│   ├── supabase.ts             # createClient com AsyncStorage/SecureStore
│   ├── queries/                # Funções de query reutilizáveis por módulo
│   └── utils/                  # formatCurrency, formatDate, etc.
├── types/
│   └── database.ts             # Cópia dos tipos TypeScript do projeto web
├── hooks/
│   ├── useAuth.ts
│   ├── useTransacoes.ts
│   └── ...
├── constants/
│   └── theme.ts                # Cores brand-*, fontes Kaisei/Poppins
├── app.json
├── eas.json
└── tailwind.config.js          # NativeWind — mesma paleta brand do projeto web
```

---

## 5. Autenticação com Supabase

O Supabase JS SDK funciona nativamente com Expo, com uma configuração específica de storage:

```ts
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // importante no React Native
    },
  }
)
```

**Fluxo de auth:**
1. Tela de login com `supabase.auth.signInWithPassword()`
2. Sessão persistida no SecureStore
3. Expo Router verifica sessão no `_layout.tsx` raiz e redireciona para `(auth)` ou `(tabs)`

---

## 6. Identidade Visual

Manter consistência com a versão web:

| Elemento | Web | Mobile |
|---|---|---|
| Cor primária | `brand-600` (#1D2D28) | Mesma via NativeWind / `theme.ts` |
| Fonte título | Kaisei Tokumin | `@expo-google-fonts/kaisei-tokumin` |
| Fonte corpo | Poppins | `@expo-google-fonts/poppins` |
| Paleta | brand-50 a brand-900 | Replicar em `tailwind.config.js` |
| Ícones | Lucide (web) | `@expo/vector-icons` (MaterialCommunityIcons) |

```js
// tailwind.config.js (NativeWind)
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0faf7',
          100: '#d5f0e7',
          // ... mesma paleta do projeto web
          600: '#1D2D28',
          900: '#0a1210',
        },
      },
      fontFamily: {
        serif: ['KaiseiTokumin_700Bold'],
        sans:  ['Poppins_400Regular'],
      },
    },
  },
}
```

---

## 7. Telas Planejadas

### Navegação principal (Bottom Tabs)

| Tab | Tela | Equivalente web |
|---|---|---|
| Home | Dashboard | `/dashboard` |
| Transações | Lista + FAB "Nova Transação" | `/transacoes` |
| Fluxo | Calendário financeiro | `/fluxo` |
| Orçamento | Orçamento mensal | `/orcamento` |
| Mais | Menu com demais módulos | Sidebar / menu |

### Tela "Mais" (menu secundário)
- Cartões e Faturas
- Investimentos
- Projetos
- Família / Caixa Familiar
- Categorias
- Assinaturas
- Parcelamentos
- Perfil / Configurações

### Modais globais (acessíveis de qualquer tela)
- Nova Transação (FAB flutuante)
- Pagar Fatura

---

## 8. Diferenças importantes em relação à web

### Sem Server Components
Todo fetch de dados é **client-side**. Usar hooks customizados com `useState` + `useEffect` ou uma biblioteca de data fetching como **SWR** ou **TanStack Query**.

```ts
// Exemplo: hook de transações
export function useTransacoes(month: string, scope: Scope) {
  const [data, setData] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('transactions')
      .select('...')
      .eq('scope', scope)
      .gte('date', `${month}-01`)
      .then(({ data }) => { setData(data ?? []); setLoading(false) })
  }, [month, scope])

  return { data, loading }
}
```

### Chamadas às APIs REST da web
Para operações que usam as API Routes da web (ex: `POST /api/faturas`, `POST /api/transacoes`), o app mobile faz `fetch` para a URL do projeto Vercel com o token de sessão no header:

```ts
await fetch('https://heid.vercel.app/api/transacoes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  },
  body: JSON.stringify(payload),
})
```

Alternativamente, replicar as mesmas queries Supabase direto no app (sem depender das API Routes), aproveitando que o SDK já valida a sessão e a RLS já protege o banco.

**Recomendação:** chamar o Supabase diretamente no app para leituras simples; usar as API Routes da web apenas para operações com lógica complexa (ex: geração de parcelas).

### Navegação nativa vs. web
- Gestos de swipe, animações de transição nativas
- Bottom sheet em vez de modal overlay
- `@gorhom/bottom-sheet` para drawers e formulários longos

---

## 9. Decisões a tomar antes de iniciar

- [ ] Confirmar uso de NativeWind v4 vs. StyleSheet puro
- [ ] Definir estratégia de data fetching: hooks manuais vs. TanStack Query
- [ ] Definir se as escritas usam API Routes da web ou Supabase direto
- [ ] Confirmar biblioteca de gráficos (Victory Native XL é a mais madura)
- [ ] Definir estrutura de repositório: monorepo (Turborepo) para compartilhar tipos e utils, ou dois repos independentes
- [ ] Definir política de OTA updates (Expo Updates) vs. versão fixa nas lojas

---

## 10. Setup inicial (quando for começar)

```bash
# 1. Criar projeto Expo
npx create-expo-app heid-app --template blank-typescript

# 2. Instalar dependências principais
npx expo install expo-router expo-secure-store expo-font
npm install @supabase/supabase-js
npm install nativewind@^4 tailwindcss

# 3. Instalar fontes Google
npx expo install @expo-google-fonts/kaisei-tokumin @expo-google-fonts/poppins expo-font

# 4. Instalar navegação e UI
npm install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler

# 5. Gráficos
npm install victory-native react-native-svg

# 6. Configurar EAS
npm install -g eas-cli
eas login
eas build:configure
```

---

## 11. Fases sugeridas de desenvolvimento

### Fase M1 — Fundação
- Setup do projeto Expo com Expo Router
- Configuração Supabase + autenticação (login / logout)
- Configuração NativeWind com paleta brand
- Fontes Kaisei + Poppins
- Bottom tab navigator com 5 abas
- Tela de Dashboard (cards de resumo — sem gráficos ainda)

### Fase M2 — Core financeiro
- Tela de Transações (listagem + filtros + FAB "Nova Transação")
- Modal de nova transação (bottom sheet)
- Tela de Orçamento com barras de progresso
- Tela de Fluxo / Calendário Financeiro

### Fase M3 — Módulos secundários
- Tela de Cartões e Faturas + modal "Pagar Fatura"
- Tela de Investimentos
- Tela de Projetos
- Tela de Família / Caixa Familiar

### Fase M4 — Gráficos e refinamento
- Gráficos de evolução e distribuição no Dashboard
- Gráfico de snapshots nos Investimentos
- Animações de transição de tela
- Skeleton loaders em todas as telas

### Fase M5 — Distribuição
- Build de produção via EAS Build
- Submissão para App Store (iOS) e Play Store (Android)
- Configuração de OTA updates com Expo Updates

---

*Criado em: 2026-03-01 | Versão web atual: Fases 1–11 concluídas*
