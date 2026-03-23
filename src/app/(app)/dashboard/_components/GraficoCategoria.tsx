"use client";

import { useState } from "react";
import type { CategoryAmount } from "./types";
import { formatCurrency } from "./types";

// ─── Paleta ───────────────────────────────────────────────────────────────────
const COLORS = [
  "#2563EB", "#16A34A", "#84CC16", "#EC4899", "#8B5CF6",
  "#EAB308", "#F97316", "#06B6D4", "#EF4444", "#0D9488",
];
const COLORS_DARK = [
  "#1D4ED8", "#15803D", "#65A30D", "#DB2777", "#7C3AED",
  "#CA8A04", "#EA580C", "#0891B2", "#DC2626", "#0F766E",
];

// ─── Geometria (proporcional ao Figma: ry/rx ≈ 0.635) ────────────────────────
const CX     = 120;   // centro x no SVG
const CY     = 90;    // centro y no SVG
const O_RX   = 96;    // raio externo x
const O_RY   = 61;    // raio externo y
const I_RX   = 40;    // raio interno x
const I_RY   = 25;    // raio interno y
const DEPTH  = 20;    // profundidade da extrusão em px
const GAP    = 0.025; // gap angular entre segmentos (rad)
const TWO_PI = Math.PI * 2;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const f  = (n: number) => n.toFixed(3);
const na = (a: number) => ((a % TWO_PI) + TWO_PI) % TWO_PI;

function ept(rx: number, ry: number, a: number) {
  return { x: CX + rx * Math.cos(a), y: CY + ry * Math.sin(a) };
}

/** Comando SVG arc do ponto atual até o ângulo `ea` na elipse (rx, ry) */
function arcCmd(rx: number, ry: number, sa: number, ea: number, cw: boolean) {
  const p    = ept(rx, ry, ea);
  const span = cw ? na(ea - sa) : na(sa - ea);
  const large = span > Math.PI ? 1 : 0;
  return `A ${rx} ${ry} 0 ${large} ${cw ? 1 : 0} ${f(p.x)} ${f(p.y)}`;
}

/** Face superior: setor anular elíptico entre ângulos sa→ea */
function topFace(sa: number, ea: number): string {
  const o1 = ept(O_RX, O_RY, sa);
  const i2 = ept(I_RX, I_RY, ea);
  return [
    `M ${f(o1.x)} ${f(o1.y)}`,
    arcCmd(O_RX, O_RY, sa, ea, true),
    `L ${f(i2.x)} ${f(i2.y)}`,
    arcCmd(I_RX, I_RY, ea, sa, false),
    "Z",
  ].join(" ");
}

/**
 * Intervalos de [sa, ea] que caem na metade frontal [0, π]
 * (onde sin(ângulo) > 0 — parte de baixo da elipse, virada para o observador)
 */
function frontRanges(sa: number, ea: number): Array<[number, number]> {
  const s   = na(sa);
  const e   = na(ea);
  const res: Array<[number, number]> = [];
  if (s < e) {
    const cs = Math.max(s, 0);
    const ce = Math.min(e, Math.PI);
    if (ce > cs + 0.001) res.push([cs, ce]);
  } else {
    // segmento passa por 0/2π
    if (s < Math.PI) res.push([s, Math.PI]);
    const ce = Math.min(e, Math.PI);
    if (ce > 0.001) res.push([0, ce]);
  }
  return res;
}

/** Face lateral: strip entre o arco externo e o mesmo arco deslocado +DEPTH */
function sideFace(cs: number, ce: number): string {
  const t1   = ept(O_RX, O_RY, cs);
  const t2   = ept(O_RX, O_RY, ce);
  const span = na(ce - cs);
  const large = span > Math.PI ? 1 : 0;
  return [
    `M ${f(t1.x)} ${f(t1.y)}`,
    `A ${O_RX} ${O_RY} 0 ${large} 1 ${f(t2.x)} ${f(t2.y)}`,        // arco externo (CW)
    `L ${f(t2.x)} ${f(t2.y + DEPTH)}`,                               // descer
    `A ${O_RX} ${O_RY} 0 ${large} 0 ${f(t1.x)} ${f(t1.y + DEPTH)}`, // arco de volta (CCW)
    "Z",
  ].join(" ");
}

