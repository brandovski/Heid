"use client";

import { useState } from "react";
import type { ProjecaoItem } from "./ProjecaoTimeline";

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDayHeader(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return `${weekDays[date.getDay()]}, ${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
}

function buildCalendarCells(mes: string): Array<{ dateStr: string; day: number; isCurrentMonth: boolean }> {
  const [y, m] = mes.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const firstWeekDay = new Date(y, m - 1, 1).getDay();
  const daysInPrevMonth = new Date(y, m - 1, 0).getDate();

  const cells: Array<{ dateStr: string; day: number; isCurrentMonth: boolean }> = [];

  for (let i = firstWeekDay - 1; i >= 0; i--) {
    const prevDay = daysInPrevMonth - i;
    const prevM = m === 1 ? 12 : m - 1;
    const prevY = m === 1 ? y - 1 : y;
    cells.push({
      dateStr: `${prevY}-${String(prevM).padStart(2, "0")}-${String(prevDay).padStart(2, "0")}`,
      day: prevDay,
      isCurrentMonth: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      dateStr: `${mes}-${String(d).padStart(2, "0")}`,
      day: d,
      isCurrentMonth: true,
    });
  }

  const remaining = 42 - cells.length;
  const nextM = m === 12 ? 1 : m + 1;
  const nextY = m === 12 ? y + 1 : y;
  for (let d = 1; d <= remaining; d++) {
    cells.push({
      dateStr: `${nextY}-${String(nextM).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      day: d,
      isCurrentMonth: false,
    });
  }

  return cells;
}

function getDayDots(items: ProjecaoItem[]): React.ReactElement[] {
  const dots: React.ReactElement[] = [];
  const aportesReais = items.some((i) => i.kind === "aporte_real");
  const retiradas = items.some((i) => i.kind === "retirada");
  const projetados = items.some((i) => i.kind === "aporte_projetado" || i.kind === "projeto");

  if (aportesReais) dots.push(<span key="aporte-real" className="w-1.5 h-1.5 rounded-full bg-emerald-500" />);
  if (retiradas) dots.push(<span key="retirada" className="w-1.5 h-1.5 rounded-full bg-rose-500" />);
  if (projetados) dots.push(<span key="proj" className="w-1.5 h-1.5 rounded-full bg-brand-400" />);

  return dots.slice(0, 3);
}

function getBadgeText(kind: ProjecaoItem["kind"]): string {
  switch (kind) {
    case "aporte_projetado": return "aporte · previsto";
    case "aporte_real": return "aporte";
    case "retirada": return "retirada";
    case "projeto": return "projeto · previsto";
  }
}

function getBadgeStyle(kind: ProjecaoItem["kind"]): string {
  switch (kind) {
    case "aporte_projetado": return "text-brand-600 bg-brand-50";
    case "aporte_real": return "text-green-600 bg-green-50";
    case "retirada": return "text-red-600 bg-red-50";
    case "projeto": return "text-brand-600 bg-brand-50";
  }
}

function getIcon(kind: ProjecaoItem["kind"]): string {
  return kind === "projeto" ? "📁" : kind === "retirada" ? "↓" : "↑";
}

function getIconStyle(kind: ProjecaoItem["kind"]): string {
  switch (kind) {
    case "aporte_projetado": return "bg-green-100 text-green-600";
    case "aporte_real": return "bg-green-100 text-green-600";
    case "retirada": return "bg-red-100 text-red-600";
    case "projeto": return "bg-brand-100 text-brand-600";
  }
}

interface Props {
  items: ProjecaoItem[];
  saldoPorDia: Record<string, number>;
  mes: string;
}

export default function ProjecaoCalendario({ items, saldoPorDia, mes }: Props) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const cells = buildCalendarCells(mes);
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const selectedItems = selectedDay ? items.filter((i) => i.date === selectedDay) : [];
  const selectedSaldo = selectedDay ? (saldoPorDia[selectedDay] ?? null) : null;

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {weekDays.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const cellItems = items.filter((i) => i.date === cell.dateStr);
            const isToday = cell.dateStr === todayStr;
            const isSelected = cell.dateStr === selectedDay;
            const dots = cellItems.length > 0 ? getDayDots(cellItems) : [];

            return (
              <button
                key={idx}
                onClick={() => {
                  if (cell.isCurrentMonth) {
                    setSelectedDay(isSelected ? null : cell.dateStr);
                  }
                }}
                disabled={!cell.isCurrentMonth}
                className={`
                  relative flex flex-col items-center justify-start pt-1.5 pb-2 min-h-[52px] border-b border-r border-gray-50 transition-colors
                  ${!cell.isCurrentMonth ? "bg-gray-50/50 cursor-default" : "hover:bg-brand-50/50 cursor-pointer"}
                  ${isToday ? "bg-brand-50 border-brand-200" : ""}
                  ${isSelected ? "bg-brand-100 ring-1 ring-inset ring-brand-300" : ""}
                `}
              >
                <span className={`text-xs font-medium ${
                  !cell.isCurrentMonth ? "text-gray-300" :
                  isToday ? "text-brand-700 font-bold" :
                  isSelected ? "text-brand-700" : "text-gray-700"
                }`}>
                  {cell.day}
                </span>
                {cell.isCurrentMonth && dots.length > 0 && (
                  <div className="flex items-center gap-0.5 mt-1">
                    {dots}
                    {cellItems.length > 3 && (
                      <span className="text-[9px] text-gray-400 ml-0.5">+{cellItems.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-3 text-xs text-gray-400 mb-4 px-1">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Aporte</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Saída</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-400" /> Previsto</span>
      </div>

      {/* Painel de detalhes do dia selecionado */}
      {selectedDay && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {formatDayHeader(selectedDay)}
            </span>
            {selectedSaldo !== null && (
              <span className={`text-xs font-bold ${selectedSaldo >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                Saldo projetado: {formatCurrency(selectedSaldo)}
              </span>
            )}
          </div>

          {selectedItems.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">Nenhum lançamento neste dia.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {selectedItems.map((item) => {
                const isEntrada = item.amount > 0;
                const isProjected = item.kind === "aporte_projetado" || item.kind === "projeto";
                return (
                  <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${isProjected ? "bg-brand-50/50" : ""}`}>
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
              })}
            </div>
          )}
        </div>
      )}

      {!selectedDay && (
        <p className="text-xs text-gray-400 text-center py-4">
          Clique em um dia para ver os lançamentos.
        </p>
      )}
    </div>
  );
}
