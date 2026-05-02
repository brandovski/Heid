import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Tag } from "lucide-react";
import LogoutButton from "./_components/LogoutButton";

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const name = profile?.full_name ?? null;
  const initials = getInitials(name);

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {/* Avatar + info */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center text-white text-xl font-bold select-none">
          {initials}
        </div>
        {name && (
          <p className="text-lg font-semibold text-brand-700">{name}</p>
        )}
        <p className="text-sm text-brand-700/50">{user.email}</p>
      </div>

      {/* Configurações */}
      <div className="bg-surface rounded-2xl border border-brand-700/10 overflow-hidden">
        <p className="px-4 pt-4 pb-2 text-xs font-semibold text-brand-700/40 uppercase tracking-wide">
          Configurações
        </p>

        <Link
          href="/categorias"
          className="flex items-center gap-3 px-4 py-3.5 hover:bg-brand-700/5 transition-colors border-t border-brand-700/10"
        >
          <Tag size={16} className="text-brand-700/40 shrink-0" />
          <span className="flex-1 text-sm text-brand-700">Categorias de gastos</span>
          <ChevronRight size={16} className="text-brand-700/30" />
        </Link>

        <div className="border-t border-brand-700/10">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
