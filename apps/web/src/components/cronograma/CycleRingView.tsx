/**
 * CycleRingView
 * SVG ring of study cycle nodes — current matéria highlighted, past emerald, future muted.
 * Nodes are positioned trigonometrically around a circle.
 */

import React from 'react';
import type { Materia } from '@/types';

interface CycleRingViewProps {
  materias: Materia[];
  /** 0-based index of the currently active matéria in this view */
  currentIndex: number;
  cycleNumber: number;
  /** True only when viewing the current (today's) cycle */
  isCurrentCycle: boolean;
}

// Abbreviate a subject name to fit inside/near a small node
function abbrev(nome: string, maxLen = 11): string {
  if (nome.length <= maxLen) return nome;
  // Try first significant word
  const words = nome.split(/\s+/);
  if (words[0].length <= maxLen) return words[0];
  return nome.slice(0, maxLen - 1) + '…';
}

// Split a label into 2 lines if it's too long
function splitLabel(nome: string): [string, string | null] {
  const words = nome.split(/\s+/);
  if (words.length === 1) return [abbrev(nome, 12), null];

  // Try to split roughly in the middle
  let line1 = '';
  let line2 = '';
  const half = Math.ceil(words.length / 2);
  line1 = words.slice(0, half).join(' ');
  line2 = words.slice(half).join(' ');

  if (line1.length > 12) line1 = abbrev(line1, 12);
  if (line2.length > 12) line2 = abbrev(line2, 12);

  return [line1, line2 || null];
}

export function CycleRingView({ materias, currentIndex, cycleNumber, isCurrentCycle }: CycleRingViewProps) {
  const n = materias.length;
  const cx = 150;
  const cy = 150;
  const R = 100; // ring radius
  const labelR = R + 32; // label orbit radius

  if (n === 0) return null;

  // Compute angles — start at top (−π/2)
  const angle = (i: number) => (2 * Math.PI * i) / n - Math.PI / 2;

  const nodeX = (i: number) => cx + R * Math.cos(angle(i));
  const nodeY = (i: number) => cy + R * Math.sin(angle(i));
  const labelX = (i: number) => cx + labelR * Math.cos(angle(i));
  const labelY = (i: number) => cy + labelR * Math.sin(angle(i));

  // Build connector path segments (circle between adjacent nodes)
  const connectors = Array.from({ length: n }, (_, i) => {
    const j = (i + 1) % n;
    return { x1: nodeX(i), y1: nodeY(i), x2: nodeX(j), y2: nodeY(j) };
  });

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        viewBox="0 0 300 300"
        width="300"
        height="300"
        className="w-full max-w-[300px]"
        aria-label={`Ciclo ${cycleNumber} — anel de matérias`}
      >
        {/* Connector lines */}
        {connectors.map((c, i) => (
          <line
            key={i}
            x1={c.x1}
            y1={c.y1}
            x2={c.x2}
            y2={c.y2}
            stroke="currentColor"
            strokeOpacity="0.15"
            strokeWidth="1.5"
            className="text-foreground"
          />
        ))}

        {/* Nodes */}
        {materias.map((m, i) => {
          const isCurrent = i === currentIndex;
          const isPast = i < currentIndex;
          const nx = nodeX(i);
          const ny = nodeY(i);
          const lx = labelX(i);
          const ly = labelY(i);
          const [l1, l2] = splitLabel(m.nome);

          // Determine text-anchor based on x position relative to center
          const textAnchor = lx < cx - 8 ? 'end' : lx > cx + 8 ? 'start' : 'middle';

          return (
            <g key={i}>
              {/* Outer ring glow for current node */}
              {isCurrent && (
                <circle
                  cx={nx}
                  cy={ny}
                  r={32}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeOpacity="0.2"
                  strokeWidth="4"
                />
              )}

              {/* Main node circle */}
              <circle
                cx={nx}
                cy={ny}
                r={isCurrent ? 22 : 15}
                fill={
                  isCurrent
                    ? 'hsl(var(--primary))'
                    : isPast
                      ? '#10b981'
                      : 'hsl(var(--muted))'
                }
                stroke={isCurrent ? 'hsl(var(--primary))' : 'none'}
                strokeWidth={isCurrent ? 2 : 0}
                className="transition-all duration-300"
              />

              {/* Node number */}
              <text
                x={nx}
                y={ny}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={isCurrent ? 11 : 9}
                fontWeight={isCurrent ? 'bold' : 'normal'}
                fill={isCurrent || isPast ? 'white' : 'hsl(var(--muted-foreground))'}
              >
                {i + 1}
              </text>

              {/* Label outside the ring */}
              <text
                x={lx}
                y={l2 ? ly - 6 : ly}
                textAnchor={textAnchor}
                fontSize="9"
                fontWeight={isCurrent ? '700' : '400'}
                fill={isCurrent ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'}
                className="select-none"
              >
                {l1}
              </text>
              {l2 && (
                <text
                  x={lx}
                  y={ly + 7}
                  textAnchor={textAnchor}
                  fontSize="9"
                  fontWeight={isCurrent ? '700' : '400'}
                  fill={isCurrent ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'}
                  className="select-none"
                >
                  {l2}
                </text>
              )}
            </g>
          );
        })}

        {/* Center badge */}
        <text
          x={cx}
          y={cy - 9}
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill="hsl(var(--muted-foreground))"
          className="select-none"
        >
          Ciclo
        </text>
        <text
          x={cx}
          y={cy + 9}
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill="hsl(var(--foreground))"
          className="select-none"
        >
          {cycleNumber}
        </text>
        {isCurrentCycle && (
          <text
            x={cx}
            y={cy + 25}
            textAnchor="middle"
            fontSize="9"
            fontWeight="600"
            fill="hsl(var(--primary))"
            className="select-none uppercase tracking-widest"
          >
            atual
          </text>
        )}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[#10b981]" />
          Concluído
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          Hoje
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-muted border border-border" />
          Próximo
        </span>
      </div>
    </div>
  );
}

export default CycleRingView;
