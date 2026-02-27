import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Cancels all pending installments of the group (soft cancel, no physical deletion)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // RLS ensures the group belongs to the user's family
  const { data: group } = await supabase
    .from("installment_groups")
    .select("id")
    .eq("id", params.id)
    .single();

  if (!group) {
    return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 });
  }

  const { error } = await supabase
    .from("transactions")
    .update({ status: "cancelled" })
    .eq("installment_group_id", params.id)
    .eq("status", "pending");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
