"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import ScopeSelector from "@/components/ui/ScopeSelector";
import DatePicker from "@/components/ui/DatePicker";
import type {
  FixedIncome,
  FixedExpense,
  Category,
  CreditCard,
  Scope,
} from "@/types/database";
import type { FixaTab } from "./FixaList";

type FixaItem = FixedIncome | FixedExpense;

interface Props {
  item: FixaItem | null;
  tab: FixaTab;
  categorias: Pick<Category, "id" | "name" | "icon">[];
  cartoes: Pick<CreditCard, "id" | "name" | "brand">[];
  onClose: () => void;
  onSaved: () => void;
}

function isFixedExpense(item: FixaItem | null): item is FixedExpense {
  return item !== null && "payment_method" in item;
}

export default function FixaModal({
  item,
  tab,
  categorias,
  cartoes,
  onClose,
  onSaved,
}: Props) {
  const isDespesa = tab === "despesas";
  const expense = isFixedExpense(item) ? item : null;

  const [description, setDescription] = useState(item?.description ?? "");
  const [amount, setAmount] = useState(item?.amount?.toString() ?? "");
  const [dayOfMonth, setDayOfMonth] = useState(item?.day_of_month?.toString() ?? "");
  const [categoryId, setCategoryId] = useState(item?.category_id ?? "");
  const [startDate, setStartDate] = useState(
    item?.start_date ?? new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [scope, setScope] = useState<Scope>(item?.scope ?? "family");
  const [isShared, setIsShared] = useState(item?.is_shared ?? false);

  const [paymentMethod, setPaymentMethod] = useState<"account" | "credit_card">(
    expense?.payment_method ?? "account"
  );
  const [creditCardId, setCreditCardId] = useState(expense?.credit_card_id ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || !amount || !dayOfMonth) {
      setError("Descrição, valor e dia são obrigatórios");
      return;
    }
    if (isDespesa && paymentMethod === "credit_card" && !creditCardId) {
      setError("Selecione um cartão de crédito");
      return;
    }

    setLoading(true);
    setError("");

    const path = isDespesa ? "despesas-fixas" : "receitas-fixas";
    const url = item ? `/api/${path}/${item.id}` : `/api/${path}`;
    const method = item ? "PATCH" : "POST";

    const payload: Record<string, unknown> = {
      description: description.trim(),
      amount: parseFloat(amount),
      day_of_month: parseInt(dayOfMonth),
      category_id: categoryId || null,
      start_date: startDate,
      notes: notes || null,
      scope,
      is_shared: scope === "personal" ? isShared : false,
    };

    if (isDespesa) {
      payload.payment_method = paymentMethod;
      payload.credit_card_id =
        paymentMethod === "credit_card" ? creditCardId : null;
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (!res.ok) {
      const { error: msg } = await res.json();
      setError(msg ?? "Erro ao salvar");
      return;
    }
    onSaved();
  }

  const title = isDespesa
    ? item ? "Editar Despesa Fixa" : "Nova Despesa Fixa"
    : item ? "Editar Receita Fixa" : "Nova Receita Fixa";

  const formId = "fixa-form";

  return (
    <Modal
      title={title}
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
              className="flex-1 py-2.5 px-4 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Salvando..." : "Salvar"}
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
            placeholder={isDespesa ? "Ex: Aluguel" : "Ex: Salário"}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor (R$) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dia do mês <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={31}
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              placeholder="1–31"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoria
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
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

        {isDespesa && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forma de pagamento
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "account" as const, label: "Conta / Pix / Débito" },
                  { value: "credit_card" as const, label: "Cartão de Crédito" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(value);
                      if (value === "account") setCreditCardId("");
                    }}
                    className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      paymentMethod === value
                        ? "bg-brand-50 border-brand-500 text-brand-700"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "credit_card" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cartão <span className="text-red-500">*</span>
                </label>
                <select
                  value={creditCardId}
                  onChange={(e) => setCreditCardId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Selecione um cartão</option>
                  {cartoes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.brand})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Início
          </label>
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            placeholder="Selecione a data de início"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observações
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Opcional"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
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
