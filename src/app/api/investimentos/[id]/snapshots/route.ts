import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
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

  if (profileError || !profile?.family_id) {
    return NextResponse.json({ error: "Family not configured" }, { status: 400 });
  }

  const { value, date, notes } = await req.json();

  if (value == null || parseFloat(value) < 0) {
    return NextResponse.json({ error: "Valor é obrigatório e deve ser não-negativo" }, { status: 400 });
  }
  if (!date) {
    return NextResponse.json({ error: "Data é obrigatória" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("investment_snapshots")
    .insert({
      investment_id: id,
      family_id: profile.family_id,
      value: parseFloat(value),
      date,
      notes: notes?.trim() ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
