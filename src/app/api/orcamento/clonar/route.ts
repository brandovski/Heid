import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function previousMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();

  if (!profile?.family_id) {
    return NextResponse.json({ error: "Family not configured" }, { status: 400 });
  }

  const { reference_month, scope } = await req.json();
  if (!reference_month) {
    return NextResponse.json({ error: "reference_month obrigatório" }, { status: 400 });
  }

  const finalScope = scope ?? "family";
  const prevMonth = previousMonth(reference_month);

  // Busca orçamentos do mês anterior
  let prevQuery = supabase
    .from("budgets")
    .select("category_id, planned_amount, notes, scope, user_id")
    .eq("family_id", profile.family_id)
    .eq("reference_month", prevMonth)
    .eq("scope", finalScope);
  if (finalScope === "personal") prevQuery = prevQuery.eq("user_id", user.id);

  const { data: prevBudgets, error: fetchErr } = await prevQuery;
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!prevBudgets?.length) {
    return NextResponse.json(
      { error: "Nenhum orçamento encontrado no mês anterior" },
      { status: 404 }
    );
  }

  // Busca categorias que já existem no mês destino (pré-filtro — evita conflito de índice parcial)
  let existingQuery = supabase
    .from("budgets")
    .select("category_id")
    .eq("family_id", profile.family_id)
    .eq("reference_month", reference_month)
    .eq("scope", finalScope);
  if (finalScope === "personal") existingQuery = existingQuery.eq("user_id", user.id);

  const { data: existing } = await existingQuery;
  const existingIds = new Set(existing?.map((b) => b.category_id) ?? []);

  // Filtra apenas as categorias que ainda não têm orçamento no mês destino
  const toInsert = prevBudgets
    .filter((b) => !existingIds.has(b.category_id))
    .map((b) => ({
      family_id: profile.family_id,
      reference_month,
      category_id: b.category_id,
      planned_amount: b.planned_amount,
      notes: b.notes,
      scope: b.scope,
      user_id: b.user_id,
    }));

  if (!toInsert.length) {
    return NextResponse.json({ cloned: 0 });
  }

  const { error: insertErr } = await supabase.from("budgets").insert(toInsert);
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  return NextResponse.json({ cloned: toInsert.length });
}
