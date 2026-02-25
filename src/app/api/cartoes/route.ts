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

  const {
    name,
    brand,
    closing_day,
    due_day,
    credit_limit,
    last_four_digits,
    color,
    scope,
    is_shared,
  } = await req.json();

  if (!name?.trim() || !brand || !closing_day || !due_day) {
    return NextResponse.json(
      { error: "Campos obrigatórios faltando" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("credit_cards")
    .insert({
      family_id: profile.family_id,
      name: name.trim(),
      brand,
      closing_day,
      due_day,
      credit_limit: credit_limit ?? null,
      last_four_digits: last_four_digits ?? null,
      color: color ?? null,
      scope: scope ?? "family",
      user_id: scope === "personal" ? user.id : null,
      is_shared: scope === "personal" ? (is_shared ?? false) : false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
