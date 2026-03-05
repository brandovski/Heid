"use client";

import { useState } from "react";
import { Check, MoreHorizontal, Trash2 } from "lucide-react";
import type { ProjectItemWithRelations, ProjectItem, ProjectGroup } from "../../_components/types";
import {
  formatCurrency,
  ITEM_STATUS_LABELS,
  ITEM_STATUS_COLORS,
  PAYMENT_TYPE_LABELS,
} from "../../_components/types";

interface CreditCard {
  id: string;
  name: string;
  brand: string;
}

interface Props {
  item: ProjectItemWithRelations;
  groups: ProjectGroup[];
  creditCards: CreditCard[];
  projectId: string;
  onEdit: (item: ProjectItemWithRelations) => void;
  onConfirm: (item: ProjectItemWithRelations) => void;
  onPay: (item: ProjectItemWithRelations) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ItemCard({
  item,
  onEdit,
  onConfirm,
  onPay,
  onCancel,
  onDelete,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  const isPaid = item.status === "paid";
  const isCancelled = item.status === "cancelled";
  const isDepositRemainder = item.payment_type === "deposit_remainder";
  const depositPaid = !!(item.deposit_transaction_id || item.investment_deposit_id);

  async function handlePay() {
    setPaying(true);
    await onPay(item);
    setPaying(false);
  }

  return (
    <div className={`flex items-start gap-3 py-3 px-4 rounded-xl ${isPaid ? "bg-green-50" : isCancelled ? "bg-gray-50" : "bg-white border border-gray-100"}`}>
      {/* Status icon */}
      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
        isPaid ? "bg-green-500" : isCancelled ? "bg-gray-200" : "bg-gray-100"
      }`}>
        {isPaid && <Check size={12} className="text-white" />}
      </div>

      <div className="flex-1 min-w-0">
        {/* Row 1: name + status badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium ${isCancelled ? "line-through text-gray-400" : "text-gray-900"}`}>
            {item.name}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ITEM_STATUS_COLORS[item.status]}`}>
            {ITEM_STATUS_LABELS[item.status]}
          </span>
          {item.payment_type && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
              {PAYMENT_TYPE_LABELS[item.payment_type]}
            </span>
          )}
        </div>

        {/* Row 2: amounts */}
        <div className="flex items-center gap-3 mt-0.5">
          {item.budget_amount != null && (
            <span className="text-xs text-gray-400">
              Orçado: {formatCurrency(item.budget_amount)}
            </span>
          )}
          {item.actual_amount != null && (
            <span className={`text-xs font-medium ${isPaid ? "text-green-700" : "text-brand-700"}`}>
              Real: {formatCurrency(item.actual_amount)}
            </span>
          )}
        </div>

        {/* Row 3: deposit/remainder breakdown for confirmed deposit_remainder items */}
        {isDepositRemainder && item.status === "confirmed" && item.deposit_amount != null && item.actual_amount != null && (
          <div className="flex items-center gap-3 mt-0.5">
            <span className={`text-xs ${depositPaid ? "text-green-600" : "text-gray-500"}`}>
              Entrada: {formatCurrency(item.deposit_amount)}{depositPaid ? " ✓" : ""}
            </span>
            <span className="text-xs text-gray-400">|</span>
            <span className="text-xs text-gray-500">
              Restante: {formatCurrency(item.actual_amount - item.deposit_amount)}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      {isCancelled && (
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Excluir item permanentemente"
        >
          <Trash2 size={14} />
        </button>
      )}

      {!isCancelled && !isPaid && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <MoreHorizontal size={16} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1">
                <button
                  onClick={() => { setMenuOpen(false); onEdit(item); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Editar
                </button>

                {item.status === "considering" && (
                  <button
                    onClick={() => { setMenuOpen(false); onConfirm(item); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-brand-700 hover:bg-gray-50"
                  >
                    Confirmar
                  </button>
                )}

                {item.status === "confirmed" && !isDepositRemainder && (
                  <button
                    onClick={() => { setMenuOpen(false); handlePay(); }}
                    disabled={paying}
                    className="w-full text-left px-4 py-2.5 text-sm text-green-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    {paying ? "Pagando..." : "Pagar"}
                  </button>
                )}

                {item.status === "confirmed" && isDepositRemainder && !depositPaid && (
                  <button
                    onClick={() => { setMenuOpen(false); handlePay(); }}
                    disabled={paying}
                    className="w-full text-left px-4 py-2.5 text-sm text-green-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    {paying ? "Pagando..." : "Pagar Entrada"}
                  </button>
                )}

                {item.status === "confirmed" && isDepositRemainder && depositPaid && (
                  <button
                    onClick={() => { setMenuOpen(false); handlePay(); }}
                    disabled={paying}
                    className="w-full text-left px-4 py-2.5 text-sm text-green-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    {paying ? "Pagando..." : "Pagar Restante"}
                  </button>
                )}

                <button
                  onClick={() => { setMenuOpen(false); onCancel(item.id); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
