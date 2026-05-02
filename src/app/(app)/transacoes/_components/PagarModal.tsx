"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import DatePicker from "@/components/ui/DatePicker";
import type { TransactionWithRelations } from "./types";
import { formatCurrency } from "./types";

interface Props {
  transacao: TransactionWithRelations;
  onClose: () => void;
  onSaved: () => void;
}

export default function PagarModal({ transacao, onClose, onSaved }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [paidDate, setPaidDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/transacoes/${transacao.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "paid",
        paid_at: `${paidDate}T12:00:00.000Z`,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const { error: msg } = await res.json();
      setError(msg ?? "Erro ao salvar");
      return;
    }
    onSaved();
  }

  const formId = "pagar-form";

  return (
    <Modal
      title="Marcar como Pago"
      onClose={onClose}
      footer={
        <div>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-brand-700/30 rounded-lg text-sm font-medium text-brand-700 hover:bg-brand-700/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form={formId}
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Salvando..." : "Confirmar Pagamento"}
            </button>
          </div>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={(e) => {
          e.preventDefault();
          handleConfirm();
        }}
        className="space-y-4"
      >
        <div className="p-3 bg-brand-700/5 rounded-lg">
          <p className="text-sm text-brand-700/70 truncate">{transacao.description}</p>
          <p className="text-base font-semibold text-brand-700 mt-0.5">
            {formatCurrency(transacao.amount)}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">
            Data de pagamento
          </label>
          <DatePicker
            value={paidDate}
            onChange={setPaidDate}
            placeholder="Selecione a data"
          />
          <p className="text-xs text-brand-700/40 mt-1">
            Padrão: hoje. Altere se o pagamento ocorreu em outra data.
          </p>
        </div>
      </form>
    </Modal>
  );
}
