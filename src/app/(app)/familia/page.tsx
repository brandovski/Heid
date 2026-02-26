import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FamiliaView from "./_components/FamiliaView";
import type { FamilyTransaction } from "./_components/types";

export default async function FamiliaPage({
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

  const [y, m] = mes.split("-").map(Number);
  const firstDay = `${mes}-01`;
  const lastDay = `${mes}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;

  const [
    { data: profiles },
    { data: contributions },
    { data: familyTransactions },
    { data: categories },
    { data: creditCards },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("family_id", profile.family_id),

    supabase
      .from("family_contributions")
      .select("id, user_id, amount, date, transaction_id, notes, created_at")
      .eq("family_id", profile.family_id)
      .gte("date", firstDay)
      .lte("date", lastDay)
      .order("date", { ascending: false }),

    supabase
      .from("transactions")
      .select(
        "id, description, amount, date, type, status, auto_generated, category_id, credit_card_id, category:categories(name, icon, color)"
      )
      .eq("family_id", profile.family_id)
      .eq("scope", "family")
      .neq("status", "cancelled")
      .gte("date", firstDay)
      .lte("date", lastDay)
      .order("date", { ascending: false }),

    supabase
      .from("categories")
      .select("id, name, icon, color")
      .eq("family_id", profile.family_id)
      .eq("is_active", true)
      .order("name"),

    supabase
      .from("credit_cards")
      .select("id, name, brand, color")
      .eq("family_id", profile.family_id)
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <FamiliaView
      currentMonth={mes}
      userId={user.id}
      members={profiles ?? []}
      contributions={contributions ?? []}
      familyTransactions={
        (familyTransactions as unknown as FamilyTransaction[]) ?? []
      }
      categorias={categories ?? []}
      cartoes={creditCards ?? []}
    />
  );
}
