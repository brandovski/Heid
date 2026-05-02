import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InvestimentoList from "./_components/InvestimentoList";

export default async function InvestimentosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userId = user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id, full_name")
    .eq("id", user.id)
    .single();

  const { data: partnerProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("family_id", profile?.family_id ?? "")
    .neq("id", user.id)
    .single();

  const [
    { data: investments },
    { data: transactions },
    { data: snapshots },
  ] = await Promise.all([
    supabase.from("investments").select("*").order("created_at", { ascending: true }),
    supabase.from("investment_transactions").select("*").order("date", { ascending: false }),
    supabase.from("investment_snapshots").select("*").order("date", { ascending: false }).order("created_at", { ascending: false }),
  ]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 sm:pb-8">
      <div className="hidden sm:block mb-6">
        <h1 className="text-xl font-bold text-brand-700">Investimentos</h1>
        <p className="text-sm text-brand-700/50 mt-1">Acompanhe seus aportes e evolução patrimonial.</p>
      </div>
      <InvestimentoList
        investments={investments ?? []}
        transactions={transactions ?? []}
        snapshots={snapshots ?? []}
        userId={userId}
        userName={profile?.full_name ?? "Você"}
        partnerName={partnerProfile?.full_name ?? "Parceiro"}
      />
    </div>
  );
}
