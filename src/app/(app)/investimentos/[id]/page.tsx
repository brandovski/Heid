import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import InvestimentoDetalhe from "./_components/InvestimentoDetalhe";
import type { Profile } from "@/types/database";

export default async function InvestimentoDetalhePage({
  params,
}: {
  params: { id: string };
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

  const [
    { data: investment },
    { data: transactions },
    { data: snapshots },
    { data: projectItems },
    { data: members },
  ] = await Promise.all([
    supabase.from("investments").select("*").eq("id", params.id).single(),
    supabase
      .from("investment_transactions")
      .select("*")
      .eq("investment_id", params.id)
      .order("date", { ascending: false }),
    supabase
      .from("investment_snapshots")
      .select("*")
      .eq("investment_id", params.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("project_items")
      .select("id, name, actual_amount, budget_amount, expected_payment_date, status, payment_type, deposit_amount, remainder_date, deposit_transaction_id, investment_deposit_id, project:projects(id, name)")
      .eq("investment_id", params.id)
      .in("status", ["confirmed", "paid"]),
    profile?.family_id
      ? supabase
          .from("profiles")
          .select("id, full_name")
          .eq("family_id", profile.family_id)
      : Promise.resolve({ data: [] }),
  ]);

  if (!investment) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 sm:pb-8">
      <InvestimentoDetalhe
        investment={investment}
        transactions={transactions ?? []}
        snapshots={snapshots ?? []}
        projectItems={projectItems ?? []}
        members={(members ?? []) as Pick<Profile, "id" | "full_name">[]}
      />
    </div>
  );
}
