"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Users, Pencil, XCircle, CheckCircle, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import DatePicker from "@/components/ui/DatePicker";
import ContribuicaoModal from "./ContribuicaoModal";
import TransacaoFamiliarModal from "./TransacaoFamiliarModal";
import {
  FamilyMember,
  FamilyContribution,
  FamilyTransaction,
  computeCaixaFamiliar,
  formatCurrency,
  formatMonth,
  formatDate,
  shiftMonth,
} from "./types";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface Props {
  currentMonth: string;
  userId: string;
  members: FamilyMember[];
  contributions: FamilyContribution[];
  familyTransactions: FamilyTransaction[];
  categorias: Category[];
}

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  income: "Receita",
  fixed_income: "Receita fixa",
  expense: "Despesa",
  fixed_expense: "Despesa fixa",
  installment: "Parcela",
  subscription: "Assinatura",
};

const EXPENSE_TYPES = new Set([
  "expense",
  "fixed_expense",
  "installment",
  "subscription",
]);

function StatusBadge({ status }: { status: string }) {
  if (status === "paid")
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
        Pago
      </span>
    );
  if (status === "pending")
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
        A pagar
      </span>
    );
  return null;
}

// Modal simples para pagar uma transação familiar
function PagarFamiliaModal({
  transacao,
  onClose,
  onSaved,
}: {
  transacao: FamilyTransaction;
  onClose: () => void;
  onSaved: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [paidDate, setPaidDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/transacoes/${transacao.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid", paid_at: `${paidDate}T12:00:00.000Z` }),
    });
    setLoading(false);
    if (!res.ok) {
      const { error: msg } = await res.json();
      setError(msg ?? "Erro ao salvar");
      return;
    }
    onSaved();
  }

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
              className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="pagar-familia-form"
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Salvando..." : "Confirmar Pagamento"}
            </button>
          </div>
        </div>
      }
    >
      <form id="pagar-familia-form" onSubmit={handleConfirm} className="space-y-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 truncate">{transacao.description}</p>
          <p className="text-base font-semibold text-gray-900 mt-0.5">
            {formatCurrency(transacao.amount)}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data de pagamento
          </label>
          <DatePicker
            value={paidDate}
            onChange={setPaidDate}
            placeholder="Selecione a data"
          />
          <p className="text-xs text-gray-400 mt-1">
            Padrão: hoje. Altere se o pagamento ocorreu em outra data.
          </p>
        </div>
      </form>
    </Modal>
  );
}

