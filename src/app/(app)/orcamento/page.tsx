import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OrcamentoList from "./_components/OrcamentoList";

export default async function OrcamentoPage({
  searchParams,
}: {
  searchParams: { mes?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();

  if (!profile?.family_id) redirect("/dashboard");

  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const mes = searchParams.mes ?? currentMonth;

  // Datas de início e fim do mês
  const [y, m] = mes.split("-").map(Number);
  const firstDay = `${mes}-01`;
  const lastDay = `${mes}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;

  // Orçamento sempre pessoal, filtrado pelo usuário logado
  const [{ data: budgets }, { data: transactions }, { data: categories }] =
    await Promise.all([
      supabase
        .from("budgets")
        .select("*, category:categories(id, name, icon, color)")
        .eq("family_id", profile.family_id)
        .eq("reference_month", mes)
        .eq("scope", "personal")
        .eq("user_id", user.id)
        .order("created_at"),
      supabase
        .from("transactions")
        .select("amount, status, category_id, type, scope, user_id")
        .eq("family_id", profile.family_id)
        .in("type", ["expense", "fixed_expense", "installment", "subscription"])
        .neq("status", "cancelled")
        .gte("date", firstDay)
        .lte("date", lastDay)
        .eq("scope", "personal")
        .eq("user_id", user.id),
      supabase
        .from("categories")
        .select("id, name, icon, color")
        .eq("family_id", profile.family_id)
        .eq("is_active", true)
        .order("name"),
    ]);

  return (
    <OrcamentoList
      budgets={budgets ?? []}
      transactions={transactions ?? []}
      categories={categories ?? []}
      currentMonth={mes}
      userId={user.id}
    />
  );
}
