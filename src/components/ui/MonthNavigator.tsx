"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthNavigatorProps {
  month: string; // "YYYY-MM"
  onPrev: () => void;
  onNext: () => void;
  disableNext?: boolean;
}

function formatMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

export default function MonthNavigator({
  month,
  onPrev,
  onNext,
  disableNext = false,
}: MonthNavigatorProps) {
  return (
    <div className="flex items-center gap-5">
      <button
        onClick={onPrev}
        className="flex items-center justify-center px-3 py-1.5 rounded-pill bg-accent-200 text-brand-700 hover:bg-accent-300 transition-colors duration-150"
        aria-label="Mês anterior"
      >
        <ChevronLeft size={16} strokeWidth={2} />
      </button>

      <div className="flex items-center justify-center w-[200px] h-[30px] px-3 rounded-pill bg-accent-200 text-[12px] font-medium text-brand-700 capitalize whitespace-nowrap">
        {formatMonth(month)}
      </div>

      <button
        onClick={onNext}
        disabled={disableNext}
        className="flex items-center justify-center px-3 py-1.5 rounded-pill bg-accent-200 text-brand-700 hover:bg-accent-300 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Próximo mês"
      >
        <ChevronRight size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
