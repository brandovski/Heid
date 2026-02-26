"use client";

import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  value: string; // "YYYY-MM-DD" ou ""
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function parseDate(value: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(value: string): string {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Selecione uma data",
  className = "",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const selected = parseDate(value);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 border rounded-lg text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          open
            ? "border-blue-500 bg-white"
            : "border-gray-300 bg-white hover:border-gray-400"
        } ${value ? "text-gray-900" : "text-gray-400"}`}
      >
        <CalendarDays size={15} className="shrink-0 text-gray-400" />
        <span className="flex-1">{value ? formatDisplay(value) : placeholder}</span>
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (date) {
                onChange(formatDate(date));
                setOpen(false);
              }
            }}
            locale={ptBR}
            weekStartsOn={0}
            showOutsideDays
            classNames={{
              months: "flex flex-col",
              month: "space-y-3",
              caption: "flex items-center justify-between px-1",
              caption_label: "text-sm font-semibold text-gray-900 capitalize",
              nav: "flex items-center gap-1",
              nav_button:
                "p-1 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors",
              nav_button_previous: "",
              nav_button_next: "",
              table: "w-full border-collapse",
              head_row: "flex",
              head_cell:
                "w-9 text-center text-xs font-medium text-gray-400 pb-1",
              row: "flex mt-1",
              cell: "w-9 text-center p-0",
              day: "w-9 h-9 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none",
              day_selected:
                "bg-blue-600 text-white hover:bg-blue-700 font-medium",
              day_today: "font-bold text-blue-600",
              day_outside: "text-gray-300",
              day_disabled: "text-gray-200 cursor-not-allowed",
              day_hidden: "invisible",
            }}
            components={{
              IconLeft: () => <ChevronLeft size={16} />,
              IconRight: () => <ChevronRight size={16} />,
            }}
          />
        </div>
      )}
    </div>
  );
}
