# Sessão 041 — UI/Branding: identidade visual, sidebar e assets de logo

**Data:** 2026-03-22
**Commits:** `7d0655e`, `663df89`, `8a9d421`

---

## Contexto

Sessão dedicada à identidade visual do Heid. O ponto de partida foi um design no Figma com a página inicial do Dashboard — ainda incompleto, mas com a linguagem visual definida: fundo creme quente, verde floresta como cor primária e amarelo como accent. O objetivo foi extrair essa linguagem, criar tokens reutilizáveis e migrar o layout de navegação de top-navbar para sidebar desktop.

Adicionalmente, a pasta do projeto foi renomeada de `Heidebriel` para `Heid` e o repositório/plataformas foram atualizados.

---

## O que foi feito

### 1. Análise do design no Figma

- Usado MCP do Figma para extrair a linguagem visual da página de Dashboard (`node-id: 12:177`)
- Extraídos: paleta de cores, tipografia (Kaisei Tokumin + Poppins), espaçamentos, border-radius e estrutura de layout
- Screenshot coletado confirmando o layout: sidebar amarela flutuante à esquerda, conteúdo à direita

### 2. Design system — tokens Tailwind (`tailwind.config.ts`)

Paleta corrigida e expandida com semântica clara:

| Escala | Cor base | Uso |
|---|---|---|
| `brand` | `#1b4437` (verde floresta) | Cor primária, textos, ícones |
| `accent` | `#e0d44e` (amarelo) | Nav, destaques, estados ativos |
| `danger` | `#441b1b` (vinho escuro) | Despesas, alertas |
| `surface` | `#fefcf1` (creme quente) | Fundo da aplicação |

Tokens adicionados:
- `borderRadius`: `card` (10px), `panel` (20px), `pill` (40px)
- `boxShadow`: `card` e `panel` com tom verde (`rgba(27,68,55,...)`)

### 3. CSS Variables e base (`globals.css`)

Adicionadas variáveis CSS em `:root` para uso direto em contextos sem Tailwind:
- `--color-surface`, `--color-brand`, `--color-accent`, `--color-accent-light`, `--color-danger`
- `--border-brand`, `--border-danger` (com opacidade)
- `--bg-income-icon`, `--bg-expense-icon`, `--bg-card-highlight`, `--bg-footer`
- `--radius-card`, `--radius-panel`, `--radius-pill`

`body` atualizado com `background-color: var(--color-surface)` e `color: var(--color-brand)`.

### 4. Navbar — migração para tokens e remoção do desktop nav

- Todas as referências `gray-*` e `brand-600` migradas para `brand-700`, `accent-200`, `accent-100`
- Fundo do header: `bg-white/80` → `bg-surface/90 backdrop-blur-xl`
- Nav mobile bottom: de `bg-white/60` para `bg-accent-400/80` (amarelo — reflete sidebar do Figma)
- FAB: `bg-brand-600` → `bg-brand-700 ring-surface`

### 5. Sidebar desktop (`src/components/Sidebar.tsx`) — novo componente

Substitui o top-navbar no desktop. Características:
- **Posição:** `fixed inset-y-0 left-0 w-[260px]`, flex coluna com `justify-center` (card verticalmente centralizado — fiel ao Figma)
- **Card:** `bg-accent-400 rounded-panel shadow-panel` — fundo amarelo com cantos 20px e sombra verde
- **Logo:** `logo.svg` real do Figma via `<img>` (isotipo mascote + wordmark "Heid")
- **Nav:** agrupada por seção (itens principais / Gerenciar Cartões / Planejamento)
- **Item ativo:** `bg-accent-200 text-brand-700 font-medium` — pill 40px de raio
- **Hover:** `hover:bg-brand-700/5 hover:text-brand-700` — sutil, sem distração
- **Perfil:** separado por linha `bg-brand-700/10` no rodapé do card

### 6. Layout (`src/app/(app)/layout.tsx`)

- Adicionado `<Sidebar />`
- Main: `sm:ml-[260px]` (desloca para direita no desktop), `sm:mt-0` (sem top navbar)
- Mobile: `mt-14` mantido (header fixo ainda presente)

### 7. Assets de logo (`public/assets/logo/` + `src/app/`)

Estrutura completa criada com o logo real exportado do Figma:

| Arquivo | Uso |
|---|---|
| `public/assets/logo/logo.svg` | Isotipo + wordmark, fundos claros |
| `public/assets/logo/logo-mark.svg` | Só o isotipo (32×32) |
| `public/assets/logo/logo-white.svg` | Wordmark creme, para fundos escuros |
| `public/assets/logo/logo-mark-192.png` | PWA / Android icon |
| `public/assets/logo/logo-mark-512.png` | PWA / Android icon large |
| `src/app/icon.svg` | Favicon automático (Next.js App Router) |
| `src/app/apple-icon.png` | Ícone iOS (180×180) |
| `src/app/opengraph-image.png` | Imagem de compartilhamento social (1200×630) |

### 8. Renomeação do projeto (contexto pré-sessão)

- Diretório renomeado: `Heidebriel` → `Heid`
- Remote atualizado: `github.com/gabrielbrandao-atus/heid`
- Docs: caminhos e URLs atualizados em `session-start-prompt.md`, `setup.md`, `regras-de-negocio.md`, `diario-dev.md`
- Vercel e Supabase: display names atualizados (project refs sem alteração)

---

## Resultado

- Zero erros TypeScript
- Fundo da aplicação: creme quente `#fefcf1` em toda a UI
- Desktop: sidebar amarela flutuante com mascote do Heid, sem top-navbar
- Mobile: bottom nav amarela + FAB verde + header creme — paleta consistente
- Favicon e ícones da aplicação funcionando via Next.js App Router
- Tokens de design prontos para uso em todos os novos componentes

---

## Próxima ação

Fase UI/Branding — continuar implementando o layout do Dashboard conforme o Figma:
- Saudação com nome do usuário (Kaisei Tokumin, tamanho grande)
- Seletor de mês
- Grid de 5 cards de resumo (Receitas, Despesas, A receber, A pagar, Saldo)
- Seção de gráfico + próximas movimentações (2 colunas)
- Card full-width de próximas movimentações com "Ver tudo"
