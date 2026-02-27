import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AssinaturaList from "./_components/AssinaturaList";
import type { SubscriptionWithRelations } from "./_components/types";

export default async function AssinaturasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [assinaturasRes, categoriasRes, cartoesRes] = await Promise.all([
    supabase
      .from("subscriptions")
      .select(
        "*, credit_card:credit_cards(id, name, brand), category:categories(id, name, icon, color)"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("id, name, icon")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("credit_cards")
      .select("id, name, brand")
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AssinaturaList
        assinaturas={(assinaturasRes.data ?? []) as unknown as SubscriptionWithRelations[]}
        categorias={categoriasRes.data ?? []}
        cartoes={cartoesRes.data ?? []}
      />
    </div>
  );
}
