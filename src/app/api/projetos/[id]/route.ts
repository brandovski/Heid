import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();
  if (profileError || !profile?.family_id)
    return NextResponse.json({ error: "Family not configured" }, { status: 400 });

  const body = await req.json();
  const { name, description, total_budget, target_date, scope, status } = body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name?.trim();
  if (description !== undefined) updates.description = description?.trim() ?? null;
  if (total_budget !== undefined) updates.total_budget = parseFloat(total_budget);
  if (target_date !== undefined) updates.target_date = target_date ?? null;
  if (scope !== undefined) updates.scope = scope;
  if (status !== undefined) {
    if (!["active", "completed", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }
    updates.status = status;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .eq("family_id", profile.family_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}
