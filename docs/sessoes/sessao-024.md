# Sessão 024 — 2026-02-28

**Fase:** Redesign Navegação Mobile
**Resultado:** Concluído — Navbar completamente reescrita, FAB posicionado, `tsc --noEmit` limpo, commit + push realizados

---

## Objetivo

Redesenhar a navegação para mobile e ajustar o desktop:
- **Desktop:** renomear Dashboard → Home (ícone `Home`), remover link Fluxo da nav
- **Mobile:** novo header fixo com título da página + dropdown de perfil multi-nível
- **Mobile:** bottom nav reordenada (Home, Transações, [FAB], Projetos, Invest.) com FAB central para registrar nova transação
- **Mobile:** FAB parcialmente sobreposto à nav bar (projeção visual acima dela)

---

## O que foi feito

### 1. `Navbar.tsx` — reescrita completa

#### Desktop
- Link "Dashboard" → "Home" com ícone `Home` (Lucide)
- Link "Fluxo" removido (acessado apenas pelo widget no Dashboard)

#### Mobile — Header fixo

```tsx
<header className="fixed top-0 left-0 right-0 h-14 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center px-4 sm:hidden">
  <span>{pageTitle}</span>    {/* título derivado do pathname */}
  <button onClick={...}>     {/* abre dropdown de perfil */}
```

Mapa de títulos (`PAGE_TITLES`):
```typescript
const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Home",
  "/transacoes": "Transações",
  "/orcamento": "Orçamento",
  "/familia": "Família",
  "/projetos": "Projetos",
  "/investimentos": "Investimentos",
  "/fluxo": "Fluxo Futuro",
  "/perfil": "Meu Perfil",
  "/cartoes": "Cartões",
};
```

Para rotas dinâmicas (ex: `/projetos/[id]`), o `pathname.startsWith` é usado como fallback.

#### Mobile — Dropdown de perfil multi-nível

Estado: `MenuView = "main" | "cartoes"`.

**Menu principal:**
- Meu Perfil → `/perfil`
- Cartões → troca `menuView` para `"cartoes"`
- Orçamento → `/orcamento`
- Família → `/familia`

**Submenu Cartões** (com botão ← Voltar):
- Gerenciar Cartões → `/cartoes`
- Parcelas → `/cartoes/parcelas`
- Assinatura → `/cartoes/assinaturas`

#### Mobile — Bottom nav

5 slots via `NavSlot = { href, label, icon } | null`:

```
[Home] [Transações] [null ← FAB placeholder] [Projetos] [Invest.]
```

Todos os slots têm `flex-1`, garantindo que o centro do placeholder (`viewport / 2`) coincida com o centro do FAB (`left-1/2`).

#### FAB — posicionamento dentro da nav

```tsx
<button className="fixed bottom-11 left-1/2 -translate-x-1/2 z-50 w-14 h-14 rounded-full bg-blue-600 ring-4 ring-white shadow-lg shadow-blue-600/40">
```

| Elemento | Posição |
|---|---|
| Nav bar topo | ~84px do bottom (altura 64px, margem bottom-5 = 20px) |
| FAB bottom | 44px (bottom-11) |
| FAB topo | 44 + 56 = 100px |
| FAB dentro da nav | 100 − 84 = ~16px sobreposição |
| FAB acima da nav | 84 − 44 = 40px projeção acima |

`ring-4 ring-white` cria separação visual entre o FAB azul e o fundo da nav.

#### FAB — quick-add de transação

Lazy fetch: categorias e cartões são carregados via GET na primeira abertura do modal.

```typescript
if (!quickAddOpen && !categorias) {
  const [catRes, cardRes] = await Promise.all([
    fetch("/api/categorias"),
    fetch("/api/cartoes"),
  ]);
  setCategorias(await catRes.json());
  setCartoes(await cardRes.json());
}
```

Após criar transação: `router.refresh()` para invalidar os Server Components da página atual.

### 2. `src/app/(app)/layout.tsx`

Adicionado `mt-14 sm:mt-0` ao `<main>` para compensar o header fixo de 56px no mobile:

```tsx
<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 sm:pb-8 mt-14 sm:mt-0">
```

### 3. `src/app/api/categorias/route.ts` — GET adicionado

```typescript
export async function GET(_req: NextRequest) {
  // Retorna id, name, icon filtrado por family_id e is_active = true
}
```

### 4. `src/app/api/cartoes/route.ts` — GET adicionado

```typescript
export async function GET(_req: NextRequest) {
  // Retorna id, name, brand filtrado por is_active = true
}
```

---

## Fix do FAB — iteração

**Problema inicial:** FAB em `bottom-[5.5rem]` (88px) ficava **completamente acima** da nav bar (topo da nav ≈ 84px). Os 4px de margem tornavam o FAB flutuante, sem contato visual com a nav.

**Fix:** `bottom-11` (44px) — FAB fica 40px **dentro** da nav e 16px **acima** dela, criando a projeção visual desejada. `ring-4 ring-white` garante a separação estética.

---

## Arquivos modificados (4)

```
src/components/Navbar.tsx                ← reescrita completa
src/app/(app)/layout.tsx                 ← mt-14 sm:mt-0
src/app/api/categorias/route.ts          ← GET adicionado
src/app/api/cartoes/route.ts             ← GET adicionado
```

---

## Verificação

- `tsc --noEmit` → zero erros ✅
- Desktop: link "Home" com ícone correto, sem Fluxo na nav ✅
- Mobile header: título correto em cada página ✅
- Mobile header: dropdown de perfil abre colado ao botão, menu principal funciona ✅
- Dropdown: Cartões → submenu com 3 opções + botão Voltar ✅
- Bottom nav: 4 links nas posições corretas, item ativo destacado ✅
- FAB: centralizado, parcialmente dentro da nav (projeção acima) ✅
- FAB: clicar abre `TransacaoModal` com categorias e cartões carregados ✅
- Após criar transação: página atualiza via `router.refresh()` ✅

---

## Commits

```
48c06aa feat: redesign navegação mobile — header, FAB e menu de perfil
0d2494a fix: ajusta posição do FAB — parcialmente dentro da nav bar mobile
20ac24e docs: sessão 024 — redesign navegação mobile + roadmap Fases 10 e 11
```

Push realizado para `origin/main`.

---

## Próxima sessão

Iniciar **Fase 12** (a definir com o gestor) ou novas melhorias de UX.
