"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CategoryAmount, formatCurrency } from "./types";

const COLORS = [
  "#2563EB",
  "#16A34A",
  "#84CC16",
  "#EC4899",
  "#8B5CF6",
  "#EAB308",
  "#F97316",
  "#06B6D4",
  "#EF4444",
  "#0D9488",
];

const COLORS_DARK = [
  "#1D4ED8",
  "#15803D",
  "#65A30D",
  "#DB2777",
  "#7C3AED",
  "#CA8A04",
  "#EA580C",
  "#0891B2",
  "#DC2626",
  "#0F766E",
];

interface Props {
  data: CategoryAmount[];
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { fill: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-surface border border-brand shadow-panel rounded-card px-4 py-3 text-xs min-w-[130px]">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: item.payload.fill }}
        />
        <span className="font-medium text-brand-700 truncate max-w-[120px]">
          {item.name}
        </span>
      </div>
      <p className="font-semibold text-brand-700 text-sm mt-1">
        {formatCurrency(item.value)}
      </p>
    </div>
  );
}

function CenterLabel({
  cx,
  cy,
  total,
}: {
  cx: number;
  cy: number;
  total: number;
}) {
  return (
    <>
      <text
        x={cx}
        y={cy - 7}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#1b4437"
        fontSize={14}
        fontWeight={600}
      >
        {formatCurrency(total)}
      </text>
      <text
        x={cx}
        y={cy + 11}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#1b443799"
        fontSize={10}
      >
        total
      </text>
    </>
  );
}

export default function GraficoCategoria({ data }: Props) {
  const total = data.reduce((s, d) => s + d.amount, 0);
  const top = data.slice(0, 10);

  return (
    <div className="flex flex-col gap-4">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          {/* Camada inferior — extrusion (simula profundidade 3D) */}
          <Pie
            data={top}
            cx="50%"
            cy="58%"
            innerRadius={56}
            outerRadius={82}
            cornerRadius={4}
            paddingAngle={2}
            dataKey="amount"
            nameKey="name"
            isAnimationActive={false}
            stroke="none"
            tabIndex={-1}
            style={{ pointerEvents: "none" }}
          >
            {top.map((_, i) => (
              <Cell key={i} fill={COLORS_DARK[i % COLORS_DARK.length]} />
            ))}
          </Pie>

          {/* Camada superior — face principal (cor cheia) */}
          <Pie
            data={top}
            cx="50%"
            cy="50%"
            innerRadius={56}
            outerRadius={78}
            cornerRadius={4}
            paddingAngle={2}
            dataKey="amount"
            nameKey="name"
            label={({ cx, cy }) => (
              <CenterLabel cx={cx} cy={cy} total={total} />
            )}
            labelLine={false}
            isAnimationActive={false}
            stroke="none"
          >
            {top.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>

          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legenda */}
      <div className="space-y-1.5">
        {top.slice(0, 5).map((cat, i) => (
          <div key={cat.name} className="flex items-center gap-2 text-xs">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-brand-700/60 truncate flex-1">{cat.name}</span>
            <span className="font-medium text-brand-700 shrink-0">
              {formatCurrency(cat.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
