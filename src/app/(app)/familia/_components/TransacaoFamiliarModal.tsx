"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import DatePicker from "@/components/ui/DatePicker";
import type { FamilyTransaction } from "./types";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface Props {
  transacao: FamilyTransaction | null;
  categorias: Category[];
  onClose: () => void;
  onSaved: () => void;
}

export default function TransacaoFamiliarModal({
  transacao,
  categorias,
  onClose,
  onSaved,
}: Props) {
  const isEditing = transacao !== null;
  const today = new Date().toISOString().split("T")[0];

  const [type, setType] = useState<"income" | "expense">(
    transacao
      ? ["income", "fixed_income"].includes(transacao.type)
        ? "income"
        : "expense"
      : "expense"
  );
  const [description, setDescription] = useState(transacao?.description ?? "");
  const [amount, setAmount] = useState(transacao?.amount?.toString() ?? "");
  const [date, setDate] = useState(transacao?.date ?? today);
  const [categoryId, setCategoryId] = useState(transacao?.category_id ?? "");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!description.trim() || !amount || !date) {
      setError("Descrição, valor e data são obrigatórios");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isEditing) {
        const res = await fetch(`/api/transacoes/${transacao.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: description.trim(),
            amount: parseFloat(amount),
            date,
            category_id: categoryId || null,
            notes: notes || null,
          }),
        });
        if (!res.ok) {
          const { error: msg } = await res.json();
          throw new Error(msg ?? "Erro ao salvar");
        }
      } else {
        const res = await fetch("/api/transacoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: description.trim(),
            amount: parseFloat(amount),
            date,
            type,
            category_id: categoryId || null,
            notes: notes || null,
            scope: "family",
          }),
        });
        if (!res.ok) {
          const { error: msg } = await res.json();
          throw new Error(msg ?? "Erro ao criar");
        }
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  const title = isEditing
    ? "Editar Transação"
    : type === "income"
    ? "Nova Receita Familiar"
    : "Nova Despesa Familiar";

  const formId = "transacao-familiar-form";

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
                  onClick={() => setType(value)}
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
              type === "income" ? "Ex: Venda, Aluguel..." : "Ex: Supermercado, Conta..."
            }
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
      </form>
    </Modal>
  );
}
