import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FamiliaView from "./_components/FamiliaView";
import type {
  FamilyTransaction,
  SharedFixedIncome,
  SharedFixedExpense,
  SharedSubscription,
  SharedCreditCard,
} from "./_components/types";

export default async function FamiliaPage({
  searchParams,
}: {
  searchParams: { mes?: string; view?: string };
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
  const view = searchParams.view === "pessoal" ? "pessoal" : "familiar";

  const [y, m] = mes.split("-").map(Number);
  const firstDay = `${mes}-01`;
  const lastDay = `${mes}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;

  const [
    { data: profiles },
    { data: contributions },
    { data: familyTransactions },
    { data: sharedFixedIncomes },
    { data: sharedFixedExpenses },
    { data: sharedSubscriptions },
    { data: sharedCreditCards },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("family_id", profile.family_id),

    supabase
      .from("family_contributions")
      .select("id, user_id, amount, effective_from, notes, created_at")
      .eq("family_id", profile.family_id)
      .lte("effective_from", lastDay)
      .order("effective_from", { ascending: false })
      .limit(20),

    supabase
      .from("transactions")
      .select(
        "id, description, amount, date, type, status, category:categories(name, icon, color)"
      )
      .eq("family_id", profile.family_id)
      .eq("scope", "family")
      .neq("status", "cancelled")
      .gte("date", firstDay)
      .lte("date", lastDay)
      .order("date", { ascending: false }),

    supabase
      .from("fixed_incomes")
      .select(
        "id, description, amount, day_of_month, user_id, category:categories(name, icon)"
      )
      .eq("family_id", profile.family_id)
      .eq("scope", "personal")
      .eq("is_shared", true)
      .eq("is_active", true)
      .neq("user_id", user.id),

    supabase
      .from("fixed_expenses")
      .select(
        "id, description, amount, day_of_month, user_id, category:categories(name, icon)"
      )
      .eq("family_id", profile.family_id)
      .eq("scope", "personal")
      .eq("is_shared", true)
      .eq("is_active", true)
      .neq("user_id", user.id),

    supabase
      .from("subscriptions")
      .select(
        "id, name, amount_brl, original_currency, amount_original, billing_day, user_id, category:categories(name, icon)"
      )
      .eq("family_id", profile.family_id)
      .eq("scope", "personal")
      .eq("is_shared", true)
      .eq("is_active", true)
      .neq("user_id", user.id),

    supabase
      .from("credit_cards")
      .select("id, name, brand, user_id")
      .eq("family_id", profile.family_id)
      .eq("scope", "personal")
      .eq("is_shared", true)
      .eq("is_active", true)
      .neq("user_id", user.id),
  ]);

  return (
    <FamiliaView
      currentMonth={mes}
      view={view}
      userId={user.id}
      members={profiles ?? []}
      contributions={contributions ?? []}
      familyTransactions={(familyTransactions as unknown as FamilyTransaction[]) ?? []}
      sharedFixedIncomes={(sharedFixedIncomes as unknown as SharedFixedIncome[]) ?? []}
      sharedFixedExpenses={(sharedFixedExpenses as unknown as SharedFixedExpense[]) ?? []}
      sharedSubscriptions={(sharedSubscriptions as unknown as SharedSubscription[]) ?? []}
      sharedCreditCards={(sharedCreditCards as unknown as SharedCreditCard[]) ?? []}
    />
  );
}
