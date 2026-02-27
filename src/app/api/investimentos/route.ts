import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get("active") === "true";

  let query = supabase.from("investments").select("*").order("created_at", { ascending: true });
  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
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

  const {
    name,
    type,
    scope,
    description,
    goal_amount,
    monthly_contribution_amount,
    monthly_contribution_day,
    is_eligible_for_projects,
  } = await req.json();

  if (!name?.trim()) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  if (!type) return NextResponse.json({ error: "Tipo é obrigatório" }, { status: 400 });
  if (!scope) return NextResponse.json({ error: "Escopo é obrigatório" }, { status: 400 });

  // Both or neither for monthly contribution
  const hasAmount = monthly_contribution_amount != null && monthly_contribution_amount !== "";
  const hasDay = monthly_contribution_day != null && monthly_contribution_day !== "";
  if (hasAmount !== hasDay) {
    return NextResponse.json(
      { error: "Valor e dia do aporte mensal devem ser definidos juntos" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("investments")
    .insert({
      family_id: profile.family_id,
      user_id: user.id,
      name: name.trim(),
      type,
      scope,
      description: description?.trim() ?? null,
      goal_amount: goal_amount != null ? parseFloat(goal_amount) : null,
      monthly_contribution_amount: hasAmount ? parseFloat(monthly_contribution_amount) : null,
      monthly_contribution_day: hasDay ? parseInt(monthly_contribution_day) : null,
      is_eligible_for_projects: is_eligible_for_projects ?? false,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
