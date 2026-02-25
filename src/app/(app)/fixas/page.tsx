import { createClient } from "@/lib/supabase/server";
import { Repeat } from "lucide-react";
import FixaList from "./_components/FixaList";

export default async function FixasPage() {
  const supabase = await createClient();

  const [
    { data: receitas },
    { data: despesas },
    { data: categorias },
    { data: cartoes },
  ] = await Promise.all([
    supabase.from("fixed_incomes").select("*").order("description"),
    supabase.from("fixed_expenses").select("*").order("description"),
    supabase
      .from("categories")
      .select("id, name, icon, color")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("credit_cards")
      .select("id, name, brand")
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Repeat className="text-blue-600" size={24} />
        <h1 className="text-2xl font-bold text-gray-900">
          Receitas e Despesas Fixas
        </h1>
      </div>
      <FixaList
        receitas={receitas ?? []}
        despesas={despesas ?? []}
        categorias={categorias ?? []}
        cartoes={cartoes ?? []}
      />
    </div>
  );
}
