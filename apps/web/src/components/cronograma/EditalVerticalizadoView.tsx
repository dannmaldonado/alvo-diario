/**
 * EditalVerticalizadoView — Displays AI-generated verticalizado edital
 * Shows subjects ranked by historical banca incidence with topic-level detail.
 *
 * Usage:
 *   - Compact mode: inside EditalUpload after PDF analysis (no header, scrollable list)
 *   - Full mode: in CronogramaPage detail view (with header, full layout)
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, TrendingUp, Target, Lightbulb } from 'lucide-react';
import type { EditalVerticalizado, EditalVerticalizado_Materia, IncidenciaLevel, PrioridadeLevel } from '@/types';

// ============================================================================
// HELPERS
// ============================================================================

function prioridadeColor(p: PrioridadeLevel): string {
  switch (p) {
    case 'alta':  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'media': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'baixa': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  }
}

function incidenciaColor(i: IncidenciaLevel): string {
  switch (i) {
    case 'alta':  return 'text-red-600 dark:text-red-400';
    case 'media': return 'text-amber-600 dark:text-amber-400';
    case 'baixa': return 'text-slate-500 dark:text-slate-400';
  }
}

function incidenciaDot(i: IncidenciaLevel): string {
  switch (i) {
    case 'alta':  return 'bg-red-500';
    case 'media': return 'bg-amber-400';
    case 'baixa': return 'bg-slate-400';
  }
}

function prioridadeLabel(p: PrioridadeLevel): string {
  switch (p) {
    case 'alta':  return 'Alta prioridade';
    case 'media': return 'Média prioridade';
    case 'baixa': return 'Baixa prioridade';
  }
}

function pesoBarWidth(peso: number): string {
  // Clamp to 0-100
  const clamped = Math.min(100, Math.max(0, peso));
  return `${clamped}%`;
}

function pesoBarColor(peso: number): string {
  if (peso >= 20) return 'bg-red-500';
  if (peso >= 10) return 'bg-amber-400';
  return 'bg-slate-400';
}

// ============================================================================
// MATERIA ROW
// ============================================================================

interface MateriaRowProps {
  materia: EditalVerticalizado_Materia;
  rank: number;
}

const MateriaRow: React.FC<MateriaRowProps> = ({ materia, rank }) => {
  const [expanded, setExpanded] = useState(false);
  const hasTopicos = materia.topicos && materia.topicos.length > 0;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Summary row */}
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors"
      >
        {/* Rank badge */}
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-xs font-bold flex items-center justify-center text-muted-foreground">
          {rank}
        </span>

        {/* Subject name + priority */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm leading-snug">{materia.nome}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${prioridadeColor(materia.prioridade)}`}>
              {prioridadeLabel(materia.prioridade)}
            </span>
          </div>

          {/* Weight bar */}
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pesoBarColor(materia.peso_historico)}`}
                style={{ width: pesoBarWidth(materia.peso_historico) }}
              />
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0 font-mono">
              {materia.peso_historico}%
            </span>
          </div>
        </div>

        {/* Expand toggle */}
        {hasTopicos && (
          expanded
            ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {/* Expanded: observacao + topics */}
      {expanded && (
        <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-3">
          {materia.observacao && (
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              {materia.observacao}
            </p>
          )}

          {hasTopicos && (
            <div className="space-y-2">
              {materia.topicos.map((topico, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${incidenciaDot(topico.incidencia)}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-medium">{topico.nome}</span>
                      <span className={`text-[10px] font-semibold ${incidenciaColor(topico.incidencia)}`}>
                        ↑ {topico.incidencia}
                      </span>
                    </div>
                    {topico.dica && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {topico.dica}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface EditalVerticalizadoViewProps {
  data: EditalVerticalizado;
  /** compact: used inside EditalUpload (no outer card chrome) */
  compact?: boolean;
}

export const EditalVerticalizadoView: React.FC<EditalVerticalizadoViewProps> = ({ data, compact = false }) => {
  const altaPrio = data.materias.filter(m => m.prioridade === 'alta').length;
  const mediaPrio = data.materias.filter(m => m.prioridade === 'media').length;
  const baixaPrio = data.materias.filter(m => m.prioridade === 'baixa').length;

  const content = (
    <div className="space-y-4">
      {/* Resumo estratégico */}
      {data.resumo_estrategico && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/80 leading-relaxed">{data.resumo_estrategico}</p>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          Alta ({altaPrio})
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          Média ({mediaPrio})
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-400" />
          Baixa ({baixaPrio})
        </div>
        <span className="text-muted-foreground/60">· ordenado por incidência histórica</span>
      </div>

      {/* Materias list */}
      <div className={`space-y-2 ${compact ? 'max-h-72 overflow-y-auto pr-1' : ''}`}>
        {data.materias.map((m, idx) => (
          <MateriaRow key={m.nome} materia={m} rank={idx + 1} />
        ))}
      </div>
    </div>
  );

  if (compact) {
    return content;
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 to-transparent px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Edital Verticalizado</h3>
          {data.banca && (
            <span className="text-xs text-muted-foreground">— {data.banca}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Matérias ordenadas por incidência histórica em provas anteriores desta banca.
          Clique em cada matéria para ver os tópicos prioritários.
        </p>
      </div>
      <div className="p-5">
        {content}
      </div>
    </div>
  );
};

export default EditalVerticalizadoView;
