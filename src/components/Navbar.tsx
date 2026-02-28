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
  ChevronDown,
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
  categorias: Pick<Category, "id" | "name" | "icon">[];
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
};

const desktopCartoesItems = [
  { href: "/cartoes", label: "Gerenciar Cartões", icon: CreditCardIcon },
  { href: "/assinaturas", label: "Assinaturas", icon: RefreshCw },
  { href: "/parcelamentos", label: "Parcelas", icon: Layers },
];

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

  // Desktop Cartões dropdown
  const [cartoesOpen, setCartoesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mobile profile menu
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<MenuView>("main");
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Quick add transaction
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddData, setQuickAddData] = useState<QuickAddData | null>(null);

  const isActive = (href: string) => pathname.startsWith(href);
  const isCartoesActive =
    pathname.startsWith("/cartoes") ||
    pathname.startsWith("/assinaturas") ||
    pathname.startsWith("/parcelamentos");

  const pageTitle =
    Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path))?.[1] ??
    "Heid";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCartoesOpen(false);
      }
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
      {/* ─── Desktop top navbar ─── */}
      <nav className="hidden sm:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-brand-700 mr-6">Heid</span>

              <Link
                href="/dashboard"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "bg-brand-100 text-brand-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Home size={16} />
                Home
              </Link>

              <Link
                href="/transacoes"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/transacoes")
                    ? "bg-brand-100 text-brand-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <ArrowLeftRight size={16} />
                Transações
              </Link>

              {/* Cartões dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setCartoesOpen((v) => !v)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isCartoesActive
                      ? "bg-brand-100 text-brand-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <CreditCardIcon size={16} />
                  Cartões
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${cartoesOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {cartoesOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    {desktopCartoesItems.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setCartoesOpen(false)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                          isActive(href)
                            ? "text-brand-700 bg-brand-100"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Icon size={15} />
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/orcamento"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/orcamento")
                    ? "bg-brand-100 text-brand-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <PieChart size={16} />
                Orçamento
              </Link>

              <Link
                href="/familia"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/familia")
                    ? "bg-brand-100 text-brand-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Users size={16} />
                Família
              </Link>

              <Link
                href="/projetos"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/projetos")
                    ? "bg-brand-100 text-brand-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Target size={16} />
                Projetos
              </Link>

              <Link
                href="/investimentos"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/investimentos")
                    ? "bg-brand-100 text-brand-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <TrendingUp size={16} />
                Investimentos
              </Link>
            </div>

            <Link
              href="/perfil"
              className={`p-2 rounded-lg transition-colors ${
                isActive("/perfil")
                  ? "bg-brand-100 text-brand-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
              aria-label="Perfil"
            >
              <User size={18} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Mobile header ─── */}
      <header className="sm:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 shadow-sm shadow-black/5">
        <div className="flex items-center justify-between h-full px-4">
          <span className="text-[1.5rem] font-bold text-gray-900 font-serif">
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
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              aria-label="Abrir menu"
            >
              <User size={16} strokeWidth={2} />
            </button>

            {profileMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={closeProfileMenu} />
                <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-52 bg-white rounded-2xl shadow-xl shadow-black/10 border border-gray-100 overflow-hidden">
                  {menuView === "main" ? (
                    <>
                      <div className="px-4 pt-3 pb-1.5">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                          Menu
                        </p>
                      </div>

                      <Link
                        href="/perfil"
                        onClick={closeProfileMenu}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User size={14} className="text-gray-400 shrink-0" />
                        Meu Perfil
                      </Link>

                      <button
                        type="button"
                        onClick={() => setMenuView("cartoes")}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <CreditCardIcon size={14} className="text-gray-400 shrink-0" />
                          Cartões
                        </div>
                        <ChevronRight size={14} className="text-gray-300" />
                      </button>

                      <Link
                        href="/orcamento"
                        onClick={closeProfileMenu}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-50"
                      >
                        <PieChart size={14} className="text-gray-400 shrink-0" />
                        Orçamento
                      </Link>

                      <Link
                        href="/familia"
                        onClick={closeProfileMenu}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-50"
                      >
                        <Users size={14} className="text-gray-400 shrink-0" />
                        Família
                      </Link>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setMenuView("main")}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-brand-600 hover:bg-brand-100/50 transition-colors border-b border-gray-100"
                      >
                        <ChevronLeft size={14} />
                        Cartões
                      </button>

                      <Link
                        href="/cartoes"
                        onClick={closeProfileMenu}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <CreditCardIcon size={14} className="text-gray-400 shrink-0" />
                        Gerenciar Cartões
                      </Link>

                      <Link
                        href="/parcelamentos"
                        onClick={closeProfileMenu}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-50"
                      >
                        <Layers size={14} className="text-gray-400 shrink-0" />
                        Parcelas
                      </Link>

                      <Link
                        href="/assinaturas"
                        onClick={closeProfileMenu}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-50"
                      >
                        <RefreshCw size={14} className="text-gray-400 shrink-0" />
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
      {/* bottom-11 (44px): FAB de 56px vai de 44–100px; nav de 20–84px → 40px dentro da nav, 16px acima */}
      <button
        type="button"
        onClick={handleOpenQuickAdd}
        className="sm:hidden fixed bottom-11 left-1/2 -translate-x-1/2 z-50 w-14 h-14 rounded-full bg-brand-600 ring-4 ring-white shadow-lg shadow-brand-600/40 flex items-center justify-center text-white active:scale-95 transition-transform"
        aria-label="Nova transação"
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {/* ─── Mobile bottom navigation ─── */}
      <nav className="sm:hidden fixed bottom-5 left-4 right-4 z-40 bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/10 border border-white/50">
        <div className="flex items-center h-16 px-1">
          {mobileNavSlots.map((item, i) => {
            if (!item) {
              // Blank space for FAB
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
                    ? "bg-white/80 text-brand-600"
                    : "text-gray-400 hover:text-gray-700"
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
            <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-12 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
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
