"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MonthlyTotal, formatCurrency } from "./types";

interface Props {
  data: MonthlyTotal[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-xl rounded-xl px-4 py-3 text-xs min-w-[140px]">
      <p className="font-semibold text-gray-600 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1 last:mb-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-gray-400">{p.dataKey}:</span>
          <span className="font-semibold text-gray-800 ml-auto pl-2">
            {formatCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function yFormatter(value: number): string {
  if (value === 0) return "R$0";
  if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`;
  return `R$${value}`;
}

export default function GraficoEvolucao({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="grad-receitas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1D2D28" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#1D2D28" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="grad-despesas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#f3f4f6"
          vertical={false}
        />

        <XAxis
          dataKey="Mês"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          dy={6}
        />

        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={yFormatter}
          width={48}
        />

        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }}
        />

        <Area
          type="monotone"
          dataKey="Receitas"
          stroke="#1D2D28"
          strokeWidth={2}
          fill="url(#grad-receitas)"
          dot={false}
          activeDot={{ r: 4, fill: "#1D2D28", stroke: "#fff", strokeWidth: 2 }}
        />
        <Area
          type="monotone"
          dataKey="Despesas"
          stroke="#f43f5e"
          strokeWidth={2}
          fill="url(#grad-despesas)"
          dot={false}
          activeDot={{ r: 4, fill: "#f43f5e", stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
