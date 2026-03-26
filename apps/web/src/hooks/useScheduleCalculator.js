
import { useCallback } from 'react';

export const useScheduleCalculator = () => {
  const getDaysSinceCreation = useCallback((schedule, targetDate = new Date()) => {
    if (!schedule || !schedule.created) return 0;
    
    const created = new Date(schedule.created);
    created.setHours(0, 0, 0, 0);
    
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - created.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }, []);

  const getSubjectForDay = useCallback((schedule, dayNumber) => {
    if (!schedule || !schedule.materias || schedule.materias.length === 0) return null;
    const index = dayNumber % schedule.materias.length;
    return schedule.materias[index];
  }, []);

  const getCurrentSubject = useCallback((schedule, date = new Date()) => {
    const days = getDaysSinceCreation(schedule, date);
    return getSubjectForDay(schedule, days);
  }, [getDaysSinceCreation, getSubjectForDay]);

  const getCycleInfo = useCallback((schedule, date = new Date()) => {
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
      totalDaysElapsed: days 
    };
  }, [getDaysSinceCreation]);

  return { 
    getCurrentSubject, 
    getSubjectForDay, 
    getCycleInfo, 
    getDaysSinceCreation 
  };
};
