"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { List, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import FluxoTimeline from "./FluxoTimeline";
import FluxoCalendario from "./FluxoCalendario";
import {
  type FluxoItem,
  type ScopeFilter,
  formatMonthLabel,
  prevMonth,
  nextMonth,
  isIncomeType,
  typeToBadge,
} from "./types";

interface PaidTx {
  amount: number;
  type: string;
}

export interface PendingTx {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: string;
  scope: string;
  user_id: string | null;
  credit_card_id: string | null;
  fixed_income_id: string | null;
  fixed_expense_id: string | null;
  category: { name: string; icon: string | null; color: string | null } | null;
}

export interface InvestmentRow {
  id: string;
  name: string;
  monthly_contribution_amount: number | null;
  monthly_contribution_day: number | null;
  scope: string;
  user_id: string;
}

export interface InvestmentTxRow {
  investment_id: string;
  date: string;
}

export interface ProjectItemRow {
  id: string;
  name: string;
  budget_amount: number | null;
  actual_amount: number | null;
  expected_payment_date: string | null;
  project: { id: string; name: string; scope: string; user_id: string } | null;
}

export interface FixedIncomeRow {
  id: string;
  description: string;
  amount: number;
  day_of_month: number;
}

export interface FixedExpenseRow {
  id: string;
  description: string;
  amount: number;
  day_of_month: number;
  payment_method: string;
  credit_card_id: string | null;
}

export interface CreditCardRow {
  id: string;
  name: string;
  due_day: number;
  color: string | null;
  scope: string;
  user_id: string;
}

export type { ScopeFilter };

interface Props {
  mes: string;
  escopo: ScopeFilter;
  userId: string;
  myName: string;
  partnerName: string;
  paidTx: PaidTx[];
  pendingTx: PendingTx[];
  investments: InvestmentRow[];
  investmentTx: InvestmentTxRow[];
  projectItems: ProjectItemRow[];
  fixedIncomes: FixedIncomeRow[];
  fixedExpenses: FixedExpenseRow[];
  creditCards: CreditCardRow[];
}