export default function FamiliaView({
  currentMonth,
  userId,
  members,
  contributions,
  familyTransactions,
  categorias,
}: Props) {
  const router = useRouter();
  const [isContribuicaoOpen, setIsContribuicaoOpen] = useState(false);
  const [isTransacaoOpen, setIsTransacaoOpen] = useState(false);
  const [editingTransacao, setEditingTransacao] = useState<FamilyTransaction | null>(null);
  const [pagandoTransacao, setPagandoTransacao] = useState<FamilyTransaction | null>(null);

  const { memberContribs, totalContribuicoes, totalGasto, totalReceita, saldoLivre } =
    computeCaixaFamiliar(contributions, members, familyTransactions);

  function navigate(delta: number) {
    router.push(`/familia?mes=${shiftMonth(currentMonth, delta)}`);
  }

  function handleSaved() {
    setIsTransacaoOpen(false);
    setEditingTransacao(null);
    setPagandoTransacao(null);
    router.refresh();
  }

  async function handleCancel(tx: FamilyTransaction) {
    await fetch(`/api/transacoes/${tx.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    router.refresh();
  }

  async function handleDelete(tx: FamilyTransaction) {
    if (!confirm("Excluir esta transação permanentemente?")) return;
    await fetch(`/api/transacoes/${tx.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Família</h1>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-base font-semibold text-gray-800 capitalize">
          {formatMonth(currentMonth)}
        </span>
        <button
          onClick={() => navigate(1)}
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Caixa Familiar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Caixa Familiar
          </h2>
          <button
            onClick={() => setIsContribuicaoOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
          >
            <Plus size={13} />
            Registrar aporte
          </button>
        </div>

        {/* Contributions per member */}
        <div className="grid grid-cols-2 gap-3">
          {members.map((member) => {
            const total = memberContribs.get(member.id) ?? 0;
            const memberConts = contributions.filter(
              (c) => c.user_id === member.id
            );
            return (
              <div
                key={member.id}
                className="bg-gray-50 rounded-xl p-3.5 flex flex-col gap-1"
              >
                <p className="text-xs text-gray-500 truncate">
                  {member.full_name ?? "Usuário"}
                </p>
                <p className="text-base font-bold text-gray-900">
                  {total > 0 ? formatCurrency(total) : "—"}
                </p>
                {memberConts.length > 0 && (
                  <p className="text-[10px] text-gray-400">
                    {memberConts.length}{" "}
                    {memberConts.length === 1 ? "aporte" : "aportes"}
                  </p>
                )}
                {total === 0 && (
                  <p className="text-[10px] text-gray-400">Nenhum aporte</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
          {[
            {
              label: "Total aportado",
              value: totalContribuicoes,
              color: "text-brand-600",
            },
            {
              label: "Gastos familiares",
              value: totalGasto,
              color: "text-red-500",
            },
            {
              label: "Saldo livre",
              value: saldoLivre,
              color: saldoLivre < 0 ? "text-red-600" : "text-green-600",
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
              <p className={`text-sm font-bold ${color}`}>
                {formatCurrency(value)}
              </p>
            </div>
          ))}
        </div>

        {totalReceita > 0 && (
          <p className="text-xs text-gray-400 text-center">
            Inclui{" "}
            <span className="text-green-600 font-medium">
              {formatCurrency(totalReceita)}
            </span>{" "}
            em receitas familiares
          </p>
        )}
      </div>

      {/* Family transactions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Transações familiares
            {familyTransactions.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({familyTransactions.length})
              </span>
            )}
          </h2>
          <button
            onClick={() => {
              setEditingTransacao(null);
              setIsTransacaoOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            <Plus size={13} />
            Nova Transação
          </button>
        </div>

        {familyTransactions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
            <Users className="mx-auto mb-3 text-gray-300" size={32} />
            <p className="text-sm text-gray-500">
              Nenhuma transação familiar em{" "}
              <span className="font-medium capitalize">
                {formatMonth(currentMonth)}
              </span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Use o botão "Nova Transação" acima para registrar
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {familyTransactions.map((tx) => {
              const isExpense = EXPENSE_TYPES.has(tx.type);
              const isManual = !tx.auto_generated;
              return (
                <div
                  key={tx.id}
                  className="bg-white rounded-xl border border-gray-100 px-4 py-3"
                >
                  {/* Linha 1: ícone + descrição + valor */}
                  <div className="flex items-center gap-3">
                    <span className="text-lg shrink-0">
                      {tx.category?.icon ?? (isExpense ? "💸" : "💰")}
                    </span>
                    <p className="flex-1 text-sm font-medium text-gray-900 truncate">
                      {tx.description}
                    </p>
                    <span
                      className={`text-sm font-semibold shrink-0 ${
                        isExpense ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {isExpense ? "-" : "+"}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>

                  {/* Linha 2: metadata + status + ações */}
                  <div className="flex items-center gap-2 mt-1.5 ml-9 min-w-0">
                    <p className="flex-1 text-xs text-gray-400 truncate min-w-0">
                      {formatDate(tx.date)} ·{" "}
                      {TRANSACTION_TYPE_LABELS[tx.type] ?? tx.type}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <StatusBadge status={tx.status} />

                      {/* Editar — apenas manuais */}
                      {isManual && tx.status !== "cancelled" && (
                        <button
                          onClick={() => {
                            setEditingTransacao(tx);
                            setIsTransacaoOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                          title="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                      )}

                      {/* Pagar — apenas pendentes */}
                      {tx.status === "pending" && (
                        <button
                          onClick={() => setPagandoTransacao(tx)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                          title="Marcar como pago"
                        >
                          <CheckCircle size={13} />
                        </button>
                      )}

                      {/* Cancelar — apenas não cancelados */}
                      {tx.status !== "cancelled" && (
                        <button
                          onClick={() => handleCancel(tx)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Cancelar"
                        >
                          <XCircle size={13} />
                        </button>
                      )}

                      {/* Excluir — apenas manuais cancelados */}
                      {isManual && tx.status === "cancelled" && (
                        <button
                          onClick={() => handleDelete(tx)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Excluir permanentemente"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ContribuicaoModal
        isOpen={isContribuicaoOpen}
        onClose={() => setIsContribuicaoOpen(false)}
      />

      {isTransacaoOpen && (
        <TransacaoFamiliarModal
          transacao={editingTransacao}
          categorias={categorias}
          onClose={() => {
            setIsTransacaoOpen(false);
            setEditingTransacao(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {pagandoTransacao && (
        <PagarFamiliaModal
          transacao={pagandoTransacao}
          onClose={() => setPagandoTransacao(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
