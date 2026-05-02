"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { InvestmentSnapshot } from "../../_components/types";

interface Props {
  snapshots: InvestmentSnapshot[];
}

function formatMonth(dateStr: string): string {
  const [year, month] = dateStr.split("-");
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${months[parseInt(month) - 1]}/${year.slice(2)}`;
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function GraficoEvolucao({ snapshots }: Props) {
  if (snapshots.length === 0) {
    return (
      <div className="text-center py-8 text-brand-700/40 text-sm border-2 border-dashed border-brand-700/20 rounded-xl">
        Nenhum saldo registrado ainda.
      </div>
    );
  }

  // Sort ascending for chart
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const data = sorted.map((s) => ({
    date: s.date,
    label: formatMonth(s.date),
    value: s.value,
  }));

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
            width={52}
          />
          <Tooltip
            formatter={(value: number) => [formatBRL(value), "Saldo"]}
            labelStyle={{ fontSize: 12, color: "#374151" }}
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 3, fill: "#2563eb" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
