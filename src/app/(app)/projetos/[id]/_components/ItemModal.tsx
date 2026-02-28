"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import DatePicker from "@/components/ui/DatePicker";
import type { ProjectItem, ProjectGroup, ProjectItemWithRelations } from "../../_components/types";
import { formatCurrency } from "../../_components/types";
import type { Investment } from "@/app/(app)/investimentos/_components/types";
import { INVESTMENT_TYPE_LABELS } from "@/app/(app)/investimentos/_components/types";

interface CreditCard {
  id: string;
  name: string;
  brand: string;
}

interface Category {
  id: string;
  name: string;
}

interface Props {
  projectId: string;
  groups: ProjectGroup[];
  categories: Category[];
  creditCards: CreditCard[];
  eligibleInvestments: Investment[];
  item?: ProjectItemWithRelations;
  defaultGroupId?: string;
  mode?: "create" | "edit" | "confirm";
  onClose: () => void;
  onSaved: (item: ProjectItem) => void;
}

type PaymentType = "cash" | "card_installment" | "deposit_remainder";
type PaymentOrigin = "personal" | "family" | "investment";
type CashMethod = "debit" | "pix" | "cash" | "transfer";

const PAYMENT_TYPE_OPTIONS: { value: PaymentType; label: string }[] = [
  { value: "cash", label: "À Vista" },
  { value: "card_installment", label: "Parcelado" },
  { value: "deposit_remainder", label: "Sinal + Restante" },
];

const CASH_METHODS: { value: CashMethod; label: string }[] = [
  { value: "debit", label: "Débito" },
  { value: "pix", label: "PIX" },
  { value: "cash", label: "Dinheiro" },
  { value: "transfer", label: "Transferência" },
];

