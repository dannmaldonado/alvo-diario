import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
};

export function LoadingSpinner({
  size = 'md',
  text,
  fullScreen = false,
  className,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      {/* Animated spinner using the pulse-soft animation */}
      <div className={cn('relative', sizeClasses[size])}>
        {/* Outer ring with fade-in animation */}
        <div
          className={cn(
            'absolute inset-0 rounded-full border-2 border-transparent',
            'border-t-primary border-r-primary animate-spin'
          )}
        />

        {/* Pulse effect overlay */}
        <div
          className={cn(
            'absolute inset-0 rounded-full border-2 border-primary/30',
            'animate-pulse-soft'
          )}
        />

        {/* Center dot with scale animation */}
        <div
          className={cn(
            'absolute inset-2 rounded-full bg-primary',
            'animate-scale-in'
          )}
        />
      </div>

      {/* Loading text with fade-in animation */}
      {text && (
        <p className='text-sm font-medium text-muted-foreground animate-fade-in'>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className='fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-50 animate-fade-in'>
        {spinner}
      </div>
    );
  }

  return spinner;
}

// Skeleton loader for content placeholders
export function SkeletonLoader({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-4 animate-pulse', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-muted rounded animate-pulse',
            i === lines - 1 ? 'w-4/5' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

// Card skeleton for list items
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border p-4 space-y-4 animate-pulse', className)}>
      <div className='h-6 bg-muted rounded w-2/3' />
      <div className='space-y-2'>
        <div className='h-4 bg-muted rounded w-full' />
        <div className='h-4 bg-muted rounded w-5/6' />
      </div>
      <div className='flex gap-2 pt-2'>
        <div className='h-8 bg-muted rounded w-24' />
        <div className='h-8 bg-muted rounded w-20' />
      </div>
    </div>
  );
}
