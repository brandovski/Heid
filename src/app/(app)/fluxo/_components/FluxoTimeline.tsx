"use client";

import { Calendar, CreditCard } from "lucide-react";
import { type FluxoItem, formatCurrency, formatDayHeader } from "./types";

interface Props {
  items: FluxoItem[];
  saldoPorDia: Record<string, number>;
  saldoBase: number;
  mes: string;
}

function ItemRow({ item }: { item: FluxoItem }) {
  const isEntrada = item.amount > 0;
  const isProjected = item.kind === "investment_projected" || item.kind === "project_item" || item.kind === "fixed_projected";
  const isFatura = item.kind === "fatura";

  // Badge text
  let badgeText = item.badge;
  if (isProjected && item.kind === "fixed_projected") {
    badgeText = "fixo · previsto";
  } else if (isProjected) {
    badgeText = `${item.badge} · previsto`;
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${
        isProjected ? "bg-brand-50/50" : ""
      }`}
    >
      {/* Ícone */}
      {isFatura ? (
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-brand-100 text-brand-600">
          <CreditCard size={16} />
        </div>
      ) : (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
          style={
            item.color
              ? { backgroundColor: `${item.color}20`, color: item.color }
              : { backgroundColor: isEntrada ? "#d1fae5" : "#fee2e2", color: isEntrada ? "#059669" : "#e11d48" }
          }
        >
          {item.icon && !isFatura ? item.icon : (isEntrada ? "↑" : "↓")}
        </div>
      )}

      {/* Descrição + badge */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{item.description}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-500 bg-gray-100">
            {badgeText}
          </span>
          {isFatura && item.icon && (
            <span className="text-[10px] text-gray-400">vence dia {item.icon}</span>
          )}
        </div>
      </div>

      {/* Valor */}
      <span
        className={`text-sm font-semibold flex-shrink-0 ${
          isEntrada ? "text-emerald-600" : "text-rose-500"
        }`}
      >
        {isEntrada ? "+" : ""}
        {formatCurrency(item.amount)}
      </span>
    </div>
  );
}

function DayGroup({
  date,
  items,
  saldo,
}: {
  date: string;
  items: FluxoItem[];
  saldo: number;
}) {
  return (
    <div className="mb-4 bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Cabeçalho do dia */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {formatDayHeader(date)}
        </span>
        <span
          className={`text-xs font-bold ${
            saldo >= 0 ? "text-emerald-600" : "text-rose-500"
          }`}
        >
          {formatCurrency(saldo)} →
        </span>
      </div>

      {/* Items do dia */}
      <div className="divide-y divide-gray-50">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function FluxoTimeline({ items, saldoPorDia, saldoBase, mes }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Calendar size={40} className="text-gray-300 mb-3" />
        <p className="text-gray-500 text-sm">Nenhum lançamento pendente neste mês.</p>
        <p className="text-gray-400 text-xs mt-1">
          Transações paidas, investimentos e projetos confirmados aparecerão aqui.
        </p>
      </div>
    );
  }

  // Agrupar items por data
  const dias = [...new Set(items.map((i) => i.date))].sort();

  return (
    <div>
      {/* Saldo base do mês */}
      <div className="mb-4 p-3 bg-brand-50 rounded-xl border border-brand-100">
        <p className="text-xs text-brand-600 font-medium">Saldo do mês (transações pagas)</p>
        <p className={`text-lg font-bold mt-0.5 ${saldoBase >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
          {formatCurrency(saldoBase)}
        </p>
      </div>

      {dias.map((dia) => (
        <DayGroup
          key={dia}
          date={dia}
          items={items.filter((i) => i.date === dia)}
          saldo={saldoPorDia[dia] ?? saldoBase}
        />
      ))}
    </div>
  );
}
