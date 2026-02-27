import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const { name, description, total_budget, target_date, scope } = await req.json();

  if (!name?.trim() || total_budget == null) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const resolvedScope = scope ?? "family";

  const { data, error } = await supabase
    .from("projects")
    .insert({
      family_id: profile.family_id,
      user_id: user.id,
      scope: resolvedScope,
      name: name.trim(),
      description: description?.trim() ?? null,
      total_budget: parseFloat(total_budget),
      target_date: target_date ?? null,
      status: "active",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
