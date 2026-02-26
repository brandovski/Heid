import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OrcamentoList from "./_components/OrcamentoList";

export default async function OrcamentoPage({
  searchParams,
}: {
  searchParams: { mes?: string; escopo?: string };
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
  const escopo = searchParams.escopo === "personal" ? "personal" : ("family" as const);

  // Datas de início e fim do mês
  const [y, m] = mes.split("-").map(Number);
  const firstDay = `${mes}-01`;
  const lastDay = `${mes}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;

  // Busca paralela: budgets + transações de despesa + categorias
  let budgetsQuery = supabase
    .from("budgets")
    .select("*, category:categories(id, name, icon, color)")
    .eq("family_id", profile.family_id)
    .eq("reference_month", mes)
    .eq("scope", escopo)
    .order("created_at");

  if (escopo === "personal") {
    budgetsQuery = budgetsQuery.eq("user_id", user.id);
  }

  let txQuery = supabase
    .from("transactions")
    .select("amount, status, category_id, type, scope, user_id")
    .eq("family_id", profile.family_id)
    .in("type", ["expense", "fixed_expense", "installment", "subscription"])
    .neq("status", "cancelled")
    .gte("date", firstDay)
    .lte("date", lastDay)
    .eq("scope", escopo);

  if (escopo === "personal") {
    txQuery = txQuery.eq("user_id", user.id);
  }

  const [{ data: budgets }, { data: transactions }, { data: categories }] =
    await Promise.all([
      budgetsQuery,
      txQuery,
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
      escopo={escopo}
      userId={user.id}
    />
  );
}
