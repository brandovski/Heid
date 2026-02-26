"use client";

import { useEffect } from "react";
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl shadow-xl flex flex-col max-h-[70vh]">
        {/* Header — fixo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo — scrollável */}
        <div className="flex-1 overflow-y-auto px-6 py-5 overscroll-contain">
          {children}
        </div>

        {/* Footer — fixo */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0 bg-white">
          {footer}
        </div>
      </div>
    </div>
  );
}
