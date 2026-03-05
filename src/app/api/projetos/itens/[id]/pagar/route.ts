import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSystemCategoryId } from "@/lib/supabase/system-categories";

function addMonths(dateStr: string, months: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const totalMonths = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;
  const lastDay = new Date(targetYear, targetMonth, 0).getDate();
  const targetDay = Math.min(day, lastDay);
  return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;
}

export async function POST(
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

  if (profileError || !profile?.family_id) {
    return NextResponse.json({ error: "Family not configured" }, { status: 400 });
  }

  // Load the item
  const { data: item, error: itemError } = await supabase
    .from("project_items")
    .select("*")
    .eq("id", params.id)
    .single();

  if (itemError || !item) {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }

  if (item.status !== "confirmed") {
    return NextResponse.json({ error: "Item deve estar confirmado antes de pagar" }, { status: 400 });
  }

  if (!item.actual_amount) {
    return NextResponse.json({ error: "Item sem valor real definido" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const paymentDate: string = body.payment_date ?? new Date().toISOString().split("T")[0];

  // Resolve scope/user_id based on payment_origin
  const txScope = item.payment_origin === "family" ? "family" : "personal";
  const txUserId = item.payment_origin === "family" ? null : (item.payment_user_id ?? user.id);

  // Usar categoria de sistema "Projeto" para todas as transações de projeto
  const systemCategoryId = await getSystemCategoryId(supabase, profile.family_id, "Projeto");

  const baseTransaction = {
    family_id: profile.family_id,
    type: "expense" as const,
    category_id: systemCategoryId,
    scope: txScope,
    user_id: txUserId,
    is_shared: false,
    auto_generated: false,
  };

  // Verificar payment_origin=investment ANTES dos branches de payment_type
  // pois anteriormente o else-if nunca era alcançado.
  if (item.payment_origin === "investment") {
    if (!item.investment_id) {
      return NextResponse.json({ error: "Investimento não vinculado ao item" }, { status: 400 });
    }

    if (item.payment_type === "deposit_remainder") {
      if (!item.deposit_amount || !item.remainder_date) {
        return NextResponse.json({ error: "Sinal e data do restante são obrigatórios" }, { status: 400 });
      }

      if (!item.investment_deposit_id) {
        // PASSO 1: Debitar sinal do investimento
        const { data: invTx, error: invTxError } = await supabase
          .from("investment_transactions")
          .insert({
            investment_id: item.investment_id,
            family_id: profile.family_id,
            type: "withdrawal" as const,
            amount: item.deposit_amount,
            date: paymentDate,
            notes: `Pagamento: ${item.name} — Sinal`,
            auto_generated: false,
            project_item_id: params.id,
          })
          .select()
          .single();

        if (invTxError) return NextResponse.json({ error: invTxError.message }, { status: 500 });

        const { error: updateError } = await supabase
          .from("project_items")
          .update({ investment_deposit_id: invTx.id })
          .eq("id", params.id);

        if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

        return NextResponse.json({ step: "deposit", investment_deposit_id: invTx.id });
      } else {
        // PASSO 2: Debitar restante do investimento
        const remainder = item.actual_amount - (item.deposit_amount ?? 0);
        const { error: invTxError } = await supabase
          .from("investment_transactions")
          .insert({
            investment_id: item.investment_id,
            family_id: profile.family_id,
            type: "withdrawal" as const,
            amount: remainder,
            date: paymentDate,
            notes: `Pagamento: ${item.name} — Restante`,
            auto_generated: false,
            project_item_id: params.id,
          });

        if (invTxError) return NextResponse.json({ error: invTxError.message }, { status: 500 });

        const { error: updateError } = await supabase
          .from("project_items")
          .update({ status: "paid", paid_at: paymentDate })
          .eq("id", params.id);

        if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

        return NextResponse.json({ step: "remainder" });
      }
    }

    // Pagamento único (cash, card — sem dois passos)
    const { error: invTxError } = await supabase
      .from("investment_transactions")
      .insert({
        investment_id: item.investment_id,
        family_id: profile.family_id,
        type: "withdrawal" as const,
        amount: item.actual_amount,
        date: paymentDate,
        notes: `Pagamento: ${item.name}`,
        auto_generated: false,
        project_item_id: params.id,
      });

    if (invTxError) return NextResponse.json({ error: invTxError.message }, { status: 500 });

    const { error: updateError } = await supabase
      .from("project_items")
      .update({ status: "paid", paid_at: paymentDate })
      .eq("id", params.id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  }

  if (item.payment_type === "cash") {
    // Single expense transaction, paid
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .insert({
        ...baseTransaction,
        description: item.name,
        amount: item.actual_amount,
        date: paymentDate,
        status: "paid",
        paid_at: new Date().toISOString(),
        notes: item.notes,
      })
      .select()
      .single();

    if (txError) return NextResponse.json({ error: txError.message }, { status: 500 });

    const { error: updateError } = await supabase
      .from("project_items")
      .update({ status: "paid", paid_at: paymentDate, transaction_id: tx.id })
      .eq("id", params.id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({ transaction_id: tx.id });

  } else if (item.payment_type === "card_installment") {
    const count = item.installments_count ?? 2;

    // Create installment group
    const { data: group, error: groupError } = await supabase
      .from("installment_groups")
      .insert({
        family_id: profile.family_id,
        description: item.name,
        total_amount: item.actual_amount,
        installments_count: count,
        first_installment_date: paymentDate,
        credit_card_id: item.credit_card_id,
        category_id: item.category_id,
        notes: item.notes,
        scope: txScope,
        user_id: txUserId,
        is_shared: false,
      })
      .select()
      .single();

    if (groupError) return NextResponse.json({ error: groupError.message }, { status: 500 });

    const totalCents = Math.round(item.actual_amount * 100);
    const installmentCents = Math.floor(totalCents / count);
    const remainderCents = totalCents - installmentCents * count;

    const transactions = Array.from({ length: count }, (_, i) => {
      const isLast = i === count - 1;
      return {
        ...baseTransaction,
        description: `${item.name} (${i + 1}/${count})`,
        amount: (isLast ? installmentCents + remainderCents : installmentCents) / 100,
        date: addMonths(paymentDate, i),
        status: "pending" as const,
        credit_card_id: item.credit_card_id,
        installment_group_id: group.id,
        type: "installment" as const,
      };
    });

    const { data: txRows, error: txError } = await supabase
      .from("transactions")
      .insert(transactions)
      .select();

    if (txError) {
      await supabase.from("installment_groups").delete().eq("id", group.id);
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    const firstTxId = txRows?.[0]?.id;

    const { error: updateError } = await supabase
      .from("project_items")
      .update({ status: "paid", paid_at: paymentDate, transaction_id: firstTxId })
      .eq("id", params.id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({ transaction_id: firstTxId, installment_group_id: group.id });

  } else if (item.payment_type === "deposit_remainder") {
    if (!item.deposit_amount || !item.remainder_date) {
      return NextResponse.json(
        { error: "Sinal e data do restante são obrigatórios para este tipo de pagamento" },
        { status: 400 }
      );
    }

    const remainderAmount = item.actual_amount - item.deposit_amount;

    if (!item.deposit_transaction_id) {
      // PASSO 1: Pagar entrada — status permanece "confirmed"
      const { data: depositTx, error: depositError } = await supabase
        .from("transactions")
        .insert({
          ...baseTransaction,
          description: `${item.name} — Sinal`,
          amount: item.deposit_amount,
          date: paymentDate,
          status: "paid",
          paid_at: new Date().toISOString(),
          notes: item.notes,
        })
        .select()
        .single();

      if (depositError) return NextResponse.json({ error: depositError.message }, { status: 500 });

      const { error: updateError } = await supabase
        .from("project_items")
        .update({ deposit_transaction_id: depositTx.id })
        .eq("id", params.id);

      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

      return NextResponse.json({ step: "deposit", deposit_transaction_id: depositTx.id });

    } else {
      // PASSO 2: Pagar restante — status → "paid"
      const { data: remainderTx, error: remainderError } = await supabase
        .from("transactions")
        .insert({
          ...baseTransaction,
          description: `${item.name} — Restante`,
          amount: remainderAmount,
          date: paymentDate,
          status: "paid",
          paid_at: new Date().toISOString(),
          notes: item.notes,
        })
        .select()
        .single();

      if (remainderError) return NextResponse.json({ error: remainderError.message }, { status: 500 });

      const { error: updateError } = await supabase
        .from("project_items")
        .update({ status: "paid", paid_at: paymentDate, remainder_transaction_id: remainderTx.id })
        .eq("id", params.id);

      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

      return NextResponse.json({ step: "remainder" });
    }
  }

  return NextResponse.json({ error: "Tipo de pagamento inválido" }, { status: 400 });
}
