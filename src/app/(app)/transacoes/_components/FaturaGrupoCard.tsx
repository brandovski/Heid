"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import PagarFaturaModal from "@/components/ui/PagarFaturaModal";
import type { FaturaGrupo } from "./types";
import { formatCurrency, formatDate } from "./types";

interface Props {
  grupo: FaturaGrupo;
  mes: string;
  onPaid: () => void;
  readOnly?: boolean;
}

export default function FaturaGrupoCard({ grupo, mes, onPaid, readOnly = false }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        {/* ── Linha principal (sempre visível) ── */}
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setExpanded((v) => !v)}
        >
          {/* Dot com cor do cartão */}
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: grupo.cartaoColor ?? "#334155" }}
          />

          {/* Nome + bandeira */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{grupo.cartaoNome}</p>
            <p className="text-xs text-gray-400">{grupo.cartaoBrand} · Cartão de crédito</p>
          </div>

          {/* Total + badge */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(grupo.total)}
            </span>
            {grupo.isPaid ? (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700">
                Pago
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700">
                Pendente
              </span>
            )}
            {expanded ? (
              <ChevronUp size={16} className="text-gray-400" />
            ) : (
              <ChevronDown size={16} className="text-gray-400" />
            )}
          </div>
        </div>

        {/* ── Conteúdo expandido ── */}
        {expanded && (
          <div className="border-t border-gray-100">

            {/* Lista de transações */}
            <div className="px-4 py-2 divide-y divide-gray-50">
              {grupo.transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {t.category?.icon && (
                      <span className="text-sm shrink-0">{t.category.icon}</span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 truncate">{t.description}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(t.date)}
                        {t.category?.name && ` · ${t.category.name}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-700 shrink-0">
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>

            {/* Rodapé expandido: pago ou botão pagar */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              {grupo.isPaid ? (
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span className="font-medium">
                    Pago em {formatDate(grupo.payment!.paid_at.split("T")[0])}
                    {" · "}{formatCurrency(grupo.payment!.amount_paid)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {grupo.transactions.length} transaç{grupo.transactions.length === 1 ? "ão" : "ões"}
                  </span>
                  {!readOnly && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPayModal(true);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
                    >
                      Pagar Fatura
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {!readOnly && (
        <PagarFaturaModal
          isOpen={showPayModal}
          onClose={() => setShowPayModal(false)}
          onSaved={onPaid}
          cartaoNome={grupo.cartaoNome}
          totalAmount={grupo.total}
          creditCardId={grupo.cartaoId}
          referenceMonth={mes}
        />
      )}
    </>
  );
}
