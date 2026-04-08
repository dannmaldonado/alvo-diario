/**
 * useDashboardData Hook
 * Composes TanStack Query hooks to provide all data needed by DashboardPage.
 * Replaces the monolithic loadDashboardData() function with parallel cached queries.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCronograma } from '@/hooks/queries/useCronogramas';
import { useTodayMeta, useCreateMeta, useUpdateMetaRating } from '@/hooks/queries/useMetas';
import { useSessoesByDateRange } from '@/hooks/queries/useSessoes';
import { useScheduleCalculator } from '@/hooks/useScheduleCalculator';
import { Materia } from '@/types';

interface MonthlyStats {
  totalHours: number;
  topSubject: string | null;
  avgSessionMins: number;
}

interface CycleInfo {
  cycleNumber: number;
  dayInCycle: number;
  totalDaysInCycle: number;
  totalDaysElapsed?: number;
}

export function useDashboardData() {
  const { currentUser } = useAuth();
  const { getCurrentSubject, getCycleInfo } = useScheduleCalculator();

  const userId = currentUser?.id;

  // Parallel queries -- TanStack Query deduplicates and caches automatically
  const cronogramaQuery = useActiveCronograma(userId);
  const todayMetaQuery = useTodayMeta(userId);
  const createMetaMutation = useCreateMeta();
  const updateRatingMutation = useUpdateMetaRating();

  // Date range for monthly sessions
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];

  const monthSessionsQuery = useSessoesByDateRange(
    userId,
    startOfMonth,
    endOfMonth
  );

  // Derived schedule state
  const scheduleData = useMemo(() => {
    const cronograma = cronogramaQuery.data;
    if (!cronograma) {
      return {
        todaySubject: null as Materia | string | null,
        tomorrowSubject: null as Materia | string | null,
        cycleInfo: null as CycleInfo | null,
      };
    }

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      todaySubject: getCurrentSubject(cronograma, today),
      tomorrowSubject: getCurrentSubject(cronograma, tomorrow),
      cycleInfo: getCycleInfo(cronograma, today),
    };
  }, [cronogramaQuery.data, getCurrentSubject, getCycleInfo]);

  // Compute today's progress from meta
  const todayProgress = useMemo(() => {
    const meta = todayMetaQuery.data;
    if (!meta || !meta.id) {
      return {
        horas_realizadas: 0,
        horas_meta: currentUser?.meta_diaria_horas || 4,
      };
    }
    return {
      horas_realizadas: meta.horas_realizadas || 0,
      horas_meta: meta.horas_meta || 0,
    };
  }, [todayMetaQuery.data, currentUser?.meta_diaria_horas]);

  // Compute today's total session minutes (for points preview in DailyRating)
  const todaySessionMinutes = useMemo(() => {
    const sessions = monthSessionsQuery.data;
    if (!sessions || sessions.length === 0) return 0;
    const todayStr = new Date().toISOString().split('T')[0];
    return sessions
      .filter((s) => {
        const sessDate = typeof s.data_sessao === 'string'
          ? s.data_sessao.split('T')[0]
          : new Date(s.data_sessao).toISOString().split('T')[0];
        return sessDate === todayStr;
      })
      .reduce((sum, s) => sum + (s.duracao_minutos || 0), 0);
  }, [monthSessionsQuery.data]);

  // Compute monthly stats
  const monthlyStats = useMemo((): MonthlyStats => {
    const sessions = monthSessionsQuery.data;
    if (!sessions || sessions.length === 0) {
      return { totalHours: 0, topSubject: null, avgSessionMins: 0 };
    }

    let totalMins = 0;
    const subjectCounts: Record<string, number> = {};

    sessions.forEach((s) => {
      const duracao = s.duracao_minutos || 0;
      const materia = s.materia;
      totalMins += duracao;
      subjectCounts[materia] = (subjectCounts[materia] || 0) + duracao;
    });

    let topSubj: string | null = null;
    let maxMins = 0;
    for (const [subj, mins] of Object.entries(subjectCounts)) {
      if (mins > maxMins) {
        maxMins = mins;
        topSubj = subj;
      }
    }

    return {
      totalHours: Number((totalMins / 60).toFixed(1)),
      topSubject: topSubj,
      avgSessionMins: Math.round(totalMins / sessions.length),
    };
  }, [monthSessionsQuery.data]);

  // Auto-create today's meta if it doesn't exist.
  // Runs as an effect to avoid side effects in the render path (React StrictMode safe).
  const metaCreatedRef = useRef(false);

  useEffect(() => {
    const shouldCreate =
      todayMetaQuery.isSuccess &&
      (!todayMetaQuery.data || !todayMetaQuery.data.id) &&
      !createMetaMutation.isPending &&
      !metaCreatedRef.current &&
      userId;

    if (shouldCreate) {
      metaCreatedRef.current = true;
      const todayStr = new Date().toISOString().split('T')[0];
      createMetaMutation.mutate({
        user_id: userId!,
        data: todayStr,
        horas_meta: currentUser?.meta_diaria_horas || 4,
        horas_realizadas: 0,
        status: 'nao_iniciada',
      });
    }
  }, [todayMetaQuery.isSuccess, todayMetaQuery.data, createMetaMutation, userId, currentUser?.meta_diaria_horas]);

  const isLoading =
    cronogramaQuery.isLoading ||
    todayMetaQuery.isLoading ||
    monthSessionsQuery.isLoading;

  const error =
    cronogramaQuery.error || todayMetaQuery.error || monthSessionsQuery.error;

  return {
    // Data
    cronograma: cronogramaQuery.data ?? null,
    todayMeta: todayMetaQuery.data ?? null,
    todayProgress,
    todaySessionMinutes,
    monthlyStats,
    monthlySessions: monthSessionsQuery.data ?? [],
    ...scheduleData,

    // Mutations
    updateRating: updateRatingMutation,

    // State
    isLoading,
    error,
    currentUser,
  };
}