export default function ItemModal({
  projectId,
  groups,
  categories,
  creditCards,
  eligibleInvestments,
  item,
  defaultGroupId,
  mode = "create",
  onClose,
  onSaved,
}: Props) {
  const isConfirm = mode === "confirm";
  const isEdit = mode === "edit";

  const [groupId, setGroupId] = useState(item?.project_group_id ?? defaultGroupId ?? groups[0]?.id ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [budgetAmount, setBudgetAmount] = useState(item?.budget_amount != null ? String(item.budget_amount) : "");
  const [actualAmount, setActualAmount] = useState(
    item?.actual_amount != null ? String(item.actual_amount) :
    item?.budget_amount != null ? String(item.budget_amount) : ""
  );
  const [paymentType, setPaymentType] = useState<PaymentType | "">(item?.payment_type ?? "");
  const [paymentOrigin, setPaymentOrigin] = useState<PaymentOrigin>(
    (item?.payment_origin as PaymentOrigin | null) ?? "personal"
  );
  const [investmentId, setInvestmentId] = useState(item?.investment_id ?? "");
  const [paymentMethod, setPaymentMethod] = useState<CashMethod | "">(item?.payment_method ?? "");
  const [creditCardId, setCreditCardId] = useState(item?.credit_card_id ?? "");
  const [installmentsCount, setInstallmentsCount] = useState(item?.installments_count ? String(item.installments_count) : "2");
  const [depositAmount, setDepositAmount] = useState(item?.deposit_amount != null ? String(item.deposit_amount) : "");
  const [remainderDate, setRemainderDate] = useState(item?.remainder_date ?? "");
  const [categoryId, setCategoryId] = useState(item?.category_id ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [expectedPaymentDate, setExpectedPaymentDate] = useState(item?.expected_payment_date ?? "");
  const [confirmDepositAmount, setConfirmDepositAmount] = useState(
    item?.deposit_amount != null ? String(item.deposit_amount) : ""
  );
  const [confirmRemainderDate, setConfirmRemainderDate] = useState(item?.remainder_date ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const depositAmountNum = parseFloat(depositAmount) || 0;
  const actualAmountNum = parseFloat(actualAmount) || 0;
  const remainderPreview = actualAmountNum - depositAmountNum;
  const confirmDepositAmountNum = parseFloat(confirmDepositAmount) || 0;
  const confirmRemainderPreview = actualAmountNum - confirmDepositAmountNum;

  async function handleSave() {
    if (isConfirm) {
      if (!actualAmount || parseFloat(actualAmount) <= 0) {
        setError("Valor real é obrigatório");
        return;
      }
      setSaving(true);
      const confirmPayload: Record<string, unknown> = {
        confirmar: true,
        actual_amount: parseFloat(actualAmount),
        expected_payment_date: expectedPaymentDate || null,
      };
      if (item?.payment_type === "deposit_remainder") {
        confirmPayload.deposit_amount = parseFloat(confirmDepositAmount) || null;
        confirmPayload.remainder_date = confirmRemainderDate || null;
      }
      const res = await fetch(`/api/projetos/itens/${item!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(confirmPayload),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Erro ao confirmar");
        setSaving(false);
        return;
      }
      onSaved(await res.json());
      onClose();
      return;
    }

    if (!name.trim()) { setError("Nome é obrigatório"); return; }

    setSaving(true);
    setError("");

    if (paymentType && paymentOrigin === "investment" && !investmentId) {
      setError("Selecione um investimento");
      setSaving(false);
      return;
    }

    const payload: Record<string, unknown> = {
      project_group_id: groupId,
      project_id: projectId,
      name,
      description: description || null,
      budget_amount: budgetAmount ? parseFloat(budgetAmount) : null,
      payment_type: paymentType || null,
      payment_origin: paymentType ? paymentOrigin : null,
      investment_id: paymentType && paymentOrigin === "investment" ? investmentId || null : null,
      payment_method: paymentType === "cash" ? paymentMethod || null : null,
      credit_card_id: paymentType === "card_installment" ? creditCardId || null : null,
      installments_count: paymentType === "card_installment" ? parseInt(installmentsCount) : null,
      deposit_amount: paymentType === "deposit_remainder" ? parseFloat(depositAmount) || null : null,
      remainder_date: paymentType === "deposit_remainder" ? remainderDate || null : null,
      category_id: categoryId || null,
      notes: notes || null,
    };

    const url = isEdit ? `/api/projetos/itens/${item!.id}` : "/api/projetos/itens";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Erro ao salvar");
      setSaving(false);
      return;
    }

    onSaved(await res.json());
    onClose();
  }

  const title = isConfirm ? "Confirmar Item" : isEdit ? "Editar Item" : "Novo Item";

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-60 transition-colors">
            {saving ? "Salvando..." : isConfirm ? "Confirmar" : isEdit ? "Salvar" : "Criar"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        {/* Confirm mode */}
        {isConfirm ? (
          <>
            <p className="text-sm text-gray-600">
              Confirme o valor real do item <strong>{item?.name}</strong> para finalizar.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {item?.payment_type === "deposit_remainder" ? "Valor Total Real (R$) *" : "Valor Real (R$) *"}
              </label>
              <input
                type="number"
                value={actualAmount}
                onChange={(e) => setActualAmount(e.target.value)}
                min="0"
                step="0.01"
                placeholder="0,00"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {item?.payment_type === "deposit_remainder" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor da Entrada (R$) *</label>
                  <input
                    type="number"
                    value={confirmDepositAmount}
                    onChange={(e) => setConfirmDepositAmount(e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de pagamento da entrada</label>
                  <DatePicker
                    value={expectedPaymentDate}
                    onChange={setExpectedPaymentDate}
                    placeholder="Selecione a data"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de pagamento do restante</label>
                  <DatePicker
                    value={confirmRemainderDate}
                    onChange={setConfirmRemainderDate}
                    placeholder="Selecione a data"
                  />
                </div>
                {confirmDepositAmountNum > 0 && actualAmountNum > 0 && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                    Restante: <strong>{formatCurrency(confirmRemainderPreview)}</strong>
                  </p>
                )}
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data prevista de pagamento
                </label>
                <DatePicker
                  value={expectedPaymentDate}
                  onChange={setExpectedPaymentDate}
                  placeholder="Selecione a data"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Usada na projeção de saldo do investimento.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Group selector */}
            {groups.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Buffet, Passagem aérea..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Opcional"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Orçado (R$)</label>
              <input
                type="number"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                min="0"
                step="0.01"
                placeholder="0,00"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Category */}
            {categories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Sem categoria</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Payment type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pagamento</label>
              <div className="flex gap-2 flex-wrap">
                {PAYMENT_TYPE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentType(paymentType === value ? "" : value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      paymentType === value
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment-type-specific fields */}
            {paymentType && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Origem do Pagamento</label>
                  <div className="flex gap-2 flex-wrap">
                    {(["personal", "family"] as const).map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setPaymentOrigin(o)}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                          paymentOrigin === o
                            ? "bg-brand-600 text-white border-brand-600"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {o === "personal" ? "Pessoal" : "Caixa Familiar"}
                      </button>
                    ))}
                    {eligibleInvestments.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPaymentOrigin("investment")}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                          paymentOrigin === "investment"
                            ? "bg-brand-600 text-white border-brand-600"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        Investimento
                      </button>
                    )}
                  </div>
                </div>

                {paymentOrigin === "investment" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Investimento</label>
                    <select
                      value={investmentId}
                      onChange={(e) => setInvestmentId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">Selecione...</option>
                      {eligibleInvestments.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.name} ({INVESTMENT_TYPE_LABELS[inv.type]})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {paymentType === "cash" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
                <div className="flex gap-2 flex-wrap">
                  {CASH_METHODS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPaymentMethod(paymentMethod === value ? "" : value)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        paymentMethod === value
                          ? "bg-brand-600 text-white border-brand-600"
                          : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {paymentType === "card_installment" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cartão</label>
                  <select
                    value={creditCardId}
                    onChange={(e) => setCreditCardId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Selecione...</option>
                    {creditCards.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nº de Parcelas</label>
                  <input
                    type="number"
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(e.target.value)}
                    min="2"
                    max="48"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            )}

            {paymentType === "deposit_remainder" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Sinal (R$)</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data do Restante</label>
                  <DatePicker value={remainderDate} onChange={setRemainderDate} placeholder="Selecione a data" />
                </div>
                {depositAmountNum > 0 && actualAmountNum > 0 && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                    Restante a pagar: <strong>{formatCurrency(remainderPreview)}</strong>
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Opcional"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
