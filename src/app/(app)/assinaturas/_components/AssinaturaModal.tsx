"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import DatePicker from "@/components/ui/DatePicker";
import type { Category, CreditCard } from "@/types/database";
import type { SubscriptionWithRelations } from "./types";

interface Props {
  assinatura: SubscriptionWithRelations | null;
  categorias: Pick<Category, "id" | "name" | "icon">[];
  cartoes: Pick<CreditCard, "id" | "name" | "brand">[];
  onClose: () => void;
  onSaved: () => void;
}

export default function AssinaturaModal({
  assinatura,
  categorias,
  cartoes,
  onClose,
  onSaved,
}: Props) {
  const isEditing = assinatura !== null;
  const today = new Date().toISOString().split("T")[0];

  const [name, setName] = useState(assinatura?.name ?? "");
  const [currency, setCurrency] = useState<"BRL" | "USD">(
    assinatura?.original_currency === "USD" ? "USD" : "BRL"
  );
  const [amountOriginal, setAmountOriginal] = useState(
    assinatura?.amount_original?.toString() ?? ""
  );
  const [amountBrl, setAmountBrl] = useState(assinatura?.amount_brl?.toString() ?? "");
  const [creditCardId, setCreditCardId] = useState(assinatura?.credit_card_id ?? "");
  const [categoryId, setCategoryId] = useState(assinatura?.category_id ?? "");
  const [startDate, setStartDate] = useState(assinatura?.start_date ?? today);
  const [notes, setNotes] = useState(assinatura?.notes ?? "");
  // Valor promocional
  const [hasPromo, setHasPromo] = useState(
    assinatura?.promotional_amount != null && assinatura?.promotional_months != null
  );
  const [promoAmount, setPromoAmount] = useState(
    assinatura?.promotional_amount?.toString() ?? ""
  );
  const [promoMonths, setPromoMonths] = useState(
    assinatura?.promotional_months?.toString() ?? ""
  );

  const [rateStatus, setRateStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [rate, setRate] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-fetch rate when USD is selected
  useEffect(() => {
    if (currency !== "USD") {
      setRateStatus("idle");
      setRate(null);
      return;
    }
    setRateStatus("loading");
    fetch("/api/cotacao")
      .then((r) => r.json())
      .then((data) => {
        if (data.rate) {
          setRate(data.rate);
          setRateStatus("ok");
          // Auto-populate amountBrl if amountOriginal is already set
          const original = parseFloat(amountOriginal);
          if (!isNaN(original) && original > 0) {
            setAmountBrl((original * data.rate).toFixed(2));
          }
        } else {
          setRateStatus("error");
        }
      })
      .catch(() => setRateStatus("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency]);

  // Recalculate amountBrl when amountOriginal changes and rate is available
  useEffect(() => {
    if (currency === "USD" && rate && amountOriginal) {
      const original = parseFloat(amountOriginal);
      if (!isNaN(original) && original > 0) {
        setAmountBrl((original * rate).toFixed(2));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountOriginal]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !amountOriginal || !creditCardId || !startDate) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }
    if (currency === "USD" && !amountBrl) {
      setError("Informe o valor em BRL para assinatura em dólar");
      return;
    }

    setLoading(true);
    setError("");

    const payload: Record<string, unknown> = {
      name: name.trim(),
      original_currency: currency,
      amount_original: parseFloat(amountOriginal),
      amount_brl: currency === "BRL" ? parseFloat(amountOriginal) : parseFloat(amountBrl),
      credit_card_id: creditCardId,
      category_id: categoryId || null,
      notes: notes || null,
    };

    if (!isEditing) {
      payload.start_date = startDate;
    }

    if (hasPromo && promoAmount && promoMonths) {
      payload.promotional_amount = parseFloat(promoAmount);
      payload.promotional_months = parseInt(promoMonths);
    } else {
      payload.promotional_amount = null;
      payload.promotional_months = null;
    }

    const url = isEditing ? `/api/assinaturas/${assinatura.id}` : "/api/assinaturas";
    const method = isEditing ? "PATCH" : "POST";

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

  const formId = "assinatura-form";

  return (
    <Modal
      title={isEditing ? "Editar Assinatura" : "Nova Assinatura"}
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
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Netflix, Spotify, iCloud..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Moeda */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Moeda</label>
          <div className="grid grid-cols-2 gap-2">
            {(["BRL", "USD"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  currency === c
                    ? "bg-brand-50 border-brand-500 text-brand-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {c === "BRL" ? "🇧🇷 BRL" : "🇺🇸 USD"}
              </button>
            ))}
          </div>
        </div>

        {/* Valor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor ({currency}) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amountOriginal}
            onChange={(e) => setAmountOriginal(e.target.value)}
            placeholder="0,00"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Campo de valor BRL para USD */}
        {currency === "USD" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor em R$ <span className="text-red-500">*</span>
            </label>
            {rateStatus === "loading" && (
              <p className="text-xs text-gray-400 mb-1">Buscando cotação atual…</p>
            )}
            {rateStatus === "ok" && rate && (
              <p className="text-xs text-green-600 mb-1">
                Taxa atual: R$ {rate.toFixed(4)} · Valor calculado automaticamente
              </p>
            )}
            {rateStatus === "error" && (
              <p className="text-xs text-orange-600 mb-1">
                Cotação indisponível — informe o valor em BRL manualmente.
              </p>
            )}
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amountBrl}
              onChange={(e) => setAmountBrl(e.target.value)}
              placeholder="0,00"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        )}

        {!isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de início (1ª cobrança) <span className="text-red-500">*</span>
            </label>
            <DatePicker value={startDate} onChange={setStartDate} placeholder="Selecione" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cartão de crédito <span className="text-red-500">*</span>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Opcional"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>

        {/* Valor promocional */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasPromo}
              onChange={(e) => {
                setHasPromo(e.target.checked);
                if (!e.target.checked) {
                  setPromoAmount("");
                  setPromoMonths("");
                }
              }}
              className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-gray-700">Tem valor promocional?</span>
          </label>
          {hasPromo && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Valor promo (R$) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={promoAmount}
                  onChange={(e) => setPromoAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nº de meses <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={promoMonths}
                  onChange={(e) => setPromoMonths(e.target.value)}
                  placeholder="Ex: 3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          )}
        </div>

      </form>
    </Modal>
  );
}
