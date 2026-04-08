/**
 * DailyRating Component
 * Interactive 5-star rating for daily goal qualitative assessment.
 * Shows hover labels in Portuguese, points multiplier preview, and
 * estimated point delta based on today's session minutes.
 */

import React, { useState, useCallback } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DailyRatingValue } from '@/types';

const RATING_LABELS: Record<DailyRatingValue, string> = {
  1: 'Ruim (sem dedicacao)',
  2: 'Fraco (pouca dedicacao)',
  3: 'Neutro (dedicacao media)',
  4: 'Bom (boa dedicacao)',
  5: 'Otimo (meta atingida ou superada)',
};

const RATING_COLORS: Record<DailyRatingValue, string> = {
  1: 'text-red-400',
  2: 'text-orange-400',
  3: 'text-yellow-400',
  4: 'text-emerald-400',
  5: 'text-primary',
};

export const RATING_MULTIPLIERS: Record<DailyRatingValue, number> = {
  1: 0,
  2: 0.5,
  3: 1,
  4: 1.5,
  5: 2,
};

const POINTS_MULTIPLIER_LABEL: Record<DailyRatingValue, string> = {
  1: '0x pontos',
  2: '0.5x pontos',
  3: '1x pontos (base)',
  4: '1.5x pontos',
  5: '2x pontos',
};

interface DailyRatingProps {
  value?: DailyRatingValue;
  onChange?: (rating: DailyRatingValue) => void;
  disabled?: boolean;
  showPointsMultiplier?: boolean;
  /** Today's total session minutes — used to calculate points preview */
  todaySessionMinutes?: number;
  className?: string;
}

export function DailyRating({
  value,
  onChange,
  disabled = false,
  showPointsMultiplier = false,
  todaySessionMinutes = 0,
  className,
}: DailyRatingProps) {
  const [hoveredStar, setHoveredStar] = useState<DailyRatingValue | null>(null);

  const handleClick = useCallback(
    (rating: DailyRatingValue) => {
      if (!disabled && onChange) {
        onChange(rating);
      }
    },
    [disabled, onChange]
  );

  const handleMouseEnter = useCallback(
    (rating: DailyRatingValue) => {
      if (!disabled) {
        setHoveredStar(rating);
      }
    },
    [disabled]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredStar(null);
  }, []);

  const activeRating = hoveredStar ?? value;
  const activeLabel = activeRating ? RATING_LABELS[activeRating] : null;
  const activeColor = activeRating ? RATING_COLORS[activeRating] : '';
  const activeMultiplierLabel = activeRating ? POINTS_MULTIPLIER_LABEL[activeRating] : null;

  // Calculate points preview delta when hovering
  const pointsPreview = (() => {
    if (!activeRating || todaySessionMinutes <= 0) return null;
    const basePoints = Math.floor(todaySessionMinutes / 15);
    if (basePoints <= 0) return null;
    const multiplier = RATING_MULTIPLIERS[activeRating];
    const adjustedPoints = Math.floor(basePoints * multiplier);
    const delta = adjustedPoints - basePoints;
    return { delta, adjustedPoints, basePoints };
  })();

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-1" onMouseLeave={handleMouseLeave}>
        {([1, 2, 3, 4, 5] as DailyRatingValue[]).map((star) => {
          const isFilled = activeRating ? star <= activeRating : false;

          return (
            <button
              key={star}
              type="button"
              disabled={disabled}
              onClick={() => handleClick(star)}
              onMouseEnter={() => handleMouseEnter(star)}
              className={cn(
                'p-1 rounded-md transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                disabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer hover:scale-110 active:scale-95'
              )}
              aria-label={`${star} estrela${star > 1 ? 's' : ''} - ${RATING_LABELS[star]}`}
            >
              <Star
                className={cn(
                  'h-7 w-7 transition-all duration-150',
                  isFilled
                    ? cn(activeColor, 'fill-current')
                    : 'text-muted-foreground/30'
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Label display */}
      <div className="min-h-[1.5rem]">
        {activeLabel && (
          <p
            className={cn(
              'text-sm font-medium transition-opacity duration-150',
              activeColor
            )}
          >
            {activeLabel}
          </p>
        )}
      </div>

      {/* Points multiplier preview */}
      {showPointsMultiplier && activeMultiplierLabel && (
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            {activeMultiplierLabel}
          </p>
          {pointsPreview && pointsPreview.delta !== 0 && (
            <span
              className={cn(
                'text-xs font-semibold',
                pointsPreview.delta > 0 ? 'text-emerald-500' : 'text-red-500'
              )}
            >
              {pointsPreview.delta > 0 ? '+' : ''}{pointsPreview.delta} pts
            </span>
          )}
          {pointsPreview && pointsPreview.delta === 0 && (
            <span className="text-xs text-muted-foreground">
              {pointsPreview.basePoints} pts (base)
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default DailyRating;
