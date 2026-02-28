import { createClient } from "@/lib/supabase/server";
import { CreditCard } from "lucide-react";
import CartaoList from "./_components/CartaoList";

export default async function CartoesPage() {
  const supabase = await createClient();

  const { data: cartoes } = await supabase
    .from("credit_cards")
    .select("*")
    .order("name");

  return (
    <div>
      <div className="hidden sm:flex items-center gap-3 mb-6">
        <CreditCard className="text-brand-600" size={24} />
        <h1 className="text-2xl font-bold text-gray-900">Cartões de Crédito</h1>
      </div>
      <CartaoList initialData={cartoes ?? []} />
    </div>
  );
}
