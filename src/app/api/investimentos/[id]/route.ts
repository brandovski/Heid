import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const {
    name,
    description,
    type,
    scope,
    goal_amount,
    monthly_contribution_amount,
    monthly_contribution_day,
    is_eligible_for_projects,
    is_active,
  } = body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name?.trim();
  if (description !== undefined) updates.description = description?.trim() ?? null;
  if (type !== undefined) updates.type = type;
  if (scope !== undefined) updates.scope = scope;
  if (goal_amount !== undefined) updates.goal_amount = goal_amount != null ? parseFloat(goal_amount) : null;
  if (monthly_contribution_amount !== undefined)
    updates.monthly_contribution_amount = monthly_contribution_amount != null ? parseFloat(monthly_contribution_amount) : null;
  if (monthly_contribution_day !== undefined)
    updates.monthly_contribution_day = monthly_contribution_day != null ? parseInt(monthly_contribution_day) : null;
  if (is_eligible_for_projects !== undefined) updates.is_eligible_for_projects = is_eligible_for_projects;
  if (is_active !== undefined) updates.is_active = is_active;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("investments")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}
