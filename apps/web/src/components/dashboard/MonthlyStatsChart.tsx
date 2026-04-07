/**
 * MonthlyStatsChart Component
 * Displays daily study hours for the current month as a bar chart.
 * Receives pre-computed chartData as prop -- no data fetching inside.
 */

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Sessao } from '@/types';

interface ChartDataPoint {
  day: string;
  hours: number;
}

interface MonthlyStatsChartProps {
  sessions: Sessao[];
  className?: string;
}

/**
 * Aggregate sessions into daily hours for the current month
 */
function aggregateByDay(sessions: Sessao[]): ChartDataPoint[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Initialize all days with 0
  const dayMap: Record<string, number> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const key = String(d);
    dayMap[key] = 0;
  }

  // Sum session minutes by day
  sessions.forEach((s) => {
    const sessionDate = new Date(s.data_sessao);
    if (
      sessionDate.getFullYear() === year &&
      sessionDate.getMonth() === month
    ) {
      const dayKey = String(sessionDate.getDate());
      dayMap[dayKey] += (s.duracao_minutos || 0) / 60;
    }
  });

  return Object.entries(dayMap).map(([day, hours]) => ({
    day,
    hours: Number(hours.toFixed(1)),
  }));
}

const MonthlyStatsChart: React.FC<MonthlyStatsChartProps> = ({
  sessions,
  className,
}) => {
  const chartData = useMemo(() => aggregateByDay(sessions), [sessions]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Sem dados para exibir
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
            tickLine={false}
            axisLine={false}
            tickFormatter={(val: number) => `${val}h`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '0.75rem',
              border: '1px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))',
              fontSize: '0.875rem',
            }}
            formatter={(value: number) => [`${value}h`, 'Estudo']}
            labelFormatter={(label: string) => `Dia ${label}`}
          />
          <Bar
            dataKey="hours"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyStatsChart;
