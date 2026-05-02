"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export default function Modal({ title, onClose, children, footer }: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const content = (
    <>
      {/* Overlay fixo independente */}
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />

      {/* Container do modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
        <div className="relative w-full sm:max-w-md bg-surface rounded-t-panel sm:rounded-panel shadow-xl flex flex-col max-h-[70vh] overflow-hidden pointer-events-auto">
          {/* Header — fixo */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-brand-700/10 shrink-0">
            <h2 className="text-base font-semibold text-brand-700">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-brand-700/40 hover:text-brand-700/70 hover:bg-brand-700/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Conteúdo — scrollável */}
          <div className="flex-1 overflow-y-auto px-6 py-5 overscroll-contain">
            {children}
          </div>

          {/* Footer — fixo */}
          <div className="px-6 py-4 border-t border-brand-700/10 shrink-0 bg-surface">
            {footer}
          </div>
        </div>
      </div>
    </>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
