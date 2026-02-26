"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import type { Category, CreditCard, TransactionStatus } from "@/types/database";
import type { TransactionWithRelations, FaturaGrupo, InvoicePaymentSimple } from "./types";
import {
  isIncome,
  prevMonth,
  nextMonth,
  formatMonthLabel,
  formatCurrency,
  EXPENSE_TYPES,
} from "./types";
import TransacaoCard from "./TransacaoCard";
import TransacaoModal from "./TransacaoModal";
import PagarModal from "./PagarModal";
import FaturaGrupoCard from "./FaturaGrupoCard";

interface Props {
  transacoes: TransactionWithRelations[];
  categorias: Pick<Category, "id" | "name" | "icon" | "color">[];
  cartoes: Pick<CreditCard, "id" | "name" | "brand" | "color">[];
  invoicePayments: InvoicePaymentSimple[];
  mes: string;
  currentUserId: string;
  partnerName: string;
  shareWithPartner: boolean;
}

type ScopeFilter = "personal" | "partner";
type TypeFilter = "all" | "income" | "expense";

export default function TransacaoList({
  transacoes,
  categorias,
  cartoes,
  invoicePayments,
  mes,
  currentUserId,
  partnerName,
  shareWithPartner,
}: Props) {
  const router = useRouter();

  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("personal");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TransactionWithRelations | null>(null);
  const [pagando, setPagando] = useState<TransactionWithRelations | null>(null);

  const [sharingLoading, setSharingLoading] = useState(false);
  const [isShared, setIsShared] = useState(shareWithPartner);

  function handleEdit(t: TransactionWithRelations) {
    setEditing(t);
    setShowModal(true);
  }

  function handlePagar(t: TransactionWithRelations) {
    setPagando(t);
  }

  function handleClose() {
    setShowModal(false);
    setEditing(null);
  }

  function handleSaved() {
    handleClose();
    setPagando(null);
    router.refresh();
  }

  async function handleShareToggle() {
    setSharingLoading(true);
    try {
      const newValue = !isShared;
      const res = await fetch("/api/profile/sharing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ share_with_partner: newValue }),
      });
      if (res.ok) {
        setIsShared(newValue);
      }
    } finally {
      setSharingLoading(false);
    }
  }

  // ── Grupos de fatura por cartão (apenas transações pessoais do usuário logado) ──
  const myTransactions = transacoes.filter((t) => t.user_id === currentUserId);
  const cardTxs = myTransactions.filter(
    (t) => t.credit_card_id && t.status !== "cancelled"
  );
  const flatTxs = transacoes.filter((t) => !t.credit_card_id);

  const grupoMap = new Map<string, FaturaGrupo>();
  for (const t of cardTxs) {
    const cardId = t.credit_card_id!;
    if (!grupoMap.has(cardId)) {
      grupoMap.set(cardId, {
        cartaoId: cardId,
        cartaoNome: t.credit_card?.name ?? "Cartão",
        cartaoBrand: t.credit_card?.brand ?? "",
        cartaoColor: t.credit_card?.color ?? null,
        transactions: [],
        total: 0,
        isPaid: false,
        payment: null,
      });
    }
    const grupo = grupoMap.get(cardId)!;
    grupo.transactions.push(t);
    grupo.total += t.amount;
  }

  // Enriquecer com dados de pagamento
  for (const pmt of invoicePayments) {
    const grupo = grupoMap.get(pmt.credit_card_id);
    if (grupo) {
      grupo.isPaid = true;
      grupo.payment = pmt;
    }
  }

  const faturaGrupos = [...grupoMap.values()].filter((g) => g.total > 0);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const scopedTxs = flatTxs.filter((t) => {
    if (scopeFilter === "personal") return t.user_id === currentUserId;
    // partner: transações compartilhadas do parceiro
    return t.is_shared === true && t.user_id !== currentUserId;
  });

  const filtered = scopedTxs.filter((t) => {
    if (typeFilter === "income" && !isIncome(t.type)) return false;
    if (
      typeFilter === "expense" &&
      !EXPENSE_TYPES.includes(t.type as (typeof EXPENSE_TYPES)[number])
    )
      return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (categoryFilter && t.category_id !== categoryFilter) return false;
    return true;
  });

  // Summary (excludes cancelled)
  const nonCancelled = filtered.filter((t) => t.status !== "cancelled");
  const totalReceitas = nonCancelled
    .filter((t) => isIncome(t.type))
    .reduce((sum, t) => sum + t.amount, 0);
  const totalDespesas = nonCancelled
    .filter((t) => !isIncome(t.type))
    .reduce((sum, t) => sum + t.amount, 0);
  const saldo = totalReceitas - totalDespesas;

  // Month navigation
  const isCurrentMonth = (() => {
    const today = new Date();
    const current = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    return mes === current;
  })();

  return (
    <div>
      {/* Header: título + mês + botão novo */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Transações</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nova Transação</span>
          <span className="sm:hidden">Nova</span>
        </button>
      </div>

      {/* Toggle compartilhamento */}
      <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-xl border border-gray-100">
        <Share2 size={15} className="text-gray-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-700">
            Compartilhar com {partnerName}
          </p>
          <p className="text-xs text-gray-400">
            Novas transações serão visíveis para {partnerName}
          </p>
        </div>
        <button
          role="switch"
          aria-checked={isShared}
          onClick={handleShareToggle}
          disabled={sharingLoading}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
            isShared ? "bg-blue-600" : "bg-gray-200"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              isShared ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Navegação de mês */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => router.push(`/transacoes?mes=${prevMonth(mes)}`)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          aria-label="Mês anterior"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-base font-semibold text-gray-900 min-w-[160px] text-center">
          {formatMonthLabel(mes)}
        </span>
        <button
          onClick={() => router.push(`/transacoes?mes=${nextMonth(mes)}`)}
          disabled={isCurrentMonth}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Próximo mês"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Resumo */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-xs text-green-600 font-medium mb-0.5">Receitas</p>
            <p className="text-sm font-bold text-green-700">
              {formatCurrency(totalReceitas)}
            </p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-xs text-red-600 font-medium mb-0.5">Despesas</p>
            <p className="text-sm font-bold text-red-700">
              {formatCurrency(totalDespesas)}
            </p>
          </div>
          <div
            className={`rounded-xl p-3 text-center ${
              saldo >= 0 ? "bg-blue-50" : "bg-orange-50"
            }`}
          >
            <p
              className={`text-xs font-medium mb-0.5 ${
                saldo >= 0 ? "text-blue-600" : "text-orange-600"
              }`}
            >
              Saldo
            </p>
            <p
              className={`text-sm font-bold ${
                saldo >= 0 ? "text-blue-700" : "text-orange-700"
              }`}
            >
              {formatCurrency(saldo)}
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="space-y-3 mb-5">
        {/* Tabs Pessoal / Parceiro */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-fit">
          {(
            [
              { value: "personal" as ScopeFilter, label: "Meu" },
              { value: "partner" as ScopeFilter, label: partnerName },
            ]
          ).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setScopeFilter(value)}
              className={`flex flex-1 sm:flex-none items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                scopeFilter === value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tipo + Status + Categoria */}
        <div className="flex flex-wrap gap-2">
          {/* Tipo */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {(
              [
                { value: "all", label: "Todos" },
                { value: "income", label: "Receitas" },
                { value: "expense", label: "Despesas" },
              ] as { value: TypeFilter; label: string }[]
            ).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setTypeFilter(value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  typeFilter === value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {(
              [
                { value: "all", label: "Status" },
                { value: "pending", label: "Pendente" },
                { value: "paid", label: "Pago" },
                { value: "cancelled", label: "Cancelado" },
              ] as { value: TransactionStatus | "all"; label: string }[]
            ).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Categoria */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-600 focus:outline-none border-none"
          >
            <option value="">Categoria</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ""}
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Grupos de fatura (fixos no topo — apenas quando visualizando transações pessoais) ── */}
      {scopeFilter === "personal" && faturaGrupos.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-0.5">
            Faturas de cartão
          </p>
          {faturaGrupos.map((grupo) => (
            <FaturaGrupoCard
              key={grupo.cartaoId}
              grupo={grupo}
              mes={mes}
              onPaid={handleSaved}
            />
          ))}
        </div>
      )}

      {/* ── Lista de transações ── */}
      {filtered.length === 0 && (scopeFilter !== "personal" || faturaGrupos.length === 0) ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">Nenhuma transação encontrada.</p>
          {scopeFilter === "personal" && transacoes.length === 0 && (
            <p className="text-xs mt-1">
              Lance uma nova transação ou aguarde o cron do mês.
            </p>
          )}
          {scopeFilter === "partner" && (
            <p className="text-xs mt-1">
              {partnerName} não tem transações compartilhadas neste mês.
            </p>
          )}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((t) => (
            <TransacaoCard
              key={t.id}
              transacao={t}
              onEdit={scopeFilter === "personal" ? handleEdit : undefined}
              onPagar={scopeFilter === "personal" ? handlePagar : undefined}
              onSaved={handleSaved}
            />
          ))}
        </div>
      ) : null}

      {/* Modais */}
      {showModal && (
        <TransacaoModal
          transacao={editing}
          categorias={categorias}
          cartoes={cartoes}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}

      {pagando && (
        <PagarModal
          transacao={pagando}
          onClose={() => setPagando(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
