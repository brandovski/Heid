"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CategoryAmount, formatCurrency } from "./types";

// Paleta moderna e harmônica
const COLORS = [
  "#1D2D28", // brand-600
  "#7c3aed", // violet-600
  "#db2777", // pink-600
  "#ea580c", // orange-600
  "#16a34a", // green-600
  "#0891b2", // cyan-600
  "#d97706", // amber-600
  "#9333ea", // purple-600
  "#dc2626", // red-600
  "#0d9488", // teal-600
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
    <div className="bg-white border border-gray-100 shadow-xl rounded-xl px-4 py-3 text-xs min-w-[130px]">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: item.payload.fill }}
        />
        <span className="font-semibold text-gray-700 truncate max-w-[120px]">
          {item.name}
        </span>
      </div>
      <p className="font-bold text-gray-900 text-sm mt-1">
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
        fill="#111827"
        fontSize={15}
        fontWeight={700}
      >
        {formatCurrency(total)}
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#9ca3af"
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
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={top}
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={78}
            cornerRadius={6}
            paddingAngle={3}
            dataKey="amount"
            nameKey="name"
            label={({ cx, cy }) => (
              <CenterLabel cx={cx} cy={cy} total={total} />
            )}
            labelLine={false}
            isAnimationActive={false}
          >
            {top.map((_, i) => (
              <Cell
                key={i}
                fill={COLORS[i % COLORS.length]}
                stroke="none"
              />
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
            <span className="text-gray-600 truncate flex-1">{cat.name}</span>
            <span className="font-semibold text-gray-800 shrink-0">
              {formatCurrency(cat.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
