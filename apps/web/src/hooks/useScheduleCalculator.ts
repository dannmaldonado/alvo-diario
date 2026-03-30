/**
 * Hook for schedule calculations
 * Calculates cycle position, current subject, and days elapsed
 */

import { useCallback } from 'react';

import { Cronograma, Materia } from '@/types';

type ScheduleData = Cronograma | {
  created: string;
  materias?: string[] | Materia[];
};

interface CycleInfo {
  cycleNumber: number;
  dayInCycle: number;
  totalDaysInCycle: number;
  totalDaysElapsed: number;
}

export const useScheduleCalculator = () => {
  const getDaysSinceCreation = useCallback(
    (schedule: ScheduleData | null | undefined, targetDate: Date = new Date()): number => {
      if (!schedule || !schedule.created) return 0;

      const created = new Date(schedule.created);
      created.setHours(0, 0, 0, 0);

      const target = new Date(targetDate);
      target.setHours(0, 0, 0, 0);

      const diffTime = target.getTime() - created.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      return Math.max(0, diffDays);
    },
    []
  );

  const getSubjectForDay = useCallback(
    (schedule: ScheduleData | null | undefined, dayNumber: number): string | Materia | null => {
      if (!schedule || !schedule.materias || schedule.materias.length === 0) return null;
      const index = dayNumber % schedule.materias.length;
      const subject = schedule.materias[index];
      return subject || null;
    },
    []
  );

  const getCurrentSubject = useCallback(
    (schedule: ScheduleData | null | undefined, date: Date = new Date()): string | Materia | null => {
      const days = getDaysSinceCreation(schedule, date);
      return getSubjectForDay(schedule, days);
    },
    [getDaysSinceCreation, getSubjectForDay]
  );

  const getCycleInfo = useCallback(
    (schedule: ScheduleData | null | undefined, date: Date = new Date()): CycleInfo => {
      if (!schedule || !schedule.materias || schedule.materias.length === 0) {
        return { cycleNumber: 1, dayInCycle: 1, totalDaysInCycle: 1, totalDaysElapsed: 0 };
      }

      const days = getDaysSinceCreation(schedule, date);
      const totalDaysInCycle = schedule.materias.length;

      const cycleNumber = Math.floor(days / totalDaysInCycle) + 1;
      const dayInCycle = (days % totalDaysInCycle) + 1;

      return {
        cycleNumber,
        dayInCycle,
        totalDaysInCycle,
        totalDaysElapsed: days,
      };
    },
    [getDaysSinceCreation]
  );

  return {
    getCurrentSubject,
    getSubjectForDay,
    getCycleInfo,
    getDaysSinceCreation,
  };
};
