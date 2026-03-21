"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Home,
  CreditCard as CreditCardIcon,
  ArrowLeftRight,
  PieChart,
  Users,
  User,
  Layers,
  RefreshCw,
  Target,
  TrendingUp,
  Plus,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import TransacaoModal from "@/app/(app)/transacoes/_components/TransacaoModal";
import type { Category, CreditCard as CreditCardDB } from "@/types/database";

type MenuView = "main" | "cartoes";

interface QuickAddData {
  categorias: Pick<Category, "id" | "name" | "icon" | "type">[];
  cartoes: Pick<CreditCardDB, "id" | "name" | "brand">[];
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Home",
  "/transacoes": "Transações",
  "/projetos": "Projetos",
  "/investimentos": "Investimentos",
  "/orcamento": "Orçamento",
  "/familia": "Família",
  "/cartoes": "Cartões",
  "/assinaturas": "Assinaturas",
  "/parcelamentos": "Parcelas",
  "/perfil": "Perfil",
  "/fluxo": "Fluxo",
  "/categorias": "Categorias",
  "/fixas": "Recorrências",
};

type NavSlot =
  | { href: string; label: string; icon: React.ElementType }
  | null;

const mobileNavSlots: NavSlot[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/transacoes", label: "Transações", icon: ArrowLeftRight },
  null, // FAB placeholder
  { href: "/projetos", label: "Projetos", icon: Target },
  { href: "/investimentos", label: "Invest.", icon: TrendingUp },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<MenuView>("main");
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddData, setQuickAddData] = useState<QuickAddData | null>(null);

  const isActive = (href: string) => pathname.startsWith(href);

  const pageTitle =
    Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path))?.[1] ??
    "Heid";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setProfileMenuOpen(false);
        setMenuView("main");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleOpenQuickAdd() {
    setShowQuickAdd(true);
    if (!quickAddData) {
      setQuickAddLoading(true);
      const [catsRes, cardsRes] = await Promise.all([
        fetch("/api/categorias"),
        fetch("/api/cartoes"),
      ]);
      const [cats, cards] = await Promise.all([catsRes.json(), cardsRes.json()]);
      setQuickAddData({
        categorias: Array.isArray(cats) ? cats : [],
        cartoes: Array.isArray(cards) ? cards : [],
      });
      setQuickAddLoading(false);
    }
  }

  function closeProfileMenu() {
    setProfileMenuOpen(false);
    setMenuView("main");
  }

  return (
    <>
      {/* ─── Mobile header ─── */}
      <header className="sm:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-surface/90 backdrop-blur-xl border-b border-brand-700/10 shadow-sm shadow-brand-700/5">
        <div className="flex items-center justify-between h-full px-4">
          <span className="text-[1.5rem] font-bold text-brand-700 font-serif">
            {pageTitle}
          </span>

          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => {
                if (profileMenuOpen) setMenuView("main");
                setProfileMenuOpen((v) => !v);
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                profileMenuOpen
                  ? "bg-brand-700 text-white shadow-sm"
                  : "bg-accent-200 text-brand-700 hover:bg-accent-300"
              }`}
              aria-label="Abrir menu"
            >
              <User size={16} strokeWidth={2} />
            </button>

            {profileMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={closeProfileMenu} />
                <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-52 bg-surface rounded-panel shadow-panel border border-brand-700/10 overflow-hidden">
                  {menuView === "main" ? (
                    <>
                      <div className="px-4 pt-3 pb-1.5">
                        <p className="text-[10px] font-semibold text-brand-700/40 uppercase tracking-widest">
                          Menu
                        </p>
                      </div>

                      <Link
                        href="/perfil"
                        onClick={closeProfileMenu}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-brand-700/80 hover:bg-accent-100 transition-colors"
                      >
                        <User size={14} className="text-brand-700/40 shrink-0" />
                        Meu Perfil
                      </Link>

                      <button
                        type="button"
                        onClick={() => setMenuView("cartoes")}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm text-brand-700/80 hover:bg-accent-100 transition-colors border-t border-brand-700/5"
                      >
                        <div className="flex items-center gap-3">
                          <CreditCardIcon size={14} className="text-brand-700/40 shrink-0" />
                          Cartões
                        </div>
                        <ChevronRight size={14} className="text-brand-700/30" />
                      </button>

                      <Link
                        href="/orcamento"
                        onClick={closeProfileMenu}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-brand-700/80 hover:bg-accent-100 transition-colors border-t border-brand-700/5"
                      >
                        <PieChart size={14} className="text-brand-700/40 shrink-0" />
                        Orçamento
                      </Link>

                      <Link
                        href="/familia"
                        onClick={closeProfileMenu}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-brand-700/80 hover:bg-accent-100 transition-colors border-t border-brand-700/5"
                      >
                        <Users size={14} className="text-brand-700/40 shrink-0" />
                        Família
                      </Link>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setMenuView("main")}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-brand-700 hover:bg-accent-100 transition-colors border-b border-brand-700/10"
                      >
                        <ChevronLeft size={14} />
                        Cartões
                      </button>

                      <Link
                        href="/cartoes"
                        onClick={closeProfileMenu}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-brand-700/80 hover:bg-accent-100 transition-colors"
                      >
                        <CreditCardIcon size={14} className="text-brand-700/40 shrink-0" />
                        Gerenciar Cartões
                      </Link>

                      <Link
                        href="/parcelamentos"
                        onClick={closeProfileMenu}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-brand-700/80 hover:bg-accent-100 transition-colors border-t border-brand-700/5"
                      >
                        <Layers size={14} className="text-brand-700/40 shrink-0" />
                        Parcelas
                      </Link>

                      <Link
                        href="/assinaturas"
                        onClick={closeProfileMenu}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-brand-700/80 hover:bg-accent-100 transition-colors border-t border-brand-700/5"
                      >
                        <RefreshCw size={14} className="text-brand-700/40 shrink-0" />
                        Assinatura
                      </Link>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Mobile FAB ─── */}
      <button
        type="button"
        onClick={handleOpenQuickAdd}
        className="sm:hidden fixed bottom-11 left-1/2 -translate-x-1/2 z-50 w-14 h-14 rounded-full bg-brand-700 ring-4 ring-surface shadow-lg shadow-brand-700/40 flex items-center justify-center text-white active:scale-95 transition-transform"
        aria-label="Nova transação"
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {/* ─── Mobile bottom navigation ─── */}
      <nav className="sm:hidden fixed bottom-5 left-4 right-4 z-40 bg-accent-400/80 backdrop-blur-xl rounded-panel shadow-panel border border-accent-400/30">
        <div className="flex items-center h-16 px-1">
          {mobileNavSlots.map((item, i) => {
            if (!item) {
              return <div key="fab-slot" className="flex-1" aria-hidden="true" />;
            }
            const { href, label, icon: Icon } = item;
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl transition-all ${
                  active
                    ? "bg-accent-200/80 text-brand-700"
                    : "text-brand-700/50 hover:text-brand-700"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ─── Quick add modal ─── */}
      {showQuickAdd &&
        (quickAddLoading || !quickAddData ? (
          <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center sm:p-4">
            <div className="w-full sm:max-w-md bg-surface rounded-t-panel sm:rounded-panel p-12 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-brand-700 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        ) : (
          <TransacaoModal
            transacao={null}
            categorias={quickAddData.categorias}
            cartoes={quickAddData.cartoes}
            onClose={() => setShowQuickAdd(false)}
            onSaved={() => {
              setShowQuickAdd(false);
              router.refresh();
            }}
          />
        ))}
    </>
  );
}
