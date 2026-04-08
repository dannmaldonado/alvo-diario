/**
 * RatingDistributionChart Component
 * Displays a horizontal bar chart showing the distribution of daily ratings.
 */

import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DailyRatingValue } from '@/types';

const RATING_LABELS: Record<DailyRatingValue, string> = {
  1: 'Ruim',
  2: 'Fraco',
  3: 'Neutro',
  4: 'Bom',
  5: 'Otimo',
};

const RATING_COLORS: Record<DailyRatingValue, string> = {
  1: 'bg-red-400',
  2: 'bg-orange-400',
  3: 'bg-yellow-400',
  4: 'bg-emerald-400',
  5: 'bg-primary',
};

interface RatingDistributionChartProps {
  distribution: Record<DailyRatingValue, number>;
  avgRating: number;
  totalRated: number;
  className?: string;
}

export function RatingDistributionChart({
  distribution,
  avgRating,
  totalRated,
  className,
}: RatingDistributionChartProps) {
  const maxCount = Math.max(...Object.values(distribution), 1);

  if (totalRated === 0) {
    return (
      <div className={cn('flex items-center justify-center h-48 text-muted-foreground text-sm', className)}>
        Nenhuma avaliacao registrada ainda
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Average rating header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary fill-primary" />
          <span className="text-2xl font-bold">{avgRating}</span>
          <span className="text-sm text-muted-foreground">/ 5</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {totalRated} dia{totalRated !== 1 ? 's' : ''} avaliado{totalRated !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Distribution bars */}
      <div className="space-y-2">
        {([5, 4, 3, 2, 1] as DailyRatingValue[]).map((rating) => {
          const count = distribution[rating];
          const percentage = totalRated > 0 ? (count / totalRated) * 100 : 0;
          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={rating} className="flex items-center gap-3">
              <span className="text-sm font-medium w-14 text-right text-muted-foreground">
                {RATING_LABELS[rating]}
              </span>
              <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    RATING_COLORS[rating]
                  )}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-12 text-right">
                {count} ({percentage.toFixed(0)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RatingDistributionChart;
