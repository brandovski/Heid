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

  if (body.scope !== undefined) {
    updates.scope = body.scope;
    updates.user_id = body.scope === "personal" ? user.id : null;
    updates.is_shared =
      body.scope === "personal" ? (body.is_shared ?? false) : false;
  }

  const { data, error } = await supabase
    .from("fixed_expenses")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
