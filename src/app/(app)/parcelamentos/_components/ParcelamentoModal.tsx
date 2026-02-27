"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import DatePicker from "@/components/ui/DatePicker";
import ScopeSelector from "@/components/ui/ScopeSelector";
import type { Category, CreditCard, Scope } from "@/types/database";

interface Props {
  categorias: Pick<Category, "id" | "name" | "icon">[];
  cartoes: Pick<CreditCard, "id" | "name" | "brand">[];
  onClose: () => void;
  onSaved: () => void;
}

export default function ParcelamentoModal({ categorias, cartoes, onClose, onSaved }: Props) {
  const today = new Date().toISOString().split("T")[0];

  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [installmentsCount, setInstallmentsCount] = useState("2");
  const [firstDate, setFirstDate] = useState(today);
  const [creditCardId, setCreditCardId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");
  const [scope, setScope] = useState<Scope>("family");
  const [isShared, setIsShared] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const count = parseInt(installmentsCount) || 0;
  const total = parseFloat(totalAmount) || 0;
  const installmentValue = count > 0 && total > 0 ? total / count : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!description.trim() || !totalAmount || !installmentsCount || !firstDate || !creditCardId) {
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
        first_installment_date: firstDate,
        credit_card_id: creditCardId,
        category_id: categoryId || null,
        notes: notes || null,
        scope,
        is_shared: isShared,
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
              className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form={formId}
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Cadastrando..." : `Criar ${count}x parcelas`}
            </button>
          </div>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: iPhone 16, TV Samsung..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor total (R$) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0,00"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nº de parcelas <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="2"
              max="48"
              value={installmentsCount}
              onChange={(e) => setInstallmentsCount(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Preview do valor da parcela */}
        {installmentValue > 0 && (
          <p className="text-xs text-gray-500 -mt-2">
            Cada parcela:{" "}
            <span className="font-semibold text-gray-700">
              {installmentValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data da 1ª parcela <span className="text-red-500">*</span>
          </label>
          <DatePicker value={firstDate} onChange={setFirstDate} placeholder="Selecione a data" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cartão de crédito <span className="text-red-500">*</span>
          </label>
          <select
            value={creditCardId}
            onChange={(e) => setCreditCardId(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Opcional"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <ScopeSelector
          scope={scope}
          isShared={isShared}
          onScopeChange={setScope}
          onIsSharedChange={setIsShared}
        />
      </form>
    </Modal>
  );
}
