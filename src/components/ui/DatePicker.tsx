"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

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

const DAY_PICKER_CLASSES = {
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
  head_cell: "w-9 text-center text-xs font-medium text-gray-400 pb-1",
  row: "flex mt-1",
  cell: "w-9 text-center p-0",
  day: "w-9 h-9 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none",
  day_selected: "bg-blue-600 text-white hover:bg-blue-700 font-medium",
  day_today: "font-bold text-blue-600",
  day_outside: "text-gray-300",
  day_disabled: "text-gray-200 cursor-not-allowed",
  day_hidden: "invisible",
};

export default function DatePicker({
  value,
  onChange,
  placeholder = "Selecione uma data",
  className = "",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Detecta mobile (< 640px = breakpoint sm do Tailwind)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverHeight = 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow >= popoverHeight
        ? rect.bottom + window.scrollY + 4
        : rect.top + window.scrollY - popoverHeight - 4;

    setPopoverStyle({
      position: "absolute",
      top,
      left: rect.left + window.scrollX,
      width: Math.max(rect.width, 280),
      zIndex: 9999,
    });
  }, []);

  // Listeners para o popover desktop
  useEffect(() => {
    if (!open || isMobile) return;
    updatePosition();

    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      )
        return;
      setOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function handleScroll() {
      updatePosition();
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, isMobile, updatePosition]);

  // Listener de Escape para o bottom sheet mobile
  useEffect(() => {
    if (!open || !isMobile) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, isMobile]);

  const selected = parseDate(value);

  function handleSelect(date: Date | undefined) {
    if (date) {
      onChange(formatDate(date));
      setOpen(false);
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Trigger */}
      <button
        ref={triggerRef}
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

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          isMobile ? (
            /* ── Mobile: bottom sheet ── */
            <div className="fixed inset-0 z-50 flex flex-col justify-end">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setOpen(false)}
              />
              {/* Sheet */}
              <div className="relative z-10 bg-white rounded-t-2xl shadow-xl px-4 pt-4 pb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">
                    Selecionar data
                  </h3>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex justify-center">
                  <DayPicker
                    mode="single"
                    selected={selected}
                    onSelect={handleSelect}
                    locale={ptBR}
                    weekStartsOn={0}
                    showOutsideDays
                    classNames={DAY_PICKER_CLASSES}
                    components={{
                      IconLeft: () => <ChevronLeft size={16} />,
                      IconRight: () => <ChevronRight size={16} />,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* ── Desktop: popover posicionado ── */
            <div
              ref={popoverRef}
              style={popoverStyle}
              className="bg-white border border-gray-200 rounded-xl shadow-xl p-3"
            >
              <DayPicker
                mode="single"
                selected={selected}
                onSelect={handleSelect}
                locale={ptBR}
                weekStartsOn={0}
                showOutsideDays
                classNames={DAY_PICKER_CLASSES}
                components={{
                  IconLeft: () => <ChevronLeft size={16} />,
                  IconRight: () => <ChevronRight size={16} />,
                }}
              />
            </div>
          ),
          document.body
        )}
    </div>
  );
}
