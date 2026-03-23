"use client";

import { PieChart, Pie, Cell, Tooltip, Label, ResponsiveContainer } from "recharts";
import type { CategoryAmount } from "./types";
import { formatCurrency } from "./types";

const COLORS = [
  "#A8C5B5", // sage green (brand family)
  "#E8D87A", // golden yellow (accent family)
  "#E8A8A8", // dusty rose
  "#A8C5E8", // periwinkle
  "#C8B8E8", // soft lavender
  "#E8C4A0", // warm peach
  "#A8DEC0", // mint
  "#B8D8E0", // powder blue
  "#E0B8C0", // blush
  "#C8D8A8", // soft lime
];

interface Props { data: CategoryAmount[] }

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
    <div className="bg-surface border border-brand shadow-panel rounded-card px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-sm shrink-0"
          style={{ backgroundColor: item.payload.fill }}
        />
        <span className="text-brand-700/60">{item.name}</span>
        <span className="ml-auto pl-5 font-medium text-brand-700 tabular-nums">
          {formatCurrency(item.value)}
        </span>
      </div>
    </div>
  );
}

export default function GraficoCategoria({ data }: Props) {
  const total = data.reduce((s, d) => s + d.amount, 0);
  const top   = data.slice(0, 10);

  if (top.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center">
        <p className="text-sm text-brand-700/40">Nenhuma despesa registrada</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" aspect={1} maxHeight={220}>
      <PieChart>
        <Tooltip
          cursor={false}
          content={<CustomTooltip />}
        />
        <Pie
          data={top.map((d, i) => ({ ...d, fill: COLORS[i % COLORS.length] }))}
          dataKey="amount"
          nameKey="name"
          innerRadius="62%"
          outerRadius="78%"
          cornerRadius={0}
          paddingAngle={2}
          strokeWidth={0}
          isAnimationActive={false}
        >
          {top.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
              const { cx, cy } = viewBox as { cx: number; cy: number };
              return (
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ fontFamily: "var(--font-poppins)" }}
                >
                  <tspan
                    x={cx}
                    y={cy - 10}
                    fontSize={18}
                    fontWeight={700}
                    fill="#1b4437"
                  >
                    {formatCurrency(total)}
                  </tspan>
                  <tspan
                    x={cx}
                    y={cy + 12}
                    fontSize={10}
                    fill="#1b443766"
                  >
                    despesas
                  </tspan>
                </text>
              );
            }}
          />
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
