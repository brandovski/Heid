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

// react-day-picker v9 class names
const DAY_PICKER_CLASSES = {
  months: "flex flex-col",
  month: "space-y-3",
  month_caption: "flex items-center justify-between px-1",
  caption_label: "text-sm font-semibold text-brand-700 capitalize",
  nav: "flex items-center gap-1",
  button_previous:
    "p-1 rounded-lg text-brand-700/50 hover:text-brand-700 hover:bg-brand-700/5 transition-colors",
  button_next:
    "p-1 rounded-lg text-brand-700/50 hover:text-brand-700 hover:bg-brand-700/5 transition-colors",
  month_grid: "w-full border-collapse",
  weekdays: "flex",
  weekday: "w-9 text-center text-xs font-medium text-brand-700/40 pb-1",
  week: "flex mt-1",
  day: "w-9 text-center p-0",
  day_button:
    "w-9 h-9 rounded-lg text-sm text-brand-700 hover:bg-brand-700/5 transition-colors focus:outline-none",
  selected: "bg-brand-700 !text-surface hover:bg-brand-600 font-medium",
  today: "font-bold text-brand-700",
  outside: "text-brand-700/20",
  disabled: "text-brand-700/15 cursor-not-allowed",
  hidden: "invisible",
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

  const chevronComponent = ({ orientation }: { orientation?: "left" | "right" | "up" | "down" }) =>
    orientation === "left" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />;

  const calendarNode = (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={handleSelect}
      locale={ptBR}
      weekStartsOn={0}
      showOutsideDays
      classNames={DAY_PICKER_CLASSES}
      components={{ Chevron: chevronComponent }}
    />
  );

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 border rounded-lg text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-brand-700/30 ${
          open
            ? "border-brand-700 bg-surface"
            : "border-brand-700/20 bg-surface hover:border-brand-700/40"
        } ${value ? "text-brand-700" : "text-brand-700/40"}`}
      >
        <CalendarDays size={15} className="shrink-0 text-brand-700/40" />
        <span className="flex-1">{value ? formatDisplay(value) : placeholder}</span>
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          isMobile ? (
            <div className="fixed inset-0 z-50 flex flex-col justify-end">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setOpen(false)}
              />
              <div className="relative z-10 bg-surface rounded-t-panel shadow-panel px-4 pt-4 pb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-brand-700">
                    Selecionar data
                  </h3>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-lg text-brand-700/40 hover:text-brand-700 hover:bg-brand-700/5 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex justify-center">{calendarNode}</div>
              </div>
            </div>
          ) : (
            <div
              ref={popoverRef}
              style={popoverStyle}
              className="bg-surface border border-brand-700/15 rounded-card shadow-panel p-3"
            >
              {calendarNode}
            </div>
          ),
          document.body
        )}
    </div>
  );
}
