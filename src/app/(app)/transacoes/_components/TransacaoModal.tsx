"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import ScopeSelector from "@/components/ui/ScopeSelector";
import DatePicker from "@/components/ui/DatePicker";
import type { Category, CreditCard, Scope } from "@/types/database";
import type { TransactionWithRelations } from "./types";

interface Props {
  transacao: TransactionWithRelations | null;
  categorias: Pick<Category, "id" | "name" | "icon">[];
  cartoes: Pick<CreditCard, "id" | "name" | "brand">[];
  onClose: () => void;
  onSaved: () => void;
}

export default function TransacaoModal({
  transacao,
  categorias,
  cartoes,
  onClose,
  onSaved,
}: Props) {
  const isEditing = transacao !== null;
  const today = new Date().toISOString().split("T")[0];

  const [type, setType] = useState<"income" | "expense">(
    transacao
      ? ["income", "fixed_income", "investment_withdrawal"].includes(transacao.type)
        ? "income"
        : "expense"
      : "expense"
  );
  const [description, setDescription] = useState(transacao?.description ?? "");
  const [amount, setAmount] = useState(transacao?.amount?.toString() ?? "");
  const [date, setDate] = useState(transacao?.date ?? today);
  const [categoryId, setCategoryId] = useState(transacao?.category_id ?? "");
  const [paymentMethod, setPaymentMethod] = useState<"account" | "credit_card">(
    transacao?.credit_card_id ? "credit_card" : "account"
  );
  const [creditCardId, setCreditCardId] = useState(
    transacao?.credit_card_id ?? ""
  );
  const [notes, setNotes] = useState(transacao?.notes ?? "");
  const [scope, setScope] = useState<Scope>(transacao?.scope ?? "family");
  const [isShared, setIsShared] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!description.trim() || !amount || !date) {
      setError("Descrição, valor e data são obrigatórios");
      return;
    }
    if (type === "expense" && paymentMethod === "credit_card" && !creditCardId) {
      setError("Selecione um cartão de crédito");
      return;
    }

    setLoading(true);
    setError("");

    const url = isEditing
      ? `/api/transacoes/${transacao.id}`
      : "/api/transacoes";
    const method = isEditing ? "PATCH" : "POST";

    const payload: Record<string, unknown> = {
      description: description.trim(),
      amount: parseFloat(amount),
      date,
      category_id: categoryId || null,
      credit_card_id:
        type === "expense" && paymentMethod === "credit_card"
          ? creditCardId
          : null,
      notes: notes || null,
      scope,
    };

    if (!isEditing) {
      payload.type = type;
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

  const title = isEditing
    ? "Editar Transação"
    : type === "income"
    ? "Nova Receita"
    : "Nova Despesa";

  const formId = "transacao-form";

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
              className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo — apenas na criação */}
        {!isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "expense" as const, label: "Despesa" },
                { value: "income" as const, label: "Receita" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setType(value);
                    if (value === "income") {
                      setPaymentMethod("account");
                      setCreditCardId("");
                    }
                  }}
                  className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    type === value
                      ? value === "expense"
                        ? "bg-red-50 border-red-500 text-red-700"
                        : "bg-green-50 border-green-500 text-green-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              type === "income" ? "Ex: Freelance, Venda..." : "Ex: Mercado, Farmácia..."
            }
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data <span className="text-red-500">*</span>
            </label>
            <DatePicker
              value={date}
              onChange={setDate}
              placeholder="Selecione a data"
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

        {type === "expense" && (
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
                        ? "bg-blue-50 border-blue-500 text-blue-700"
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
            )}
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observações
          </label>
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
