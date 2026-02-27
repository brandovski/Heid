import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InvestimentoList from "./_components/InvestimentoList";

export default async function InvestimentosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Investimentos</h1>
        <p className="text-sm text-gray-500 mt-1">Acompanhe seus aportes e evolução patrimonial.</p>
      </div>
      <InvestimentoList
        investments={investments ?? []}
        transactions={transactions ?? []}
        snapshots={snapshots ?? []}
      />
    </div>
  );
}
