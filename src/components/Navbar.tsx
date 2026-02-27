"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  PieChart,
  Users,
  User,
  ChevronDown,
  Layers,
  RefreshCw,
} from "lucide-react";

const mobileNavItems = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/transacoes", label: "Transações", icon: ArrowLeftRight },
  { href: "/cartoes", label: "Cartões", icon: CreditCard },
  { href: "/orcamento", label: "Orçamento", icon: PieChart },
  { href: "/familia", label: "Família", icon: Users },
];

const cartoesDropdownItems = [
  { href: "/cartoes", label: "Gerenciar Cartões", icon: CreditCard },
  { href: "/assinaturas", label: "Assinaturas", icon: RefreshCw },
  { href: "/parcelamentos", label: "Parcelas", icon: Layers },
];

export default function Navbar() {
  const pathname = usePathname();
  const [cartoesOpen, setCartoesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => pathname.startsWith(href);
  const isCartoesActive =
    pathname.startsWith("/cartoes") ||
    pathname.startsWith("/assinaturas") ||
    pathname.startsWith("/parcelamentos");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCartoesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Desktop — top navbar */}
      <nav className="hidden sm:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-gray-900 mr-6">Couple</span>

              <Link
                href="/dashboard"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>

              <Link
                href="/transacoes"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/transacoes")
                    ? "bg-blue-50 text-blue-700"
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
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <CreditCard size={16} />
                  Cartões
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${cartoesOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {cartoesOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    {cartoesDropdownItems.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setCartoesOpen(false)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                          isActive(href)
                            ? "text-blue-700 bg-blue-50"
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
                    ? "bg-blue-50 text-blue-700"
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
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Users size={16} />
                Família
              </Link>
            </div>

            {/* Perfil */}
            <Link
              href="/perfil"
              className={`p-2 rounded-lg transition-colors ${
                isActive("/perfil")
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
              aria-label="Perfil"
            >
              <User size={18} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile — botão de perfil fixo no canto superior direito */}
      <Link
        href="/perfil"
        className="sm:hidden fixed top-4 right-4 z-30 w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shadow-sm hover:bg-gray-200 transition-colors"
        aria-label="Perfil"
      >
        <User size={18} />
      </Link>

      {/* Mobile — bottom navigation */}
      <nav className="sm:hidden fixed bottom-5 left-4 right-4 z-40 bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/10 border border-white/50">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileNavItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl transition-all ${
                  active
                    ? "bg-white/80 text-blue-600"
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
    </>
  );
}
