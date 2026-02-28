"use client";

import { Calendar } from "lucide-react";

export type ProjecaoItemKind = "aporte_projetado" | "aporte_real" | "retirada" | "projeto";

export interface ProjecaoItem {
  id: string;
  date: string;        // YYYY-MM-DD
  description: string;
  amount: number;      // positivo = entrada, negativo = saída
  kind: ProjecaoItemKind;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDayHeader(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return `${weekDays[date.getDay()]}, ${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
}

function getBadgeText(kind: ProjecaoItemKind): string {
  switch (kind) {
    case "aporte_projetado": return "aporte · previsto";
    case "aporte_real": return "aporte";
    case "retirada": return "retirada";
    case "projeto": return "projeto · previsto";
  }
}

function getBadgeStyle(kind: ProjecaoItemKind): string {
  switch (kind) {
    case "aporte_projetado": return "text-brand-600 bg-brand-50";
    case "aporte_real": return "text-green-600 bg-green-50";
    case "retirada": return "text-red-600 bg-red-50";
    case "projeto": return "text-brand-600 bg-brand-50";
  }
}

function getIcon(kind: ProjecaoItemKind): string {
  return kind === "projeto" ? "📁" : kind === "retirada" ? "↓" : "↑";
}

function getIconStyle(kind: ProjecaoItemKind): string {
  switch (kind) {
    case "aporte_projetado": return "bg-green-100 text-green-600";
    case "aporte_real": return "bg-green-100 text-green-600";
    case "retirada": return "bg-red-100 text-red-600";
    case "projeto": return "bg-brand-100 text-brand-600";
  }
}

function isProjected(kind: ProjecaoItemKind): boolean {
  return kind === "aporte_projetado" || kind === "projeto";
}

interface Props {
  items: ProjecaoItem[];
  saldoPorDia: Record<string, number>;
  saldoInicioMes: number;
}

function ItemRow({ item }: { item: ProjecaoItem }) {
  const isEntrada = item.amount > 0;
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${isProjected(item.kind) ? "bg-brand-50/50" : ""}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${getIconStyle(item.kind)}`}>
        {getIcon(item.kind)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{item.description}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${getBadgeStyle(item.kind)}`}>
            {getBadgeText(item.kind)}
          </span>
        </div>
      </div>
      <span className={`text-sm font-semibold flex-shrink-0 ${isEntrada ? "text-emerald-600" : "text-rose-500"}`}>
        {isEntrada ? "+" : ""}
        {formatCurrency(item.amount)}
      </span>
    </div>
  );
}

function DayGroup({ date, items, saldo }: { date: string; items: ProjecaoItem[]; saldo: number }) {
  return (
    <div className="mb-4 bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {formatDayHeader(date)}
        </span>
        <span className={`text-xs font-bold ${saldo >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
          {formatCurrency(saldo)} →
        </span>
      </div>
      <div className="divide-y divide-gray-50">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function ProjecaoTimeline({ items, saldoPorDia, saldoInicioMes }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Calendar size={40} className="text-gray-300 mb-3" />
        <p className="text-gray-500 text-sm">Nenhum lançamento previsto neste mês.</p>
        <p className="text-gray-400 text-xs mt-1">
          Aportes, resgates e pagamentos de projetos aparecerão aqui.
        </p>
      </div>
    );
  }

  const dias = [...new Set(items.map((i) => i.date))].sort();

  return (
    <div>
      <div className="mb-4 p-3 bg-brand-50 rounded-xl border border-brand-100">
        <p className="text-xs text-brand-600 font-medium">Saldo início do mês</p>
        <p className={`text-lg font-bold mt-0.5 ${saldoInicioMes >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
          {formatCurrency(saldoInicioMes)}
        </p>
      </div>

      {dias.map((dia) => (
        <DayGroup
          key={dia}
          date={dia}
          items={items.filter((i) => i.date === dia)}
          saldo={saldoPorDia[dia] ?? saldoInicioMes}
        />
      ))}
    </div>
  );
}
