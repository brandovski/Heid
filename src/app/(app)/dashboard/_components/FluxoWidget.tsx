"use client";

import Link from "next/link";
import { Calendar, CreditCard, ExternalLink } from "lucide-react";
import type { TransactionRow, InvoiceCardData } from "./types";

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

function typeBadgeLabel(type: string): string {
  switch (type) {
    case "fixed_expense":
    case "fixed_income":
      return "fixo";
    case "subscription":
      return "assinatura";
    case "installment":
      return "parcela";
    default:
      return "avulso";
  }
}

interface Props {
  transactions: TransactionRow[];
  invoiceCards: InvoiceCardData[];
  currentMonth: string;
  escopo: "personal" | "parceiro";
}

type CashItem = {
  kind: "cash";
  id: string;
  date: string;
  description: string;
  type: string;
  amount: number;
  category: { name: string; icon: string | null; color: string | null } | null;
};

type FaturaItem = {
  kind: "fatura";
  id: string;
  date: string;
  cardName: string;
  cardColor: string | null;
  total: number;
};

type FluxoItem = CashItem | FaturaItem;

export default function FluxoWidget({ transactions, invoiceCards, currentMonth, escopo }: Props) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [y, mo] = currentMonth.split("-").map(Number);
  const daysInMonth = new Date(y, mo, 0).getDate();

  const fluxoEscopo = escopo === "parceiro" ? "partner" : "personal";

  // 1. Cash pendentes de hoje em diante → itens individuais
  const cashItems: CashItem[] = transactions
    .filter((t) => t.status === "pending" && !t.credit_card_id && t.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => ({
      kind: "cash",
      id: t.id,
      date: t.date,
      description: t.description,
      type: t.type,
      amount: t.amount,
      category: t.category,
    }));

  // 2. Faturas → usar invoiceCards (ciclo correto via closing_day), excluir já pagas
  const faturaItems: FaturaItem[] = invoiceCards
    .filter((ic) => ic.payment === null && ic.monthTotal > 0)
    .map((ic) => {
      const dueDay = Math.min(ic.card.due_day, daysInMonth);
      return {
        kind: "fatura" as const,
        id: `fatura-${ic.card.id}`,
        date: `${currentMonth}-${String(dueDay).padStart(2, "0")}`,
        cardName: ic.card.name,
        cardColor: ic.card.color,
        total: ic.monthTotal,
      };
    })
    .filter((item) => item.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  // 3. Merge → ordenar por data → primeiros 4
  const items: FluxoItem[] = [...cashItems, ...faturaItems]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Próximas movimentações</h2>
        <Link
          href={`/fluxo?escopo=${fluxoEscopo}`}
          className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1"
        >
          Ver tudo <ExternalLink size={12} />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Calendar size={28} className="text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">Nenhuma movimentação pendente.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {items.map((item) => {
            if (item.kind === "fatura") {
              return (
                <div key={item.id} className="flex items-center justify-between py-2.5 gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                      <CreditCard size={12} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 truncate">Fatura {item.cardName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] bg-brand-50 text-brand-600 rounded px-1.5 py-0.5 font-medium">
                          fatura
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(item.date)}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-rose-500 shrink-0">
                    −{formatCurrency(item.total)}
                  </span>
                </div>
              );
            }

            // Cash item
            const isIncome = ["income", "fixed_income"].includes(item.type);
            return (
              <div key={item.id} className="flex items-center justify-between py-2.5 gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.category?.icon ? (
                    <span className="text-base shrink-0">{item.category.icon}</span>
                  ) : (
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                        isIncome
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-rose-100 text-rose-500"
                      }`}
                    >
                      {isIncome ? "↑" : "↓"}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 truncate">{item.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 font-medium">
                        {typeBadgeLabel(item.type)}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(item.date)}</span>
                    </div>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold shrink-0 ${
                    isIncome ? "text-emerald-600" : "text-rose-500"
                  }`}
                >
                  {isIncome ? "+" : "−"}
                  {formatCurrency(item.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
