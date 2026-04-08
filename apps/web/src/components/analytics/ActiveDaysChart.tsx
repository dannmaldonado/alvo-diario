/**
 * ActiveDaysChart Component
 * Displays a bar chart showing active days (rating >= 3) vs total days
 * over recent weeks, with a percentage trend.
 */

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  type TooltipProps,
} from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import { Meta } from '@/types';
import { cn } from '@/lib/utils';

interface ActiveDaysChartProps {
  metas: Meta[];
  className?: string;
}

interface WeekData {
  week: string;
  activeDays: number;
  inactiveDays: number;
  totalDays: number;
  percentage: number;
}

const ActiveDaysTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload as WeekData;
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-lg">
        <p className="font-medium mb-1">{label}</p>
        <p className="text-sm text-emerald-500">
          Ativos: <span className="font-bold">{data?.activeDays}</span> dias
        </p>
        <p className="text-sm text-red-400">
          Inativos: <span className="font-bold">{data?.inactiveDays}</span> dias
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Taxa: <span className="font-bold">{data?.percentage}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export function ActiveDaysChart({ metas, className }: ActiveDaysChartProps) {
  const weekData = useMemo<WeekData[]>(() => {
    if (metas.length === 0) return [];

    // Group metas by week (last 8 weeks)
    const now = new Date();
    const weeks: WeekData[] = [];

    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (w * 7 + now.getDay()));
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekStartStr = weekStart.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];

      const weekMetas = metas.filter((m) => {
        const mDate = m.data.split('T')[0];
        return mDate >= weekStartStr && mDate <= weekEndStr && m.avaliacao_diaria != null;
      });

      const activeDays = weekMetas.filter((m) => (m.avaliacao_diaria ?? 0) >= 3).length;
      const totalDays = weekMetas.length;
      const inactiveDays = totalDays - activeDays;
      const percentage = totalDays > 0 ? Number(((activeDays / totalDays) * 100).toFixed(0)) : 0;

      const label = weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

      weeks.push({
        week: label,
        activeDays,
        inactiveDays,
        totalDays,
        percentage,
      });
    }

    // Filter out weeks with no data
    return weeks.filter((w) => w.totalDays > 0);
  }, [metas]);

  if (weekData.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-48 text-muted-foreground text-sm', className)}>
        Nenhum dado de avaliacao disponivel
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={weekData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis
            dataKey="week"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
          <RechartsTooltip content={<ActiveDaysTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.4)' }} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => (
              <span className="text-foreground font-medium ml-1">
                {value === 'activeDays' ? 'Dias Ativos' : 'Dias Inativos'}
              </span>
            )}
          />
          <Bar
            dataKey="activeDays"
            name="activeDays"
            stackId="days"
            fill="hsl(var(--chart-2))"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="inactiveDays"
            name="inactiveDays"
            stackId="days"
            fill="hsl(var(--destructive)/0.4)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ActiveDaysChart;