// ─── Componente ───────────────────────────────────────────────────────────────
interface Seg {
  sa: number; ea: number; mid: number;
  color: string; dark: string;
  name: string; value: number; idx: number;
}

interface Props { data: CategoryAmount[] }

export default function GraficoCategoria({ data }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [tip, setTip]         = useState<{ x: number; y: number } | null>(null);

  const total = data.reduce((s, d) => s + d.amount, 0);
  const top   = data.slice(0, 10);

  if (top.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center">
        <p className="text-sm text-brand-700/40">Nenhuma despesa registrada</p>
      </div>
    );
  }

  // Calcular ângulos dos segmentos (começa no topo: −π/2)
  let cur = -Math.PI / 2;
  const segs: Seg[] = top.map((d, i) => {
    const full = (d.amount / total) * TWO_PI;
    const sa   = cur + GAP / 2;
    const ea   = cur + full - GAP / 2;
    cur += full;
    return {
      sa, ea,
      mid: (sa + ea) / 2,
      color: COLORS[i % COLORS.length],
      dark:  COLORS_DARK[i % COLORS_DARK.length],
      name: d.name, value: d.amount, idx: i,
    };
  });

  // Painter's algorithm: back (sin menor) → front (sin maior)
  const sorted = [...segs].sort((a, b) => Math.sin(a.mid) - Math.sin(b.mid));

  return (
    <div className="flex flex-col gap-4">

      {/* ── SVG do gráfico ── */}
      <div className="relative">
        <svg
          viewBox={`0 0 240 180`}
          width="100%"
          style={{ overflow: "visible" }}
          aria-label="Gráfico de despesas por categoria"
        >
          {/* 1ª passada: faces laterais (back → front) */}
          {sorted.flatMap((seg) =>
            frontRanges(seg.sa, seg.ea).map(([cs, ce], j) => (
              <path
                key={`side-${seg.idx}-${j}`}
                d={sideFace(cs, ce)}
                fill={seg.dark}
                stroke="none"
              />
            ))
          )}

          {/* 2ª passada: faces superiores (back → front) */}
          {sorted.map((seg) => (
            <path
              key={`top-${seg.idx}`}
              d={topFace(seg.sa, seg.ea)}
              fill={hovered === seg.idx ? seg.dark : seg.color}
              stroke="none"
              style={{ cursor: "pointer" }}
              onMouseEnter={(e) => {
                setHovered(seg.idx);
                setTip({ x: e.clientX, y: e.clientY });
              }}
              onMouseMove={(e) => setTip({ x: e.clientX, y: e.clientY })}
              onMouseLeave={() => { setHovered(null); setTip(null); }}
            />
          ))}

          {/* Label central */}
          <text
            x={CX} y={CY - 6}
            textAnchor="middle" dominantBaseline="middle"
            fill="#1b4437" fontSize={12} fontWeight={600}
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            {formatCurrency(total)}
          </text>
          <text
            x={CX} y={CY + 10}
            textAnchor="middle" dominantBaseline="middle"
            fill="#1b443766" fontSize={9}
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            despesas
          </text>
        </svg>

        {/* Tooltip flutuante */}
        {hovered !== null && tip !== null && (
          <div
            className="fixed z-50 pointer-events-none bg-surface border border-brand shadow-panel rounded-card px-3 py-2 text-xs"
            style={{ left: tip.x + 14, top: tip.y - 12 }}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: segs[hovered].color }}
              />
              <span className="font-medium text-brand-700">
                {segs[hovered].name}
              </span>
            </div>
            <p className="font-semibold text-brand-700">
              {formatCurrency(segs[hovered].value)}
            </p>
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="space-y-1.5">
        {segs.slice(0, 5).map((seg) => (
          <div key={seg.name} className="flex items-center gap-2 text-xs">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-brand-700/60 truncate flex-1">{seg.name}</span>
            <span className="font-medium text-brand-700 shrink-0">
              {formatCurrency(seg.value)}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
