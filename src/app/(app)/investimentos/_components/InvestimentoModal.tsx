"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { Scope } from "@/types/database";
import type { Investment, InvestmentType } from "./types";
import { INVESTMENT_TYPE_LABELS } from "./types";

interface Props {
  investment?: Investment;
  onClose: () => void;
  onSaved: (investment: Investment) => void;
  userName?: string;
  partnerName?: string;
}

const TYPE_OPTIONS = Object.entries(INVESTMENT_TYPE_LABELS) as [InvestmentType, string][];

export default function InvestimentoModal({ investment, onClose, onSaved, userName, partnerName }: Props) {
  const isEdit = !!investment;

  const [name, setName] = useState(investment?.name ?? "");
  const [type, setType] = useState<InvestmentType>(investment?.type ?? "cofrinho");
  const [scope, setScope] = useState<Scope>(investment?.scope ?? "personal");
  const [description, setDescription] = useState(investment?.description ?? "");
  const [goalAmount, setGoalAmount] = useState(investment?.goal_amount != null ? String(investment.goal_amount) : "");

  // Owner contribution
  const [monthlyAmount, setMonthlyAmount] = useState(
    investment?.monthly_contribution_amount != null ? String(investment.monthly_contribution_amount) : ""
  );
  const [monthlyDay, setMonthlyDay] = useState(
    investment?.monthly_contribution_day != null ? String(investment.monthly_contribution_day) : ""
  );

  // Partner contribution
  const [partnerAmount, setPartnerAmount] = useState(
    investment?.partner_contribution_amount != null ? String(investment.partner_contribution_amount) : ""
  );
  const [partnerDay, setPartnerDay] = useState(
    investment?.partner_contribution_day != null ? String(investment.partner_contribution_day) : ""
  );

  // Card expansível
  const [contributionOpen, setContributionOpen] = useState(
    !!(investment?.monthly_contribution_amount || investment?.partner_contribution_amount)
  );

  const [eligibleForProjects, setEligibleForProjects] = useState(investment?.is_eligible_for_projects ?? false);
  const [archiving, setArchiving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name.trim()) { setError("Nome é obrigatório"); return; }

    const hasAmount = monthlyAmount.trim() !== "";
    const hasDay = monthlyDay.trim() !== "";
    if (hasAmount !== hasDay) {
      setError("Defina valor e dia do aporte mensal juntos (ou deixe ambos em branco)");
      return;
    }

    const hasPartnerAmount = partnerAmount.trim() !== "";
    const hasPartnerDay = partnerDay.trim() !== "";
    if (hasPartnerAmount !== hasPartnerDay) {
      setError("Defina valor e dia do aporte do parceiro juntos (ou deixe ambos em branco)");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      name,
      type,
      scope,
      description: description || null,
      goal_amount: goalAmount ? parseFloat(goalAmount) : null,
      monthly_contribution_amount: hasAmount ? parseFloat(monthlyAmount) : null,
      monthly_contribution_day: hasDay ? parseInt(monthlyDay) : null,
      partner_contribution_amount: hasPartnerAmount ? parseFloat(partnerAmount) : null,
      partner_contribution_day: hasPartnerDay ? parseInt(partnerDay) : null,
      is_eligible_for_projects: eligibleForProjects,
    };

    const url = isEdit ? `/api/investimentos/${investment.id}` : "/api/investimentos";
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

  async function handleArchive() {
    if (!confirm("Arquivar este investimento? Ele não aparecerá mais na lista ativa.")) return;
    setArchiving(true);
    const res = await fetch(`/api/investimentos/${investment!.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: false }),
    });
    if (res.ok) {
      onSaved(await res.json());
      onClose();
    } else {
      const d = await res.json();
      setError(d.error ?? "Erro ao arquivar");
      setArchiving(false);
    }
  }

  return (
    <Modal
      title={isEdit ? "Editar Investimento" : "Novo Investimento"}
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-60 transition-colors">
            {saving ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Tesouro Selic, CDB Nubank..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as InvestmentType)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {TYPE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Escopo</label>
          <div className="flex gap-2">
            {(["personal", "family"] as Scope[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  scope === s
                    ? "bg-brand-50 border-brand-500 text-brand-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {s === "personal" ? "Pessoal" : "Familiar"}
              </button>
            ))}
          </div>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Meta (R$)</label>
          <input
            type="number"
            value={goalAmount}
            onChange={(e) => setGoalAmount(e.target.value)}
            min="0"
            step="0.01"
            placeholder="Opcional"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* ── Aporte Mensal — card expansível ── */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setContributionOpen((v) => !v)}
            className="w-full flex items-center justify-between bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">Aporte Mensal</span>
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform duration-200 ${contributionOpen ? "rotate-180" : ""}`}
            />
          </button>

          {contributionOpen && (
            <div className="px-4 py-3 space-y-4 bg-white">
              <p className="text-xs text-gray-500">
                Configure os aportes de cada membro. Você confirmará manualmente todo mês.
              </p>

              {scope === "personal" ? (
                <div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={monthlyAmount}
                        onChange={(e) => setMonthlyAmount(e.target.value)}
                        min="0"
                        step="0.01"
                        placeholder="Valor (R$)"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div className="w-28">
                      <input
                        type="number"
                        value={monthlyDay}
                        onChange={(e) => setMonthlyDay(e.target.value)}
                        min="1"
                        max="28"
                        placeholder="Dia (1–28)"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Defina valor e dia juntos, ou deixe ambos em branco.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Seu aporte */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">{`Aporte de ${userName ?? "Você"}`}</p>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <input
                          type="number"
                          value={monthlyAmount}
                          onChange={(e) => setMonthlyAmount(e.target.value)}
                          min="0"
                          step="0.01"
                          placeholder="Valor (R$)"
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div className="w-28">
                        <input
                          type="number"
                          value={monthlyDay}
                          onChange={(e) => setMonthlyDay(e.target.value)}
                          min="1"
                          max="28"
                          placeholder="Dia (1–28)"
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Aporte do parceiro */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">{`Aporte de ${partnerName ?? "Parceiro"}`}</p>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <input
                          type="number"
                          value={partnerAmount}
                          onChange={(e) => setPartnerAmount(e.target.value)}
                          min="0"
                          step="0.01"
                          placeholder="Valor (R$)"
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div className="w-28">
                        <input
                          type="number"
                          value={partnerDay}
                          onChange={(e) => setPartnerDay(e.target.value)}
                          min="1"
                          max="28"
                          placeholder="Dia (1–28)"
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">Defina valor e dia juntos, ou deixe ambos em branco para cada membro.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <input
            id="eligible"
            type="checkbox"
            checked={eligibleForProjects}
            onChange={(e) => setEligibleForProjects(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <label htmlFor="eligible" className="text-sm text-gray-700">
            Elegível para uso em Projetos
          </label>
        </div>

        {isEdit && investment.is_active && (
          <div className="pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleArchive}
              disabled={archiving}
              className="w-full px-4 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-60 transition-colors"
            >
              {archiving ? "Arquivando..." : "Arquivar investimento"}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
