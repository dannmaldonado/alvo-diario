/**
 * PointsByRatingChart Component
 * Bar chart showing estimated points earned per rating level,
 * with base vs. bonus breakdown.
 */

import React from 'react';
import { Star, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DailyRatingValue } from '@/types';

const RATING_LABELS: Record<DailyRatingValue, string> = {
  1: '1 - Ruim',
  2: '2 - Fraco',
  3: '3 - Neutro',
  4: '4 - Bom',
  5: '5 - Otimo',
};

const RATING_BAR_COLORS: Record<DailyRatingValue, string> = {
  1: 'bg-red-400',
  2: 'bg-orange-400',
  3: 'bg-yellow-400',
  4: 'bg-emerald-400',
  5: 'bg-primary',
};

interface PointsByRatingChartProps {
  pointsByRating: Record<DailyRatingValue, number>;
  basePointsEarned: number;
  bonusPointsFromRating: number;
  className?: string;
}

export function PointsByRatingChart({
  pointsByRating,
  basePointsEarned,
  bonusPointsFromRating,
  className,
}: PointsByRatingChartProps) {
  const maxPoints = Math.max(...Object.values(pointsByRating), 1);
  const totalPoints = Object.values(pointsByRating).reduce((sum, p) => sum + p, 0);

  if (totalPoints === 0) {
    return (
      <div className={cn('flex items-center justify-center h-48 text-muted-foreground text-sm', className)}>
        Nenhum ponto com avaliacao registrado ainda
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col items-center p-4 bg-muted/50 rounded-xl border border-border">
          <span className="text-2xl font-bold">{basePointsEarned}</span>
          <span className="text-sm text-muted-foreground">Pontos Base</span>
          <span className="text-xs text-muted-foreground mt-1">(sem multiplicador)</span>
        </div>
        <div className={cn(
          'flex flex-col items-center p-4 rounded-xl border',
          bonusPointsFromRating >= 0
            ? 'bg-emerald-500/10 border-emerald-500/20'
            : 'bg-red-500/10 border-red-500/20'
        )}>
          <div className="flex items-center gap-1">
            {bonusPointsFromRating >= 0 ? (
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
            <span className={cn(
              'text-2xl font-bold',
              bonusPointsFromRating >= 0 ? 'text-emerald-500' : 'text-red-500'
            )}>
              {bonusPointsFromRating > 0 ? '+' : ''}{bonusPointsFromRating}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">Bonus Rating</span>
          <span className="text-xs text-muted-foreground mt-1">(multiplicador aplicado)</span>
        </div>
        <div className="flex flex-col items-center p-4 bg-primary/10 rounded-xl border border-primary/20">
          <span className="text-2xl font-bold text-primary">{totalPoints}</span>
          <span className="text-sm text-muted-foreground">Pontos Totais</span>
          <span className="text-xs text-muted-foreground mt-1">(base + bonus)</span>
        </div>
      </div>

      {/* Bar chart per rating level */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Pontos por Nivel de Avaliacao
        </h4>
        {([5, 4, 3, 2, 1] as DailyRatingValue[]).map((rating) => {
          const points = pointsByRating[rating];
          const barWidth = maxPoints > 0 ? (points / maxPoints) * 100 : 0;

          return (
            <div key={rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-24 justify-end shrink-0">
                <Star className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {RATING_LABELS[rating]}
                </span>
              </div>
              <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2',
                    RATING_BAR_COLORS[rating]
                  )}
                  style={{ width: `${barWidth}%`, minWidth: points > 0 ? '2rem' : '0' }}
                >
                  {points > 0 && barWidth > 15 && (
                    <span className="text-xs font-bold text-white">{points}</span>
                  )}
                </div>
              </div>
              {(points <= 0 || barWidth <= 15) && (
                <span className="text-xs text-muted-foreground w-10 text-right shrink-0">
                  {points}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PointsByRatingChart;
