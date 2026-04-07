/**
 * useProgressAnalytics Hook
 * Extracts data fetching, filtering, aggregation, chart data preparation,
 * and exam statistics from ProgressAnalysisPage.
 */

import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { SessoesService } from '@/services/sessoes.service';
import { apiClient } from '@/services/api';
import { Sessao } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export type Period = 'all' | 'month' | 'week' | '7days';

export interface SubjectData {
  name: string;
  hours: number;
  fill: string;
}

export interface EvolutionData {
  date: string;
  hours: number;
  dailyHours: number;
}

export interface TableRowData {
  name: string;
  totalHours: number;
  monthHours: number;
  weekHours: number;
  percentage: number;
}

export interface Stats {
  totalHoursAll: string;
  totalHoursMonth: string;
  totalHoursWeek: string;
  avgHoursPerDay: string;
  longestSessionMinutes: number;
  totalSessions: number;
  streak: number;
  points: number;
}

export interface SortConfig {
  key: keyof TableRowData;
  direction: 'asc' | 'desc';
}

export interface ExameDiario {
  data: string;
  respostas: Record<string, boolean>;
  pontuacao: number;
}

export interface ExamQuestionMeta {
  id: string;
  categoria: string;
  label: string;
}

export interface ExamStats {
  avgScore: number;
  totalQuestions: number;
  byQuestion: Array<ExamQuestionMeta & { pct: number; total: number }>;
  last7: string[];
  examDates: Set<string>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const EXAM_QUESTIONS_META: ExamQuestionMeta[] = [
  { id: 'horarios', categoria: 'Disciplina', label: 'Cumpriu horarios' },
  { id: 'distracao', categoria: 'Disciplina', label: 'Evitou distracoes' },
  { id: 'retencao', categoria: 'Aprendizado', label: 'Reteve conteudo' },
  { id: 'explicar', categoria: 'Aprendizado', label: 'Conseguiu explicar' },
  { id: 'questoes', categoria: 'Pratica', label: 'Resolveu questoes' },
  { id: 'erros', categoria: 'Pratica', label: 'Revisou erros' },
  { id: 'plano', categoria: 'Progresso', label: 'Cumpriu o plano' },
  { id: 'evolucao', categoria: 'Progresso', label: 'Sentiu evolucao' },
];

export const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
  'hsl(var(--chart-7))',
  'hsl(var(--chart-8))',
];

// ============================================================================
// HELPERS
// ============================================================================

function getDateBoundaries() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const startOfWeek = new Date(today);
  const dayOfWeek = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

  const startOf7Days = new Date(today);
  startOf7Days.setDate(startOf7Days.getDate() - 6);

  return { today, startOfMonth, startOfWeek, startOf7Days };
}

// ============================================================================
// HOOK
// ============================================================================

