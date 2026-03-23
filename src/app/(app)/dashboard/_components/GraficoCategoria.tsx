"use client";

import { useState } from "react";
import type { CategoryAmount } from "./types";
import { formatCurrency } from "./types";

const COLORS = [
  "#2563EB", "#16A34A", "#84CC16", "#EC4899", "#8B5CF6",
  "#EAB308", "#F97316", "#06B6D4", "#EF4444", "#0D9488",
];

// Geometria
const R    = 52;                         // raio do arco
const CX   = 68;                         // centro x
const CY   = 68;                         // centro y
const SW   = 10;                         // stroke-width normal
const SW_H = 12;                         // stroke-width no hover
const C    = 2 * Math.PI * R;            // circunferência total
const GAP  = SW + 2;                     // gap visual entre segmentos (≥ SW para não colidir caps)

interface Props { data: CategoryAmount[] }

export default function GraficoCategoria({ data }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [tip, setTip]         = useState<{ x: number; y: number } | null>(null);

  const total = data.reduce((s, d) => s + d.amount, 0);
  const top   = data.slice(0, 10);

  if (top.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center">
        <p className="text-[12px] text-brand-700/40">Nenhuma despesa registrada</p>
      </div>
    );
  }

  // Comprimento utilizável descontando gaps
  const usable   = C - GAP * top.length;
  let   startLen = 0;

  const segs = top.map((d, i) => {
    const len = (d.amount / total) * usable;
    const s   = startLen;
    startLen += len + GAP;
    return { len, start: s, color: COLORS[i % COLORS.length], name: d.name, value: d.amount, idx: i };
  });

  return (
    <div className="flex flex-col gap-3">

      {/* ── Gráfico ── */}
      <div className="relative flex justify-center">
        <svg
          viewBox="0 0 136 136"
          width="144"
          height="144"
          aria-label="Despesas por categoria"
          style={{ display: "block" }}
        >
          {/* Track (trilha de fundo) */}
          <circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke="#1b4437"
            strokeOpacity={0.06}
            strokeWidth={SW}
          />

          {/* Segmentos */}
          {segs.map((seg) => {
            const isHov = hovered === seg.idx;
            return (
              <circle
                key={seg.idx}
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke={seg.color}
                strokeWidth={isHov ? SW_H : SW}
                strokeLinecap="round"
                strokeDasharray={`${seg.len} ${C}`}
                strokeDashoffset={-seg.start}
                transform={`rotate(-90 ${CX} ${CY})`}
                style={{ cursor: "pointer", transition: "stroke-width 120ms ease" }}
                onMouseEnter={(e) => { setHovered(seg.idx); setTip({ x: e.clientX, y: e.clientY }); }}
                onMouseMove={(e)  => setTip({ x: e.clientX, y: e.clientY })}
                onMouseLeave={()  => { setHovered(null); setTip(null); }}
              />
            );
          })}

          {/* Label central */}
          <text
            x={CX} y={CY - 8}
            textAnchor="middle" dominantBaseline="middle"
            fill="#1b4437" fontSize={11} fontWeight={600}
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            {formatCurrency(total)}
          </text>
          <text
            x={CX} y={CY + 8}
            textAnchor="middle" dominantBaseline="middle"
            fill="#1b443760" fontSize={9}
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            total
          </text>
        </svg>

        {/* Tooltip */}
        {hovered !== null && tip !== null && (
          <div
            className="fixed z-50 pointer-events-none bg-surface border border-brand shadow-panel rounded-card px-3 py-2 text-xs whitespace-nowrap"
            style={{ left: tip.x + 14, top: tip.y - 12 }}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: segs[hovered].color }} />
              <span className="font-medium text-brand-700">{segs[hovered].name}</span>
            </div>
            <p className="font-semibold text-brand-700">{formatCurrency(segs[hovered].value)}</p>
          </div>
        )}
      </div>

      {/* ── Legenda (apenas mobile) ── */}
      <div className="space-y-1.5 sm:hidden">
        {segs.slice(0, 5).map((seg) => (
          <div key={seg.name} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-brand-700/60 truncate flex-1">{seg.name}</span>
            <span className="font-medium text-brand-700 shrink-0">{formatCurrency(seg.value)}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
