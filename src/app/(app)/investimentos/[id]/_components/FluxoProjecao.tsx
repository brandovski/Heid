"use client";

import { formatCurrency } from "../../_components/types";

interface ProjectItemRef {
  id: string;
  name: string;
  expected_payment_date?: string | null;
  budget_amount?: number | null;
  actual_amount: number | null;
}

interface Props {
  saldoAtual: number;
  monthlyContribution: number;
  projectItems: ProjectItemRef[];
}

interface ProjecaoRow {
  mes: string;
  label: string;
  contribuicao: number;
  deducoes: number;
  saldo: number;
}

function addMonths(baseDate: Date, months: number): string {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + months, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function formatMesLabel(mesStr: string): string {
  const [y, m] = mesStr.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]}/${String(y).slice(-2)}`;
}

export default function FluxoProjecao({ saldoAtual, monthlyContribution, projectItems }: Props) {
  const today = new Date();
  const todayMes = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  let saldo = saldoAtual;
  const projecao: ProjecaoRow[] = Array.from({ length: 12 }, (_, i) => {
    const mesStr = addMonths(today, i);
    saldo += monthlyContribution;

    const deducoes = projectItems
      .filter((pi) => pi.expected_payment_date?.startsWith(mesStr))
      .reduce((s, pi) => s + (pi.actual_amount ?? pi.budget_amount ?? 0), 0);

    saldo -= deducoes;

    return {
      mes: mesStr,
      label: formatMesLabel(mesStr),
      contribuicao: monthlyContribution,
      deducoes,
      saldo,
    };
  });

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">Projeção de Saldo — 12 meses</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Baseada no saldo atual e aporte mensal de {formatCurrency(monthlyContribution)}.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mês</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aporte</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Retiradas</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Saldo Projetado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {projecao.map((row) => {
              const isCurrentMonth = row.mes === todayMes;
              return (
                <tr
                  key={row.mes}
                  className={isCurrentMonth ? "bg-blue-50" : "hover:bg-gray-50/50"}
                >
                  <td className="px-4 py-2.5 text-gray-700 font-medium whitespace-nowrap">
                    {row.label}
                    {isCurrentMonth && (
                      <span className="ml-1.5 text-[10px] font-medium text-blue-600 bg-blue-100 rounded px-1 py-0.5">
                        atual
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-emerald-600 whitespace-nowrap">
                    +{formatCurrency(row.contribuicao)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-rose-500 whitespace-nowrap">
                    {row.deducoes > 0 ? `−${formatCurrency(row.deducoes)}` : "—"}
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right font-semibold whitespace-nowrap ${
                      row.saldo >= 0 ? "text-gray-900" : "text-rose-600"
                    }`}
                  >
                    {formatCurrency(row.saldo)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
