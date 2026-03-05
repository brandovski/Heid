import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TransacaoList from "./_components/TransacaoList";
import type { TransactionWithRelations, InvoicePaymentSimple } from "./_components/types";

function getMonthRange(mes: string) {
  const [year, month] = mes.split("-").map(Number);
  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).toISOString().split("T")[0];
  return { firstDay, lastDay };
}

export default async function TransacoesPage({
  searchParams,
}: {
  searchParams: { mes?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date();
  const mes =
    searchParams.mes ??
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const { firstDay, lastDay } = getMonthRange(mes);

  // Buscar profile do usuário (para family_id, share_with_partner e full_name)
  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id, share_with_partner, full_name")
    .eq("id", user.id)
    .single();

  // Buscar perfis da família para nome do parceiro
  let partnerName = "Parceiro";
  if (profile?.family_id) {
    const { data: partnerProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("family_id", profile.family_id)
      .neq("id", user.id)
      .single();
    partnerName = partnerProfile?.full_name ?? "Parceiro";
  }

  const [transacoesRes, categoriasRes, cartoesRes, invoicePaymentsRes] = await Promise.all([
    supabase
      .from("transactions")
      .select(
        "*, category:categories(id, name, icon, color), credit_card:credit_cards(id, name, brand, color)"
      )
      .eq("scope", "personal")
      .gte("date", firstDay)
      .lte("date", lastDay)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("id, name, icon, color, type")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("credit_cards")
      .select("id, name, brand, color")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("invoice_payments")
      .select("id, credit_card_id, amount_paid, paid_at")
      .eq("reference_month", mes),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <TransacaoList
        transacoes={(transacoesRes.data ?? []) as unknown as TransactionWithRelations[]}
        categorias={categoriasRes.data ?? []}
        cartoes={cartoesRes.data ?? []}
        invoicePayments={(invoicePaymentsRes.data ?? []) as InvoicePaymentSimple[]}
        mes={mes}
        currentUserId={user.id}
        userName={profile?.full_name ?? "Eu"}
        partnerName={partnerName}
        shareWithPartner={profile?.share_with_partner ?? false}
      />
    </div>
  );
}
