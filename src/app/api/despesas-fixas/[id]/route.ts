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
  const updates: Record<string, unknown> = {};

  const fields = [
    "description",
    "amount",
    "day_of_month",
    "category_id",
    "start_date",
    "end_date",
    "notes",
    "is_active",
    "payment_method",
    "credit_card_id",
  ];
  for (const field of fields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  // Scope sempre personal (recorrências não têm escopo configurável)
  updates.scope = "personal";
  updates.user_id = user.id;
  updates.is_shared = false;

  const { data, error } = await supabase
    .from("fixed_expenses")
    .update(updates)
    .eq("id", id)
    .eq("family_id", profile.family_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