export default function FluxoView({
  mes,
  escopo,
  userId,
  myName,
  partnerName,
  paidTx,
  pendingTx,
  investments,
  investmentTx,
  projectItems,
  fixedIncomes,
  fixedExpenses,
  creditCards,
}: Props) {
  const router = useRouter();
  const [layout, setLayout] = useState<"timeline" | "calendario">("timeline");

  // Saldo base: soma das transações pagas no mês
  const saldoBase = paidTx.reduce((acc, tx) => {
    return isIncomeType(tx.type) ? acc + tx.amount : acc - tx.amount;
  }, 0);

  // ── Passo 1: Separar pendentes por destino ──────────────────────────────────
  const cashPending = pendingTx.filter((tx) => !tx.credit_card_id);
  const cardPending = pendingTx.filter((tx) => !!tx.credit_card_id);

  // ── Passo 2: IDs de fixas já geradas (dedup) ────────────────────────────────
  const generatedIncomeIds = new Set(
    pendingTx.map((t) => t.fixed_income_id).filter(Boolean) as string[]
  );
  const generatedExpenseIds = new Set(
    pendingTx.map((t) => t.fixed_expense_id).filter(Boolean) as string[]
  );

  // ── Passo 3: Montar FluxoItems ───────────────────────────────────────────────
  const [mesY, mesM] = mes.split("-").map(Number);
  const items: FluxoItem[] = [];

  // 1. Cash pendentes → transaction
  for (const tx of cashPending) {
    const entrada = isIncomeType(tx.type);
    items.push({
      id: tx.id,
      date: tx.date,
      kind: "transaction",
      description: tx.description,
      amount: entrada ? tx.amount : -tx.amount,
      badge: typeToBadge(tx.type),
      icon: tx.category?.icon ?? undefined,
      color: tx.category?.color ?? undefined,
    });
  }

  // 2. Faturas de cartão agrupadas
  const daysInMonth = new Date(mesY, mesM, 0).getDate();
  for (const card of creditCards) {
    const cardTxTotal = cardPending
      .filter((t) => t.credit_card_id === card.id)
      .reduce((s, t) => s + t.amount, 0);

    const fixedOnCardTotal = fixedExpenses
      .filter((e) => !generatedExpenseIds.has(e.id) && e.credit_card_id === card.id)
      .reduce((s, e) => s + e.amount, 0);

    const total = cardTxTotal + fixedOnCardTotal;
    if (total <= 0) continue;

    const dueDay = Math.min(card.due_day, daysInMonth);
    const dateStr = `${mes}-${String(dueDay).padStart(2, "0")}`;

    items.push({
      id: `fatura-${card.id}`,
      date: dateStr,
      kind: "fatura",
      description: `Fatura ${card.name}`,
      amount: -total,
      badge: "fatura",
      color: card.color ?? undefined,
      // Store due day in icon field (as string) for display
      icon: String(dueDay),
    });
  }

  // 3. Fixas não geradas (account)
  for (const inc of fixedIncomes) {
    if (generatedIncomeIds.has(inc.id)) continue;
    const day = Math.min(inc.day_of_month, daysInMonth);
    const dateStr = `${mes}-${String(day).padStart(2, "0")}`;
    items.push({
      id: `fixed-inc-${inc.id}`,
      date: dateStr,
      kind: "fixed_projected",
      description: inc.description,
      amount: inc.amount,
      badge: "fixo",
    });
  }

  for (const exp of fixedExpenses) {
    if (generatedExpenseIds.has(exp.id)) continue;
    if (exp.payment_method !== "account") continue; // faturas no cartão já foram agrupadas
    const day = Math.min(exp.day_of_month, daysInMonth);
    const dateStr = `${mes}-${String(day).padStart(2, "0")}`;
    items.push({
      id: `fixed-exp-${exp.id}`,
      date: dateStr,
      kind: "fixed_projected",
      description: exp.description,
      amount: -exp.amount,
      badge: "fixo",
    });
  }

  // 4. Investimentos projetados
  const investmentTxByInvestment = new Set(investmentTx.map((t) => t.investment_id));

  for (const inv of investments) {
    if (escopo === "personal" && (inv.scope !== "personal" || inv.user_id !== userId)) continue;
    // partner: investimentos do parceiro não são exibidos no escopo parceiro

    if (!inv.monthly_contribution_amount || !inv.monthly_contribution_day) continue;
    if (investmentTxByInvestment.has(inv.id)) continue;

    const day = Math.min(inv.monthly_contribution_day, daysInMonth);
    const dateStr = `${mes}-${String(day).padStart(2, "0")}`;

    items.push({
      id: `inv-projected-${inv.id}`,
      date: dateStr,
      kind: "investment_projected",
      description: inv.name,
      amount: -inv.monthly_contribution_amount,
      badge: "investimento",
    });
  }

  // 5. Itens de projeto confirmados
  for (const item of projectItems) {
    if (!item.expected_payment_date || !item.project) continue;

    const proj = item.project;
    if (escopo === "personal" && (proj.scope !== "personal" || proj.user_id !== userId)) continue;

    const amount = item.actual_amount ?? item.budget_amount ?? 0;
    items.push({
      id: `proj-item-${item.id}`,
      date: item.expected_payment_date,
      kind: "project_item",
      description: `${proj.name} — ${item.name}`,
      amount: -amount,
      badge: "projeto",
    });
  }

  // Ordenar por data ASC
  items.sort((a, b) => a.date.localeCompare(b.date));

  // Calcular saldo projetado acumulado por dia
  let saldoAcumulado = saldoBase;
  const saldoPorDia: Record<string, number> = {};
  const diasComItems = [...new Set(items.map((i) => i.date))];

  for (const dia of diasComItems.sort()) {
    const itemsDia = items.filter((i) => i.date === dia);
    const deltaDia = itemsDia.reduce((acc, i) => acc + i.amount, 0);
    saldoAcumulado += deltaDia;
    saldoPorDia[dia] = saldoAcumulado;
  }

  function navigateMes(novoMes: string) {
    router.push(`/fluxo?mes=${novoMes}&escopo=${escopo}`);
  }

  function navigateEscopo(novoEscopo: ScopeFilter) {
    router.push(`/fluxo?mes=${mes}&escopo=${novoEscopo}`);
  }

  // ── Passo 4: Tabs de escopo com nomes reais ──────────────────────────────────
  const scopeTabs: { value: ScopeFilter; label: string }[] = [
    { value: "personal", label: myName },
    { value: "partner", label: partnerName },
  ];

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Fluxo Futuro</h1>
            <p className="text-sm text-gray-500 mt-1">Linha do tempo financeira mensal.</p>
          </div>
          {/* Toggle de layout */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setLayout("timeline")}
              className={`p-1.5 rounded-md transition-colors ${
                layout === "timeline" ? "bg-white shadow-sm text-brand-600" : "text-gray-500 hover:text-gray-700"
              }`}
              aria-label="Lista"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setLayout("calendario")}
              className={`p-1.5 rounded-md transition-colors ${
                layout === "calendario" ? "bg-white shadow-sm text-brand-600" : "text-gray-500 hover:text-gray-700"
              }`}
              aria-label="Calendário"
            >
              <CalendarDays size={16} />
            </button>
          </div>
        </div>

        {/* Tabs de escopo com nomes reais */}
        <div className="flex gap-1 mt-4 bg-gray-100 rounded-lg p-1">
          {scopeTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => navigateEscopo(tab.value)}
              className={`flex-1 py-1.5 px-2 rounded-md text-sm font-medium transition-colors ${
                escopo === tab.value
                  ? "bg-white shadow-sm text-brand-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Navegação de mês */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => navigateMes(prevMonth(mes))}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-semibold text-gray-800 capitalize">
            {formatMonthLabel(mes)}
          </span>
          <button
            onClick={() => navigateMes(nextMonth(mes))}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Próximo mês"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      {layout === "timeline" ? (
        <FluxoTimeline items={items} saldoPorDia={saldoPorDia} saldoBase={saldoBase} mes={mes} />
      ) : (
        <FluxoCalendario items={items} saldoPorDia={saldoPorDia} mes={mes} />
      )}
    </div>
  );
}