export function useProgressAnalytics() {
  const { currentUser } = useAuth();
  const [period, setPeriod] = useState<Period>('month');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'totalHours', direction: 'desc' });

  // TanStack Query for sessions
  const sessionsQuery = useQuery({
    queryKey: ['sessoes', 'user', currentUser?.id, 'all'],
    queryFn: () => SessoesService.getByUser(currentUser!.id),
    enabled: !!currentUser?.id,
    staleTime: 5 * 60 * 1000,
  });

  // TanStack Query for exams (optional, non-blocking)
  const examsQuery = useQuery({
    queryKey: ['exames', 'all'],
    queryFn: () => apiClient.get<ExameDiario[]>('/api/exames'),
    enabled: !!currentUser?.id,
    staleTime: 5 * 60 * 1000,
  });

  const allSessions = sessionsQuery.data ?? [];
  const exames = examsQuery.data ?? [];

  // Filter sessions by period
  const filteredSessions = useMemo(() => {
    if (period === 'all') return allSessions;

    const { startOfMonth, startOfWeek, startOf7Days } = getDateBoundaries();

    return allSessions.filter((session: Sessao) => {
      const sessionDate = new Date(session.data_sessao);
      sessionDate.setHours(0, 0, 0, 0);

      switch (period) {
        case 'month': return sessionDate >= startOfMonth;
        case 'week': return sessionDate >= startOfWeek;
        case '7days': return sessionDate >= startOf7Days;
        default: return true;
      }
    });
  }, [allSessions, period]);

  // Key statistics
  const stats = useMemo<Stats>(() => {
    const { startOfMonth, startOfWeek } = getDateBoundaries();

    let totalMinutesAll = 0;
    let totalMinutesMonth = 0;
    let totalMinutesWeek = 0;
    let longestSessionMinutes = 0;
    const uniqueDays = new Set<string>();

    allSessions.forEach(session => {
      const mins = session.duracao_minutos || 0;
      const sessionDate = new Date(session.data_sessao);
      sessionDate.setHours(0, 0, 0, 0);

      totalMinutesAll += mins;
      uniqueDays.add(session.data_sessao);
      if (mins > longestSessionMinutes) longestSessionMinutes = mins;

      if (sessionDate >= startOfMonth) totalMinutesMonth += mins;
      if (sessionDate >= startOfWeek) totalMinutesWeek += mins;
    });

    const daysCount = uniqueDays.size || 1;
    const avgMinutesPerDay = totalMinutesAll / daysCount;

    return {
      totalHoursAll: Number((totalMinutesAll / 60).toFixed(1)).toString(),
      totalHoursMonth: Number((totalMinutesMonth / 60).toFixed(1)).toString(),
      totalHoursWeek: Number((totalMinutesWeek / 60).toFixed(1)).toString(),
      avgHoursPerDay: Number((avgMinutesPerDay / 60).toFixed(1)).toString(),
      longestSessionMinutes,
      totalSessions: allSessions.length,
      streak: currentUser?.streak_atual ?? 0,
      points: currentUser?.pontos_totais ?? 0,
    };
  }, [allSessions, currentUser?.streak_atual, currentUser?.pontos_totais]);

  // Subject chart data
  const subjectData = useMemo<SubjectData[]>(() => {
    const subjectMap: Record<string, number> = {};

    filteredSessions.forEach((session: Sessao) => {
      const name = session.materia || 'Desconhecida';
      if (!subjectMap[name]) subjectMap[name] = 0;
      subjectMap[name] += session.duracao_minutos;
    });

    return Object.entries(subjectMap)
      .map(([name, minutes], index) => ({
        name,
        hours: Number((minutes / 60).toFixed(2)),
        fill: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [filteredSessions]);

  // Evolution line chart data
  const evolutionData = useMemo<EvolutionData[]>(() => {
    if (filteredSessions.length === 0) return [];

    const sorted = [...filteredSessions].sort((a, b) => {
      const aDate = new Date(a.data_sessao);
      const bDate = new Date(b.data_sessao);
      return aDate.getTime() - bDate.getTime();
    });

    const dailyMap: Record<string, number> = {};
    sorted.forEach((session: Sessao) => {
      const dateStr = session.data_sessao.split('T')[0];
      if (!dailyMap[dateStr]) dailyMap[dateStr] = 0;
      dailyMap[dateStr] += session.duracao_minutos;
    });

    let cumulativeMinutes = 0;
    return Object.entries(dailyMap).map(([date, minutes]) => {
      cumulativeMinutes += minutes;
      return {
        date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        hours: Number((cumulativeMinutes / 60).toFixed(2)),
        dailyHours: Number((minutes / 60).toFixed(2)),
      };
    });
  }, [filteredSessions]);

  // Detailed table data
  const tableData = useMemo<TableRowData[]>(() => {
    const { startOfMonth, startOfWeek } = getDateBoundaries();
    const subjectMap: Record<string, { name: string; totalAll: number; totalMonth: number; totalWeek: number; periodMinutes: number }> = {};
    let totalPeriodMinutes = 0;

    allSessions.forEach((session: Sessao) => {
      const name = session.materia || 'Desconhecida';
      if (!subjectMap[name]) {
        subjectMap[name] = { name, totalAll: 0, totalMonth: 0, totalWeek: 0, periodMinutes: 0 };
      }

      const mins = session.duracao_minutos;
      const sessionDate = new Date(session.data_sessao);
      sessionDate.setHours(0, 0, 0, 0);

      subjectMap[name].totalAll += mins;
      if (sessionDate >= startOfMonth) subjectMap[name].totalMonth += mins;
      if (sessionDate >= startOfWeek) subjectMap[name].totalWeek += mins;

      let inPeriod = false;
      if (period === 'all') inPeriod = true;
      else if (period === 'month' && sessionDate >= startOfMonth) inPeriod = true;
      else if (period === 'week' && sessionDate >= startOfWeek) inPeriod = true;
      else {
        const startOf7Days = new Date();
        startOf7Days.setDate(startOf7Days.getDate() - 6);
        startOf7Days.setHours(0, 0, 0, 0);
        if (period === '7days' && sessionDate >= startOf7Days) inPeriod = true;
      }

      if (inPeriod) {
        subjectMap[name].periodMinutes += mins;
        totalPeriodMinutes += mins;
      }
    });

    const data = Object.values(subjectMap).map(item => ({
      name: item.name,
      totalHours: Number((item.totalAll / 60).toFixed(1)),
      monthHours: Number((item.totalMonth / 60).toFixed(1)),
      weekHours: Number((item.totalWeek / 60).toFixed(1)),
      percentage: totalPeriodMinutes > 0 ? Number(((item.periodMinutes / totalPeriodMinutes) * 100).toFixed(1)) : 0,
    }));

    return data.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [allSessions, period, sortConfig]);

  // Exam statistics
  const examStats = useMemo<ExamStats | null>(() => {
    if (exames.length === 0) return null;

    const last30 = exames.slice(0, 30);
    const avgScore = last30.reduce((acc, e) => acc + (e.pontuacao ?? 0), 0) / last30.length;
    const totalQuestions = EXAM_QUESTIONS_META.length;

    const byQuestion = EXAM_QUESTIONS_META.map(q => {
      const respondidas = last30.filter(e => e.respostas && e.respostas[q.id] !== undefined);
      const positivas = respondidas.filter(e => e.respostas[q.id] === true).length;
      return {
        ...q,
        pct: respondidas.length > 0 ? Math.round((positivas / respondidas.length) * 100) : 0,
        total: respondidas.length,
      };
    });

    const today = new Date();
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    const examDates = new Set(exames.map(e => e.data?.split('T')[0]));

    return { avgScore, totalQuestions, byQuestion, last7, examDates };
  }, [exames]);

  const handleSort = useCallback((key: keyof TableRowData) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  }, []);

  return {
    // Data
    stats,
    subjectData,
    evolutionData,
    tableData,
    examStats,
    examesCount: exames.length,

    // Filters
    period,
    setPeriod,
    sortConfig,
    handleSort,

    // State
    isLoading: sessionsQuery.isLoading,
    error: sessionsQuery.error,
  };
}
