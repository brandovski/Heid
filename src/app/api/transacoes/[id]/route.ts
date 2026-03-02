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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();
  if (profileError || !profile?.family_id)
    return NextResponse.json({ error: "Family not configured" }, { status: 400 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  const editFields = [
    "description",
    "amount",
    "date",
    "category_id",
    "credit_card_id",
    "notes",
  ];
  for (const field of editFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  if (body.scope !== undefined) {
    updates.scope = body.scope;
    updates.user_id = body.scope === "personal" ? user.id : null;
  }

  if (body.status !== undefined) {
    if (!["pending", "paid", "cancelled"].includes(body.status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }
    updates.status = body.status;
    if (body.status === "paid") {
      updates.paid_at = body.paid_at ?? new Date().toISOString();
    } else {
      updates.paid_at = null;
    }
  }

  const { data, error } = await supabase
    .from("transactions")
    .update(updates)
    .eq("id", params.id)
    .eq("family_id", profile.family_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .select("auto_generated")
    .eq("id", params.id)
    .eq("family_id", profile.family_id)
    .single();

  if (txError || !tx) {
    return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
  }

  if (tx.auto_generated) {
    return NextResponse.json(
      { error: "Transações automáticas não podem ser excluídas" },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", params.id)
    .eq("family_id", profile.family_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
