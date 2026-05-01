"use client";

import React, { useState } from "react";
import { CreditCard } from "lucide-react";
import { type FluxoItem, formatCurrency, formatDayHeader } from "./types";

interface Props {
  items: FluxoItem[];
  saldoPorDia: Record<string, number>;
  mes: string;
}

function getDaysInMonth(mes: string): number {
  const [y, m] = mes.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

function getFirstWeekDay(mes: string): number {
  const [y, m] = mes.split("-").map(Number);
  return new Date(y, m - 1, 1).getDay(); // 0 = Domingo
}

function buildCalendarCells(mes: string): Array<{ dateStr: string | null; day: number | null; isCurrentMonth: boolean }> {
  const [y, m] = mes.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const firstWeekDay = new Date(y, m - 1, 1).getDay();
  const daysInPrevMonth = new Date(y, m - 1, 0).getDate();

  const cells: Array<{ dateStr: string | null; day: number | null; isCurrentMonth: boolean }> = [];

  // Dias do mês anterior para completar primeira semana
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

  // Dias do mês atual
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      dateStr: `${mes}-${String(d).padStart(2, "0")}`,
      day: d,
      isCurrentMonth: true,
    });
  }

  // Dias do próximo mês para completar última semana
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

function getDayDots(items: FluxoItem[]): React.ReactElement[] {
  const dots: React.ReactElement[] = [];
  const entradas = items.filter((i) => i.amount > 0);
  const saidas = items.filter((i) => i.amount < 0 && (i.kind === "transaction" || i.kind === "fatura"));
  const projetados = items.filter(
    (i) => i.amount < 0 && (i.kind === "investment_projected" || i.kind === "fixed_projected" || i.kind === "project_item")
  );

  if (entradas.length > 0) dots.push(<span key="entrada" className="w-1.5 h-1.5 rounded-full bg-emerald-500" />);
  if (saidas.length > 0) dots.push(<span key="saida" className="w-1.5 h-1.5 rounded-full bg-rose-500" />);
  if (projetados.length > 0) dots.push(<span key="proj" className="w-1.5 h-1.5 rounded-full bg-brand-400" />);

  return dots.slice(0, 3);
}

const BADGE_LABELS: Record<string, string> = {
  fixo: "fixo",
  assinatura: "assinatura",
  parcela: "parcela",
  investimento: "investimento",
  projeto: "projeto",
  avulso: "avulso",
};

export default function FluxoCalendario({ items, saldoPorDia, mes }: Props) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const cells = buildCalendarCells(mes);
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const selectedItems = selectedDay ? items.filter((i) => i.date === selectedDay) : [];
  const selectedSaldo = selectedDay ? saldoPorDia[selectedDay] : null;

  return (
    <div>
      {/* Grid do calendário */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {weekDays.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400">
              {d}
            </div>
          ))}
        </div>

        {/* Células do calendário */}
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const cellItems = cell.dateStr ? items.filter((i) => i.date === cell.dateStr) : [];
            const isToday = cell.dateStr === todayStr;
            const isSelected = cell.dateStr === selectedDay;
            const hasItems = cellItems.length > 0;
            const dots = hasItems ? getDayDots(cellItems) : [];

            return (
              <button
                key={idx}
                onClick={() => {
                  if (cell.isCurrentMonth && cell.dateStr) {
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
                <span
                  className={`text-xs font-medium ${
                    !cell.isCurrentMonth
                      ? "text-gray-300"
                      : isToday
                      ? "text-brand-700 font-bold"
                      : isSelected
                      ? "text-brand-700"
                      : "text-gray-700"
                  }`}
                >
                  {cell.day}
                </span>
                {/* Dots de eventos */}
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
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Entrada</span>
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
            <p className="px-4 py-6 text-sm text-gray-400 text-center">
              Nenhum lançamento neste dia.
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {selectedItems.map((item) => {
                const isEntrada = item.amount > 0;
                const isProjected =
                  item.kind === "investment_projected" ||
                  item.kind === "fixed_projected" ||
                  item.kind === "project_item";
                const isFatura = item.kind === "fatura";
                let badgeText = BADGE_LABELS[item.badge] ?? item.badge;
                if (item.kind === "fixed_projected") badgeText = "fixo · previsto";
                else if (isProjected) badgeText = `${badgeText} · previsto`;

                return (
                  <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${isProjected ? "bg-brand-50/50" : ""}`}>
                    {isFatura ? (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-brand-100 text-brand-600">
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
                        {item.kind === "fatura" ? null : (item.icon ?? (isEntrada ? "↑" : "↓"))}
                      </div>
                    )}
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
