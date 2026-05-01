import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ txId: string }> }
) {
  const { txId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Load investment_transaction
  const { data: invTx, error: loadError } = await supabase
    .from("investment_transactions")
    .select("*")
    .eq("id", txId)
    .single();

  if (loadError || !invTx) {
    return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
  }

  if (invTx.auto_generated) {
    return NextResponse.json(
      { error: "Transações geradas automaticamente não podem ser excluídas" },
      { status: 400 }
    );
  }

  // Delete investment_transaction
  const { error: deleteInvTxError } = await supabase
    .from("investment_transactions")
    .delete()
    .eq("id", txId);

  if (deleteInvTxError) {
    return NextResponse.json({ error: deleteInvTxError.message }, { status: 500 });
  }

  // Delete linked financial transaction if present
  if (invTx.transaction_id) {
    await supabase.from("transactions").delete().eq("id", invTx.transaction_id);
  }

  return NextResponse.json({ ok: true });
}
