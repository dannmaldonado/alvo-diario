/**
 * MissoesWidget — Daily missions card for the Dashboard
 * Shows auto-generated missions with completion tracking.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, BookOpen, RotateCcw, TrendingUp, Flame, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMissoesDoDia, useConcluirMissao, useIgnorarMissao } from '@/hooks/queries/useMissoes';
import type { Missao, MissaoTipo } from '@/types';

// ---- Icon + color per mission type ----
const TIPO_CONFIG: Record<MissaoTipo, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  study:    { icon: BookOpen,   color: 'text-blue-500',   bg: 'bg-blue-500/10' },
  review:   { icon: RotateCcw,  color: 'text-violet-500', bg: 'bg-violet-500/10' },
  accuracy: { icon: TrendingUp, color: 'text-amber-500',  bg: 'bg-amber-500/10' },
  streak:   { icon: Flame,      color: 'text-orange-500', bg: 'bg-orange-500/10' },
};

function MissaoItem({ missao }: { missao: Missao }) {
  const concluirMutation = useConcluirMissao();
  const ignorarMutation = useIgnorarMissao();
  const config = TIPO_CONFIG[missao.tipo] || TIPO_CONFIG.study;
  const Icon = config.icon;

  const isDone = missao.status === 'concluida';
  const isIgnored = missao.status === 'ignorada';

  if (isIgnored) return null;

  return (
    <div className={`flex items-start gap-3 py-3 px-1 border-b last:border-0 border-border/50 transition-opacity ${isDone ? 'opacity-60' : ''}`}>
      {/* Type icon */}
      <div className={`mt-0.5 flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${config.bg}`}>
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {missao.titulo}
        </p>
        {!isDone && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{missao.descricao}</p>
        )}
        {/* CTA for review missions */}
        {!isDone && missao.tipo === 'review' && (
          <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-xs text-violet-500" asChild>
            <Link to="/revisao">Ir para revisão <ChevronRight className="h-3 w-3 ml-0.5" /></Link>
          </Button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {isDone ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <>
            <button
              onClick={() => concluirMutation.mutate(missao.id)}
              disabled={concluirMutation.isPending}
              title="Concluir missão"
              className="text-muted-foreground hover:text-emerald-500 transition-colors"
            >
              <Circle className="h-5 w-5" />
            </button>
            <button
              onClick={() => ignorarMutation.mutate(missao.id)}
              disabled={ignorarMutation.isPending}
              title="Ignorar missão"
              className="text-muted-foreground hover:text-destructive transition-colors ml-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function MissoesWidget() {
  const { data: missoes, isLoading, error } = useMissoesDoDia();

  const visible = (missoes ?? []).filter(m => m.status !== 'ignorada');
  const concluidas = visible.filter(m => m.status === 'concluida').length;
  const total = visible.length;
  const progressPct = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-card p-5 animate-pulse">
        <div className="h-5 w-32 bg-muted rounded mb-3" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded" />)}
        </div>
      </div>
    );
  }

  if (error || !missoes) return null;

  return (
    <div className="rounded-2xl border bg-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-base">Missões do Dia</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {concluidas}/{total} concluídas
          </p>
        </div>
        {total > 0 && (
          <span className={`text-sm font-bold ${progressPct === 100 ? 'text-emerald-500' : 'text-primary'}`}>
            {progressPct}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* Missions list */}
      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Todas as missões concluídas! 🎉</p>
      ) : (
        <div>
          {visible.map(m => <MissaoItem key={m.id} missao={m} />)}
        </div>
      )}
    </div>
  );
}

export default MissoesWidget;
