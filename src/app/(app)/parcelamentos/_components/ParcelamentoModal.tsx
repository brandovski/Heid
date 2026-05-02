"use client";

import { useMemo, useState } from "react";
import { Clock, CheckCircle2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import DatePicker from "@/components/ui/DatePicker";
import type { Category, CreditCard } from "@/types/database";

interface Props {
  categorias: Pick<Category, "id" | "name" | "icon">[];
  cartoes: Pick<CreditCard, "id" | "name" | "brand" | "closing_day">[];
  onClose: () => void;
  onSaved: () => void;
}

function rawPaidCycles(purchaseDateStr: string, closingDay: number): number {
  const purchase = new Date(purchaseDateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const purchaseIdx = purchase.getFullYear() * 12 + purchase.getMonth();
  const firstInvoiceIdx = purchase.getDate() <= closingDay ? purchaseIdx : purchaseIdx + 1;

  const todayIdx = today.getFullYear() * 12 + today.getMonth();
  const currentCycleIdx = today.getDate() <= closingDay ? todayIdx : todayIdx + 1;

  return Math.max(0, currentCycleIdx - firstInvoiceIdx);
}

export default function ParcelamentoModal({ categorias, cartoes, onClose, onSaved }: Props) {
  const today = new Date().toISOString().split("T")[0];

  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [installmentsCount, setInstallmentsCount] = useState("2");
  const [purchaseDate, setPurchaseDate] = useState(today);
  const [creditCardId, setCreditCardId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const count = parseInt(installmentsCount) || 0;
  const total = parseFloat(totalAmount) || 0;
  const installmentValue = count > 0 && total > 0 ? total / count : 0;

  const selectedCard = useMemo(
    () => cartoes.find((c) => c.id === creditCardId) ?? null,
    [cartoes, creditCardId]
  );

  const rawCycles = useMemo(
    () =>
      purchaseDate && selectedCard
        ? rawPaidCycles(purchaseDate, selectedCard.closing_day)
        : 0,
    [purchaseDate, selectedCard]
  );

  const isCompleted = count > 0 && rawCycles >= count;
  const paidInstallments = isCompleted ? count : Math.min(rawCycles, Math.max(0, count - 1));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!description.trim() || !totalAmount || !installmentsCount || !purchaseDate || !creditCardId) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }
    if (count < 2 || count > 48) {
      setError("Número de parcelas deve ser entre 2 e 48");
      return;
    }
    if (total <= 0) {
      setError("Valor total deve ser maior que zero");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/parcelamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: description.trim(),
        total_amount: total,
        installments_count: count,
        first_installment_date: purchaseDate,
        credit_card_id: creditCardId,
        category_id: categoryId || null,
        notes: notes || null,
        paid_installments: paidInstallments,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const { error: msg } = await res.json();
      setError(msg ?? "Erro ao cadastrar");
      return;
    }
    onSaved();
  }

  const formId = "parcelamento-form";

  return (
    <Modal
      title="Nova Compra Parcelada"
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
              className="flex-1 py-2.5 px-4 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Cadastrando..." : `Criar ${count}x parcelas`}
            </button>
          </div>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">
            Descrição <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: iPhone 16, TV Samsung..."
            className="w-full px-3 py-2.5 border border-brand-700/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-brand-700 mb-1">
              Valor total (R$) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0,00"
              className="w-full px-3 py-2.5 border border-brand-700/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-700 mb-1">
              Nº de parcelas <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="2"
              max="48"
              value={installmentsCount}
              onChange={(e) => setInstallmentsCount(e.target.value)}
              className="w-full px-3 py-2.5 border border-brand-700/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/30"
            />
          </div>
        </div>

        {/* Preview do valor da parcela */}
        {installmentValue > 0 && (
          <p className="text-xs text-brand-700/50 -mt-2">
            Cada parcela:{" "}
            <span className="font-semibold text-brand-700">
              {installmentValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
            {isCompleted ? (
              <span className="text-emerald-600"> · todas pagas</span>
            ) : paidInstallments > 0 ? (
              <span className="text-brand-700/40"> · {count - paidInstallments} a pagar</span>
            ) : null}
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">
            Data da compra <span className="text-red-500">*</span>
          </label>
          <DatePicker value={purchaseDate} onChange={setPurchaseDate} placeholder="Selecione a data" />
          {purchaseDate && selectedCard && (
            isCompleted ? (
              <div className="mt-2 flex gap-2.5 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-md pl-3 py-2.5">
                <CheckCircle2 className="size-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-emerald-800">Compra quitada</p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Todos os {count} ciclos de cobrança já passaram (fechamento dia {selectedCard.closing_day}).
                    Todas as parcelas serão registradas como pagas.
                  </p>
                </div>
              </div>
            ) : paidInstallments > 0 ? (
              <div className="mt-2 flex gap-2.5 bg-amber-50 border-l-4 border-amber-400 rounded-r-md pl-3 py-2">
                <Clock className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-amber-700">
                    {paidInstallments} parcela{paidInstallments > 1 ? "s" : ""} paga{paidInstallments > 1 ? "s" : ""}, considerando o fechamento do cartão (dia {selectedCard.closing_day}).
                  </p>
                  <p className="text-xs text-amber-700">
                    Restam {count - paidInstallments} a pagar.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-brand-700/40 mt-1">
                Primeira parcela ainda não foi cobrada.
              </p>
            )
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">
            Cartão de crédito <span className="text-red-500">*</span>
          </label>
          <select
            value={creditCardId}
            onChange={(e) => setCreditCardId(e.target.value)}
            className="w-full px-3 py-2.5 border border-brand-700/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/30"
          >
            <option value="">Selecione um cartão</option>
            {cartoes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.brand})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">Categoria</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2.5 border border-brand-700/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/30"
          >
            <option value="">Sem categoria</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ""}
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">Observações</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Opcional"
            className="w-full px-3 py-2.5 border border-brand-700/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/30 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}
