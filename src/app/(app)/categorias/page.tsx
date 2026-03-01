import { createClient } from "@/lib/supabase/server";
import { Tag } from "lucide-react";
import CategoriaList from "./_components/CategoriaList";

export default async function CategoriasPage() {
  const supabase = await createClient();

  const { data: categorias } = await supabase
    .from("categories")
    .select("*")
    .eq("is_system", false)
    .order("name");

  return (
    <div>
      <div className="hidden sm:flex items-center gap-3 mb-6">
        <Tag className="text-brand-600" size={24} />
        <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
      </div>
      <CategoriaList initialData={categorias ?? []} />
    </div>
  );
}
