import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Busca cotação USD/BRL
  let rate: number;
  try {
    const res = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL", {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error("API unavailable");
    const data = await res.json();
    rate = parseFloat(data?.USDBRL?.bid);
    if (isNaN(rate)) throw new Error("Invalid rate");
  } catch (err) {
    return NextResponse.json(
      { error: "Cotação indisponível", detail: String(err) },
      { status: 503 }
    );
  }

  const supabase = createServiceClient();

  // Busca assinaturas ativas em USD
  const { data: subscriptions, error: fetchError } = await supabase
    .from("subscriptions")
    .select("id, amount_original")
    .eq("is_active", true)
    .eq("original_currency", "USD");

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!subscriptions?.length) {
    return NextResponse.json({ rate, updated: 0 });
  }

  // Atualiza amount_brl de cada assinatura USD
  const updates = subscriptions.map((sub) => ({
    id: sub.id,
    amount_brl: Math.round(sub.amount_original * rate * 100) / 100,
  }));

  const { error: updateError } = await supabase
    .from("subscriptions")
    .upsert(updates, { onConflict: "id" });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ rate, updated: updates.length });
}
