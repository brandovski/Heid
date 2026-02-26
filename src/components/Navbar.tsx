"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Tag,
  CreditCard,
  Repeat,
  ArrowLeftRight,
  Layers,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Todos os itens aparecem no desktop
const desktopNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transacoes", label: "Transações", icon: ArrowLeftRight },
  { href: "/parcelamentos", label: "Parcelas", icon: Layers },
  { href: "/assinaturas", label: "Assinaturas", icon: RefreshCw },
  { href: "/fixas", label: "Fixas", icon: Repeat },
  { href: "/categorias", label: "Categorias", icon: Tag },
  { href: "/cartoes", label: "Cartões", icon: CreditCard },
];

// Mobile: apenas os mais frequentes (5 itens)
const mobileNavItems = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/transacoes", label: "Transações", icon: ArrowLeftRight },
  { href: "/parcelamentos", label: "Parcelas", icon: Layers },
  { href: "/assinaturas", label: "Assinat.", icon: RefreshCw },
  { href: "/fixas", label: "Fixas", icon: Repeat },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      {/* Desktop — top navbar */}
      <nav className="hidden sm:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-gray-900 mr-6">Couple</span>
              {desktopNavItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(href)
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile — bottom navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 safe-area-pb">
        <div className="flex items-center justify-around h-16">
          {mobileNavItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive(href)
                  ? "text-blue-600"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              <Icon size={20} strokeWidth={isActive(href) ? 2.5 : 1.75} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={20} strokeWidth={1.75} />
            <span className="text-[10px] font-medium">Sair</span>
          </button>
        </div>
      </nav>
    </>
  );
}
