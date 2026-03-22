"use client";

import { useState } from "react";
import { List, CalendarDays } from "lucide-react";
import MonthNavigator from "@/components/ui/MonthNavigator";
import ProjecaoTimeline from "./ProjecaoTimeline";
import ProjecaoCalendario from "./ProjecaoCalendario";
import type { ProjecaoItem } from "./ProjecaoTimeline";
import type { InvestmentTransaction } from "../../_components/types";
import { formatCurrency } from "../../_components/types";

interface ProjectItemRef {
  id: string;
  name: string;
  actual_amount: number | null;
  budget_amount?: number | null;
  expected_payment_date?: string | null;
  status: string;
  payment_type?: string | null;
  deposit_amount?: number | null;
  remainder_date?: string | null;
  deposit_transaction_id?: string | null;
}

interface Props {
  saldoAtual: number;
  investmentUserId: string;
  userName: string;
  partnerName: string;
  monthlyContributionAmount: number | null;
  monthlyContributionDay: number | null;
  partnerContributionAmount: number | null;
  partnerContributionDay: number | null;
  investmentTransactions: InvestmentTransaction[];
  projectItems: ProjectItemRef[];
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const MONTH_NAMES_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function prevMonth(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

export default function ProjecaoView({
  saldoAtual,
  investmentUserId,
  userName,
  partnerName,
  monthlyContributionAmount,
  monthlyContributionDay,
  partnerContributionAmount,
  partnerContributionDay,
  investmentTransactions,
  projectItems,
}: Props) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const [mes, setMes] = useState(currentMonthStr);
  const [layout, setLayout] = useState<"timeline" | "calendario">("timeline");

  // 1. Transactions reais futuras (date >= today)
  const realEvents: ProjecaoItem[] = investmentTransactions
    .filter((tx) => tx.date >= todayStr)
    .map((tx) => ({
      id: `tx-${tx.id}`,
      date: tx.date,
      description: tx.notes ?? (tx.type === "deposit" ? "Aporte" : "Retirada"),
      amount: tx.type === "deposit" ? tx.amount : -tx.amount,
      kind: tx.type === "deposit" ? "aporte_real" : "retirada",
    }));

  // 2. Aportes mensais projetados — rastreia meses cobertos por auto-gen por contribuidor
  const projetadosEvents: ProjecaoItem[] = [];

  // Agrupa meses com auto-gen por contributor_user_id
  const autoGenByContributor = new Map<string | null, Set<string>>();
  for (const tx of investmentTransactions) {
    if (!tx.auto_generated || tx.type !== "deposit") continue;
    const key = tx.contributor_user_id;
    if (!autoGenByContributor.has(key)) autoGenByContributor.set(key, new Set());
    autoGenByContributor.get(key)!.add(tx.date.slice(0, 7));
  }

  // Aporte do dono do investimento
  if (monthlyContributionAmount && monthlyContributionAmount > 0 && monthlyContributionDay) {
    const userAutoGen = autoGenByContributor.get(investmentUserId) ?? new Set<string>();
    for (let i = 0; i <= 24; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const mesStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (userAutoGen.has(mesStr)) continue;
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const day = Math.min(monthlyContributionDay, lastDay);
      const dateStr = `${mesStr}-${String(day).padStart(2, "0")}`;
      if (dateStr < todayStr) continue;
      projetadosEvents.push({
        id: `aporte-proj-user-${mesStr}`,
        date: dateStr,
        description: "Aporte mensal",
        amount: monthlyContributionAmount,
        kind: "aporte_projetado",
        contributorName: userName,
      });
    }
  }

  // Aporte do parceiro
  if (partnerContributionAmount && partnerContributionAmount > 0 && partnerContributionDay) {
    // Meses cobertos por auto-gen de qualquer contributor que NÃO seja o dono
    const partnerAutoGen = new Set<string>();
    for (const [key, months] of autoGenByContributor) {
      if (key !== investmentUserId) months.forEach((m) => partnerAutoGen.add(m));
    }
    for (let i = 0; i <= 24; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const mesStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (partnerAutoGen.has(mesStr)) continue;
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const day = Math.min(partnerContributionDay, lastDay);
      const dateStr = `${mesStr}-${String(day).padStart(2, "0")}`;
      if (dateStr < todayStr) continue;
      projetadosEvents.push({
        id: `aporte-proj-partner-${mesStr}`,
        date: dateStr,
        description: "Aporte mensal",
        amount: partnerContributionAmount,
        kind: "aporte_projetado",
        contributorName: partnerName,
      });
    }
  }

  // 3. Project items — split por tipo de pagamento
  const projetoEvents: ProjecaoItem[] = [];
  const itemsWithoutDate: ProjectItemRef[] = [];

  for (const item of projectItems) {
    if (item.status === "paid") continue; // já pago totalmente: não projeta

    if (item.payment_type === "deposit_remainder") {
      const depositPaid = !!item.deposit_transaction_id;
      const depositVal = item.deposit_amount ?? 0;
      const totalVal = item.actual_amount ?? 0;

      // Entrada: mostrar apenas se ainda não paga e tem data futura
      if (!depositPaid && item.expected_payment_date && item.expected_payment_date >= todayStr) {
        projetoEvents.push({
          id: `proj-deposit-${item.id}`,
          date: item.expected_payment_date,
          description: `${item.name} — Entrada`,
          amount: -depositVal,
          kind: "projeto",
        });
      }

      // Restante: mostrar se remainder_date >= hoje
      if (item.remainder_date && item.remainder_date >= todayStr) {
        projetoEvents.push({
          id: `proj-remainder-${item.id}`,
          date: item.remainder_date,
          description: `${item.name} — Restante`,
          amount: -(totalVal - depositVal),
          kind: "projeto",
        });
      }

      // Sem nenhuma data futura: vai para seção "sem data"
      const hasAnyFutureDate =
        (!depositPaid && item.expected_payment_date && item.expected_payment_date >= todayStr) ||
        (item.remainder_date && item.remainder_date >= todayStr);
      if (!hasAnyFutureDate) {
        itemsWithoutDate.push(item);
      }
    } else {
      // Comportamento atual: evento único na expected_payment_date
      if (item.expected_payment_date && item.expected_payment_date >= todayStr) {
        projetoEvents.push({
          id: `proj-${item.id}`,
          date: item.expected_payment_date,
          description: item.name,
          amount: -(item.actual_amount ?? 0),
          kind: "projeto",
        });
      } else {
        itemsWithoutDate.push(item);
      }
    }
  }

  // Todos os eventos ordenados por data
  const allEvents = [...realEvents, ...projetadosEvents, ...projetoEvents]
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calcular saldo acumulado por dia
  let acum = saldoAtual;
  const saldoPorDia: Record<string, number> = {};
  for (const e of allEvents) {
    acum += e.amount;
    saldoPorDia[e.date] = acum;
  }

  // Saldo no início do mês selecionado (após todos eventos anteriores ao mês)
  const saldoInicioMes = allEvents
    .filter((e) => e.date < `${mes}-01`)
    .reduce((s, e) => s + e.amount, saldoAtual);

  // Items do mês selecionado
  const itemsMes = allEvents.filter((e) => e.date.startsWith(mes));

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Projeção de Saldo</h2>
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

        <p className="text-xs text-gray-500 mb-3">
          Saldo hoje: <strong className="text-gray-900">{formatCurrency(saldoAtual)}</strong>
        </p>

        {/* Navegação de mês */}
        <MonthNavigator
          month={mes}
          onPrev={() => setMes(prevMonth(mes))}
          onNext={() => setMes(nextMonth(mes))}
        />
      </div>

      {/* Conteúdo */}
      {layout === "timeline" ? (
        <ProjecaoTimeline
          items={itemsMes}
          saldoPorDia={saldoPorDia}
          saldoInicioMes={saldoInicioMes}
        />
      ) : (
        <ProjecaoCalendario
          items={itemsMes}
          saldoPorDia={saldoPorDia}
          mes={mes}
        />
      )}

      {/* Items comprometidos sem data prevista */}
      {itemsWithoutDate.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Comprometido sem data prevista</h2>
          <div className="divide-y divide-gray-100">
            {itemsWithoutDate.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2.5">
                <p className="text-sm text-gray-800">{item.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    {item.actual_amount != null ? formatCurrency(item.actual_amount) : "—"}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    item.status === "paid"
                      ? "bg-green-50 text-green-700"
                      : "bg-brand-50 text-brand-700"
                  }`}>
                    {item.status === "paid" ? "Pago" : "Confirmado"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
