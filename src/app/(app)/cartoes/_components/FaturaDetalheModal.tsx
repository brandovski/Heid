"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import MonthNavigator from "@/components/ui/MonthNavigator";
import Modal from "@/components/ui/Modal";
import PagarFaturaModal from "@/components/ui/PagarFaturaModal";
import { createClient } from "@/lib/supabase/client";
import type { CreditCard } from "@/types/database";
import { getFatureDateRange } from "@/lib/fatura-utils";

// ── Tipos locais ───────────────────────────────────────────────────────────────

interface TxRow {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: { name: string; icon: string | null } | null;
}

interface PaymentRow {
  id: string;
  amount_paid: number;
  paid_at: string;
  notes: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function formatDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

// ── Componente ─────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cartao: CreditCard;
}

export default function FaturaDetalheModal({ isOpen, onClose, cartao }: Props) {
  const router = useRouter();
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const [month, setMonth] = useState(currentMonth);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [payment, setPayment] = useState<PaymentRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { start: firstDay, end: lastDay } = getFatureDateRange(month, cartao.closing_day, cartao.due_day);

    const [{ data: txs }, { data: pmt }] = await Promise.all([
      supabase
        .from("transactions")
        .select("id, description, amount, date, category:categories(name, icon)")
        .eq("credit_card_id", cartao.id)
        .gte("date", firstDay)
        .lte("date", lastDay)
        .neq("status", "cancelled")
        .order("date", { ascending: true }),
      supabase
        .from("invoice_payments")
        .select("id, amount_paid, paid_at, notes")
        .eq("credit_card_id", cartao.id)
        .eq("reference_month", month)
        .maybeSingle(),
    ]);

    const typedTxs = (txs as unknown as TxRow[]) ?? [];
    setTransactions(typedTxs);
    setPayment(pmt as PaymentRow | null);
    setLoading(false);
  }, [month, cartao.id]);

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, fetchData]);

  const total = transactions.reduce((s, t) => s + t.amount, 0);
  const isPaid = payment !== null;

  return (
    <>
    <Modal
      title={`Fatura — ${cartao.name}`}
      onClose={onClose}
      footer={
        <div className="flex gap-2 justify-end">
          {!isPaid && !loading && (
            <button
              type="button"
              onClick={() => setShowPayModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
            >
              Pagar Fatura
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      }
    >
      <div className="space-y-5">

        {/* ── Navegação de mês ── */}
        <MonthNavigator
          month={month}
          onPrev={() => setMonth(shiftMonth(month, -1))}
          onNext={() => setMonth(shiftMonth(month, 1))}
        />

        {/* ── Lista de transações ── */}
        {loading ? (
          <div className="text-center py-8 text-sm text-gray-400">Carregando...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">
            Nenhuma transação neste mês
          </div>
        ) : (
          <div>
            <div className="divide-y divide-gray-50">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2.5 gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {t.category?.icon && (
                      <span className="text-base shrink-0">{t.category.icon}</span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 truncate">{t.description}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(t.date)}
                        {t.category?.name && ` · ${t.category.name}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 shrink-0">
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Total</span>
              <span className="text-base font-bold text-gray-900">{formatCurrency(total)}</span>
            </div>
          </div>
        )}

        {/* ── Status de pagamento ── */}
        {!loading && isPaid && (
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-start gap-3 text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">
                  Fatura paga: {formatCurrency(payment!.amount_paid)}
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  Em {formatDate(payment!.paid_at.split("T")[0])}
                  {payment!.notes && ` · ${payment!.notes}`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>

    <PagarFaturaModal
      isOpen={showPayModal}
      onClose={() => setShowPayModal(false)}
      onSaved={async () => {
        router.refresh();
        await fetchData();
      }}
      cartaoNome={cartao.name}
      totalAmount={total}
      creditCardId={cartao.id}
      referenceMonth={month}
    />
    </>
  );
}
