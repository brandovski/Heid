import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ParcelamentoList from "./_components/ParcelamentoList";
import type { InstallmentGroupWithRelations } from "./_components/types";

export default async function ParcelamentosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [groupsRes, txRes, categoriasRes, cartoesRes] = await Promise.all([
    supabase
      .from("installment_groups")
      .select(
        "*, credit_card:credit_cards(id, name, brand), category:categories(id, name, icon, color)"
      )
      .order("first_installment_date", { ascending: false }),
    supabase
      .from("transactions")
      .select("id, amount, status, date, installment_group_id")
      .eq("type", "installment")
      .not("installment_group_id", "is", null),
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
      <ParcelamentoList
        groups={(groupsRes.data ?? []) as unknown as InstallmentGroupWithRelations[]}
        transactions={txRes.data ?? []}
        categorias={categoriasRes.data ?? []}
        cartoes={cartoesRes.data ?? []}
      />
    </div>
  );
}
