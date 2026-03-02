# Sessão 030c — 2026-03-02

**Fase:** ConfirmModal + Header Desktop Fixo
**Resultado:** Concluído — 11 arquivos modificados, `tsc --noEmit` limpo, commit + push realizados

---

## Objetivo

Dois problemas de UX identificados e resolvidos:
1. **7 `confirm()` nativos do navegador** — diálogos sem estilo, sem loading state, inconsistentes com o restante da UI
2. **Header desktop não era fixo** — navbar desaparecia ao rolar a página; mobile já tinha `fixed + backdrop-blur`

---

## O que foi feito

### Parte 1 — `src/components/ui/ConfirmModal.tsx` — NOVO

Wrapper sobre o `Modal.tsx` existente (porta, Escape handler, bottom-sheet mobile, centralizado desktop).

**Interface:**
```ts
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  confirmLabel?: string;   // default: "Confirmar"
  cancelLabel?: string;    // default: "Cancelar"
  variant?: "danger" | "warning"; // default: "danger"
}
```

**Design:**
- Ícone `AlertTriangle` (lucide) em círculo colorido no topo do conteúdo:
  - `danger`: `bg-red-50 text-red-500`
  - `warning`: `bg-amber-50 text-amber-500`
- Descrição `text-sm text-gray-500` abaixo do ícone
- Footer com dois botões `flex-1`:
  - Cancelar: `border border-gray-200 text-gray-700`
  - Confirmar `danger`: `bg-red-600 hover:bg-red-700`
  - Confirmar `warning`: `bg-amber-500 hover:bg-amber-600`
- Loading state interno com spinner no botão confirmar (desabilita ambos os botões)
- Renderiza apenas quando `isOpen`: `if (!isOpen) return null`

```tsx
export default function ConfirmModal({ isOpen, ... }) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try { await onConfirm(); } finally { setLoading(false); }
  }

  if (!isOpen) return null;
  return <Modal ...> ... </Modal>;
}
```

---

### Parte 2 — Substituição dos 7 `confirm()` nativos

Padrão aplicado em todos os casos:
- Adicionar `useState` para controlar abertura (`showConfirm`) e, quando múltiplos itens, ID pendente (`pendingDeleteId`)
- Separar a ação destrutiva em função limpa (sem o guard `confirm()`)
- Renderizar `<ConfirmModal>` ao final do JSX, dentro de `<>` fragmento

| Arquivo | Ação | Variant | Botão confirmar | Estado |
|---|---|---|---|---|
| `TransacaoCard.tsx` | Excluir transação | `danger` | "Excluir" | `showConfirm` |
| `FamiliaView.tsx` | Excluir transação familiar | `danger` | "Excluir" | `pendingDeleteTx: FamilyTransaction \| null` |
| `AssinaturaCard.tsx` | Cancelar assinatura | `warning` | "Cancelar assinatura" | `showConfirm` |
| `ParcelamentoCard.tsx` | Cancelar parcelas restantes | `warning` | "Cancelar parcelas" | `showConfirm` |
| `InvestimentoModal.tsx` | Arquivar investimento | `warning` | "Arquivar" | `showArchiveConfirm` |
| `ProjetoDetalhe.tsx` | Excluir grupo + itens | `danger` | "Excluir grupo" | `pendingDeleteId: string \| null` + `doDeleteGroup()` |
| `InvestimentoDetalhe.tsx` | Excluir movimentação | `danger` | "Excluir" | `pendingDeleteId: string \| null` + `doDeleteTx()` |

**Exemplo — padrão simples (`showConfirm`):**
```tsx
// Antes
async function handleDelete() {
  if (!confirm("Excluir?")) return;
  await fetch(...);
}

// Depois
const [showConfirm, setShowConfirm] = useState(false);

async function handleDelete() {
  await fetch(...);
}

// No JSX
<button onClick={() => setShowConfirm(true)}>Excluir</button>
<ConfirmModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Excluir transação"
  description="Excluir permanentemente?"
  confirmLabel="Excluir"
  variant="danger"
/>
```

**Exemplo — padrão com ID pendente (`pendingDeleteId`):**
```tsx
// ProjetoDetalhe: múltiplos grupos, cada um com ID único
const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

function handleDeleteGroup(id: string) {
  setPendingDeleteId(id); // apenas captura o ID
}

async function doDeleteGroup() {
  if (!pendingDeleteId) return;
  await fetch(`/api/projetos/grupos/${pendingDeleteId}`, { method: "DELETE" });
  setGroups(prev => prev.filter(g => g.id !== pendingDeleteId));
  setPendingDeleteId(null);
}
```

---

### Parte 3 — Header desktop fixo com backdrop-blur

#### `src/components/Navbar.tsx` — linha 135

```diff
- <nav className="hidden sm:block bg-white border-b border-gray-200">
+ <nav className="hidden sm:block fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 shadow-sm shadow-black/5">
```

O header desktop agora tem parity com o header mobile (que já era `fixed top-0 ... backdrop-blur-xl` desde a sessão 024).

#### `src/app/(app)/layout.tsx` — linha 22

```diff
- <main className="... mt-14 sm:mt-0">
+ <main className="... mt-14 sm:mt-16">
```

`sm:mt-16` = 64px = altura `h-16` do nav desktop fixo. O dropdown do Cartões (z-50) já ultrapassa o z-40 da nav, sem conflito.

---

## Arquivos modificados (11)

```
src/components/ui/ConfirmModal.tsx                              ← NOVO
src/components/Navbar.tsx
src/app/(app)/layout.tsx
src/app/(app)/transacoes/_components/TransacaoCard.tsx
src/app/(app)/familia/_components/FamiliaView.tsx
src/app/(app)/assinaturas/_components/AssinaturaCard.tsx
src/app/(app)/parcelamentos/_components/ParcelamentoCard.tsx
src/app/(app)/investimentos/_components/InvestimentoModal.tsx
src/app/(app)/projetos/[id]/_components/ProjetoDetalhe.tsx
src/app/(app)/investimentos/[id]/_components/InvestimentoDetalhe.tsx
docs/diario-dev.md
```

---

## Verificação

- `tsc --noEmit` → zero erros ✅
- Nenhum `confirm(` nativo restante no codebase ✅
- Rolar página desktop → navbar permanece visível com efeito blur no topo ✅
- Clicar em excluir transação → modal do sistema (não diálogo nativo) ✅
- Confirmar → spinner + ação executada ✅
- Cancelar → modal fecha sem ação ✅
- Mobile → modal aparece como bottom sheet (herança do Modal.tsx) ✅
- Dropdown Cartões (z-50) ainda sobrepõe o nav (z-40) corretamente ✅

---

## Commits

```
605386c feat: ConfirmModal e header desktop fixo (sessão 030c)
```

Push realizado para `origin/main`.

---

## Próxima sessão

Iniciar **Fase 12** (a definir com o gestor).
