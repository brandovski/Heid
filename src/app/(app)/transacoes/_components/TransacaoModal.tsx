"use client";

import { useState } from "react";
import { CheckCircle2, Clock, CreditCard as CreditCardIcon } from "lucide-react";
import Modal from "@/components/ui/Modal";
import DatePicker from "@/components/ui/DatePicker";
import type { Category, CreditCard } from "@/types/database";
import type { TransactionWithRelations } from "./types";

interface Props {
  transacao: TransactionWithRelations | null;
  categorias: Pick<Category, "id" | "name" | "icon" | "type">[];
  cartoes: Pick<CreditCard, "id" | "name" | "brand">[];
  onClose: () => void;
  onSaved: () => void;
}

type PaymentMode = "avista" | "parcelado";

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
      ? ["income", "fixed_income"].includes(transacao.type)
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

  // Parcelamento — apenas despesa + cartão + nova transação
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("avista");
  const [installmentsCount, setInstallmentsCount] = useState("2");
  const [firstInstallmentDate, setFirstInstallmentDate] = useState(today);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const showParcelamento =
    !isEditing && type === "expense" && paymentMethod === "credit_card";

  const isParcelado = showParcelamento && paymentMode === "parcelado";
  const autoStatus: "paid" | "pending" =
    !isParcelado && paymentMethod === "account" && date <= today ? "paid" : "pending";

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
    if (showParcelamento && paymentMode === "parcelado") {
      const n = parseInt(installmentsCount, 10);
      if (!n || n < 2) {
        setError("Número de parcelas deve ser pelo menos 2");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      if (!isEditing && showParcelamento && paymentMode === "parcelado") {
        // Criar parcelamento
        const res = await fetch("/api/parcelamentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: description.trim(),
            total_amount: parseFloat(amount),
            installments_count: parseInt(installmentsCount, 10),
            first_installment_date: firstInstallmentDate,
            credit_card_id: creditCardId,
            category_id: categoryId || null,
            notes: notes || null,
            scope: "personal",
          }),
        });
        if (!res.ok) {
          const { error: msg } = await res.json();
          throw new Error(msg ?? "Erro ao criar parcelamento");
        }
      } else {
        // Criar / editar transação avulsa
        const url = isEditing ? `/api/transacoes/${transacao.id}` : "/api/transacoes";
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
          scope: "personal",
        };

        if (!isEditing) {
          payload.type = type;
          payload.status = autoStatus;
        }

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const { error: msg } = await res.json();
          throw new Error(msg ?? "Erro ao salvar");
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

          {!isEditing && !isParcelado && paymentMethod === "account" && (
            <p className="text-xs text-brand-700/40 mb-3 flex items-center gap-1">
              {autoStatus === "paid" ? (
                <>
                  <CheckCircle2 size={11} className="text-green-500 shrink-0" />
                  Será registrada como{" "}
                  <span className="text-green-600 font-medium">paga</span>
                </>
              ) : (
                <>
                  <Clock size={11} className="shrink-0" />
                  Será registrada como{" "}
                  <span className="font-medium">pendente</span>
                </>
              )}
            </p>
          )}

          {!isEditing && paymentMethod === "credit_card" && (
            <p className="text-xs text-brand-700/40 mb-3 flex items-center gap-1">
              <CreditCardIcon size={11} className="shrink-0" />
              Será registrada na{" "}
              <span className="font-medium">fatura do cartão</span>
            </p>
          )}

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
              {loading
                ? "Salvando..."
                : !isEditing && showParcelamento && paymentMode === "parcelado"
                ? "Parcelar"
                : "Salvar"}
            </button>
          </div>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo — apenas na criação */}
        {!isEditing && (
          <div>
            <label className="block text-sm font-medium text-brand-700 mb-2">
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
                      setPaymentMode("avista");
                    }
                  }}
                  className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    type === value
                      ? value === "expense"
                        ? "bg-red-50 border-red-500 text-red-700"
                        : "bg-green-50 border-green-500 text-green-700"
                      : "bg-surface border-brand-700/30 text-brand-700 hover:bg-brand-700/5"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">
            Descrição <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              type === "income" ? "Ex: Freelance, Venda..." : "Ex: Mercado, Farmácia..."
            }
            className="w-full px-3 py-2.5 border border-brand-700/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-brand-700 mb-1">
              {showParcelamento && paymentMode === "parcelado" ? "Total (R$)" : "Valor (R$)"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="w-full px-3 py-2.5 border border-brand-700/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-700 mb-1">
              {showParcelamento && paymentMode === "parcelado" ? "Data 1ª parcela" : "Data"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <DatePicker
              value={showParcelamento && paymentMode === "parcelado" ? firstInstallmentDate : date}
              onChange={showParcelamento && paymentMode === "parcelado" ? setFirstInstallmentDate : setDate}
              placeholder="Selecione a data"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">
            Categoria
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2.5 border border-brand-700/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/30"
          >
            <option value="">Sem categoria</option>
            {categorias
              .filter((c) => c.type == null || c.type === (type === "income" ? "income" : "expense"))
              .map((c) => (
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
              <label className="block text-sm font-medium text-brand-700 mb-2">
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
                      if (value === "account") {
                        setCreditCardId("");
                        setPaymentMode("avista");
                      }
                    }}
                    className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      paymentMethod === value
                        ? "bg-brand-50 border-brand-500 text-brand-700"
                        : "bg-surface border-brand-700/30 text-brand-700 hover:bg-brand-700/5"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "credit_card" && (
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-1">
                  Cartão <span className="text-red-500">*</span>
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
            )}

            {/* Parcelamento — apenas nova despesa em cartão */}
            {showParcelamento && (
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">
                  Parcelamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "avista" as PaymentMode, label: "À vista" },
                    { value: "parcelado" as PaymentMode, label: "Parcelado" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        if (value === "parcelado") setFirstInstallmentDate(date);
                        setPaymentMode(value);
                      }}
                      className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
                        paymentMode === value
                          ? "bg-purple-50 border-purple-500 text-purple-700"
                          : "bg-surface border-brand-700/30 text-brand-700 hover:bg-brand-700/5"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {paymentMode === "parcelado" && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-brand-700 mb-1">
                      Nº de parcelas <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="72"
                      step="1"
                      value={installmentsCount}
                      onChange={(e) => setInstallmentsCount(e.target.value)}
                      className="w-full px-3 py-2.5 border border-brand-700/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/30"
                    />
                    {amount && parseInt(installmentsCount, 10) >= 2 && (
                      <p className="text-xs text-brand-700/40 mt-1">
                        ≈ R$ {(parseFloat(amount) / parseInt(installmentsCount, 10)).toFixed(2).replace(".", ",")} / parcela
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">
            Observações
          </label>
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
