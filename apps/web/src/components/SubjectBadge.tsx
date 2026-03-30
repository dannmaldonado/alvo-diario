/**
 * Subject Badge Component
 * Displays subject name with color-coded background
 * Colors are determined by hash of subject name for consistency
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface SubjectObject {
  name?: string;
  nome?: string;
  [key: string]: any;
}

type SizeVariant = 'sm' | 'md' | 'lg';

interface SubjectBadgeProps {
  subject: string | SubjectObject | null | undefined;
  className?: string;
  size?: SizeVariant;
}

/**
 * Get color class for subject based on hash
 * Ensures same subject always gets same color
 */
const getColorForSubject = (subjectName: string): string => {
  if (!subjectName)
    return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';

  const colors = [
    'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
    'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
    'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
    'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/40 dark:text-fuchsia-300',
  ];

  let hash = 0;
  for (let i = 0; i < subjectName.length; i++) {
    hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const SubjectBadge: React.FC<SubjectBadgeProps> = ({
  subject,
  className,
  size = 'md',
}) => {
  const name =
    typeof subject === 'string'
      ? subject
      : (subject?.name || subject?.nome || 'Sem matéria');
  const colorClass = getColorForSubject(name);

  const sizeClasses: Record<SizeVariant, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium tracking-wide transition-colors',
        colorClass,
        sizeClasses[size],
        className
      )}
    >
      {name}
    </span>
  );
};

export default SubjectBadge;
