"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Users,
  CreditCard,
  RefreshCw,
  Layers,
  PieChart,
  Target,
  TrendingUp,
  UserRound,
  HouseHeart,
  LayoutDashboard,
} from "lucide-react";

const navGroups = [
  {
    items: [
      { href: "/dashboard", label: "Home", icon: LayoutDashboard },
      { href: "/transacoes", label: "Transações", icon: ArrowLeftRight },
      { href: "/familia", label: "Família", icon: Users },
    ],
  },
  {
    label: "Gerenciar Cartões",
    items: [
      { href: "/cartoes", label: "Cartões", icon: CreditCard },
      { href: "/assinaturas", label: "Assinaturas", icon: RefreshCw },
      { href: "/parcelamentos", label: "Parcelas", icon: Layers },
    ],
  },
  {
    label: "Planejamento",
    items: [
      { href: "/orcamento", label: "Orçamento", icon: PieChart },
      { href: "/projetos", label: "Projetos", icon: Target },
      { href: "/investimentos", label: "Investimentos", icon: TrendingUp },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <aside className="hidden sm:flex fixed inset-y-0 left-0 w-[260px] z-40 flex-col justify-center p-5">
      <div className="flex flex-col bg-accent-400 rounded-panel shadow-panel">

        {/* Logo */}
        <div className="flex items-center gap-2 px-4 pt-5 pb-4">
          <div className="w-8 h-8 rounded-card bg-brand-700 flex items-center justify-center shrink-0">
            <HouseHeart size={15} className="text-accent-300" strokeWidth={1.75} />
          </div>
          <span className="font-serif text-xl leading-none text-brand-700">
            Heid
          </span>
        </div>

        {/* Nav groups */}
        <nav className="flex flex-col gap-3 px-[10px]">
          {navGroups.map((group, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              {group.label && (
                <p className="px-3 pt-1 pb-0.5 text-[10px] font-medium text-brand-700/50 uppercase tracking-[0.12em]">
                  {group.label}
                </p>
              )}
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-[7px] px-3 py-[6px] rounded-pill text-[13px] font-sans transition-all duration-150 ${
                      active
                        ? "bg-accent-200 text-brand-700 font-medium"
                        : "text-brand-700/65 hover:bg-brand-700/5 hover:text-brand-700"
                    }`}
                  >
                    <Icon
                      size={14}
                      strokeWidth={active ? 2 : 1.75}
                      className="shrink-0"
                    />
                    {label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Profile */}
        <div className="px-[10px] pt-3 pb-[10px]">
          <div className="h-px bg-brand-700/10 mb-2 mx-2" />
          <Link
            href="/perfil"
            className={`flex items-center gap-[7px] px-3 py-[6px] rounded-pill text-[13px] font-sans transition-all duration-150 ${
              isActive("/perfil")
                ? "bg-accent-200 text-brand-700 font-medium"
                : "text-brand-700/65 hover:bg-brand-700/5 hover:text-brand-700"
            }`}
          >
            <UserRound
              size={14}
              strokeWidth={isActive("/perfil") ? 2 : 1.75}
              className="shrink-0"
            />
            Meu Perfil
          </Link>
        </div>

      </div>
    </aside>
  );
}
