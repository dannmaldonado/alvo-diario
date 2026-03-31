import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline' | 'ghost';
  interactive?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
}

const variantClasses = {
  default: 'bg-card border border-border shadow-sm',
  elevated: 'bg-card border border-border shadow-md hover:shadow-lg',
  outline: 'bg-transparent border border-border',
  ghost: 'bg-transparent border-0',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      interactive = false,
      isLoading = false,
      className,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg p-6',
          'transition-all duration-250',
          variantClasses[variant],
          interactive && 'cursor-pointer hover:scale-105 active:scale-95',
          isLoading && 'opacity-50 pointer-events-none',
          className
        )}
        onClick={onClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card header
export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 pb-4 border-b border-border', className)}
    {...props}
  />
));

CardHeader.displayName = 'CardHeader';

// Card title
export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight text-foreground', className)}
    {...props}
  />
));

CardTitle.displayName = 'CardTitle';

// Card description
export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));

CardDescription.displayName = 'CardDescription';

// Card content
export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-4', className)} {...props} />
));

CardContent.displayName = 'CardContent';

// Card footer
export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center gap-2 pt-4 border-t border-border', className)} {...props} />
));

CardFooter.displayName = 'CardFooter';

// Stats card - specialized card for displaying metrics
interface StatsCardProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  description?: string;
}

export function StatsCard({ label, value, change, icon, description }: StatsCardProps) {
  return (
    <Card variant='elevated' className='space-y-3'>
      <div className='flex items-start justify-between'>
        <div className='space-y-1'>
          <p className='text-sm font-medium text-muted-foreground'>{label}</p>
          <p className='text-2xl font-bold text-foreground'>{value}</p>
        </div>
        {icon && (
          <div className='p-2 rounded-lg bg-primary/10 text-primary'>
            {icon}
          </div>
        )}
      </div>

      {change && (
        <div className='flex items-center gap-1 text-xs font-medium'>
          <span className={change.isPositive ? 'text-green-600' : 'text-destructive'}>
            {change.isPositive ? '+' : '-'}{Math.abs(change.value)}%
          </span>
          <span className='text-muted-foreground'>vs last month</span>
        </div>
      )}

      {description && (
        <p className='text-xs text-muted-foreground pt-2 border-t border-border'>
          {description}
        </p>
      )}
    </Card>
  );
}
