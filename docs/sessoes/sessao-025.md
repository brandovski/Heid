# Sessão 025 — 2026-02-28

**Fase:** Rebrand Couple → Heid
**Resultado:** Concluído — Nova identidade visual completa aplicada, `tsc --noEmit` limpo, commit + push realizados

---

## Objetivo

Realizar o rebrand completo da plataforma de "Couple" para "Heid":
- Nova paleta de cores `brand-*` (deep forest green, #1D2D28) substituindo `blue-*`
- Fontes Kaisei Tokumin (serif, títulos) + Poppins (sans, corpo)
- Renomear o projeto em package.json e toda a documentação

---

## O que foi feito

### 1. Fontes — `next/font`

Configurado em `src/app/layout.tsx`:

```tsx
import { Kaisei_Tokumin, Poppins } from "next/font/google";

const kaisei = Kaisei_Tokumin({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-kaisei",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});
```

### 2. `tailwind.config.ts`

```typescript
colors: {
  brand: {
    50:  "#f0faf7",
    100: "#d5f0e7",
    200: "#aadece",
    300: "#72c4ae",
    400: "#3ea58d",
    500: "#268a73",
    600: "#1D2D28",  // cor primária — deep forest green
    700: "#1a2924",
    800: "#162320",
    900: "#121d1b",
  },
},
fontFamily: {
  sans: ["var(--font-poppins)", "sans-serif"],
  serif: ["var(--font-kaisei)", "serif"],
},
```

### 3. `globals.css`

```css
@layer base {
  h1, h2, h3 {
    @apply font-serif;
  }
}
```

(Nota: a regra h2/h3 será corrigida na sessão 026.)

### 4. Migração `blue-*` → `brand-*`

60+ arquivos em `src/` atualizados. Classes substituídas:
- `bg-blue-*` → `bg-brand-*`
- `text-blue-*` → `text-brand-*`
- `border-blue-*` → `border-brand-*`
- `ring-blue-*` → `ring-brand-*`
- `hover:bg-blue-*` → `hover:bg-brand-*`

### 5. `Navbar.tsx`

Logo "Heid" com identidade visual:

```tsx
<span className="text-xl font-bold font-serif text-brand-700">Heid</span>
```

(Nota: `font-serif` será removido do brand na sessão 026.)

### 6. Login page

- Acento visual com `brand-600`
- H1 renderizado com Kaisei Tokumin via regra global

### 7. `package.json`

```json
{ "name": "heid" }
```

### 8. Documentação

- Todos os arquivos `docs/` atualizados: "Couple" → "Heid"
- `MEMORY.md` atualizado com nova identidade visual

---

## Arquivos modificados

```
package.json
tailwind.config.ts
src/app/globals.css
src/app/layout.tsx
src/components/Navbar.tsx
src/app/(auth)/login/page.tsx
docs/arquitetura.md
docs/banco-de-dados.md
docs/diario-dev.md
docs/padroes.md
docs/regras-de-negocio.md
docs/roadmap.md
docs/setup.md
docs/session-start-prompt.md
src/app/(app)/assinaturas/**  ← ~8 arquivos
src/app/(app)/cartoes/**      ← ~8 arquivos
src/app/(app)/categorias/**   ← ~4 arquivos
src/app/(app)/dashboard/**    ← ~5 arquivos
src/app/(app)/familia/**      ← ~3 arquivos
src/app/(app)/investimentos/** ← ~4 arquivos
src/app/(app)/orcamento/**    ← ~3 arquivos
src/app/(app)/projetos/**     ← ~5 arquivos
src/app/(app)/transacoes/**   ← ~4 arquivos
src/components/ui/**          ← ~5 arquivos
```

---

## Verificação

- `tsc --noEmit` → zero erros ✅
- Paleta brand-* aplicada em todos os componentes ✅
- Fontes carregadas via next/font, sem FOUT ✅
- Logo "Heid" visível na Navbar ✅
- Login page com acento brand ✅
- Documentação consistente ✅

---

## Commits

```
6100d96 feat: rebrand Couple → Heid — cor, tipografia e nome
```

Push realizado para `origin/main`.

---

## Próxima sessão

Sessão 026 — Correções pós-rebrand: ajustar regra de serifa (apenas h1), corrigir brand "Heid" na Navbar (Poppins em vez de Kaisei) e corrigir active states da navbar (bg-brand-50 → bg-brand-100).
