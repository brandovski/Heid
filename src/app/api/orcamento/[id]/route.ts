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

  const { planned_amount, notes } = await req.json();

  if (planned_amount !== undefined) {
    const amount = parseFloat(planned_amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    }
  }

  const updates: Record<string, unknown> = {};
  if (planned_amount !== undefined) updates.planned_amount = parseFloat(planned_amount);
  if (notes !== undefined) updates.notes = notes || null;

  const { data, error } = await supabase
    .from("budgets")
    .update(updates)
    .eq("id", id)
    .eq("family_id", profile.family_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
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

  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)
    .eq("family_id", profile.family_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
