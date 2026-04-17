/**
 * useStudySession Hook - SIMPLIFIED
 * Single 25-minute Pomodoro timer with cumulative day tracking.
 * User studies 25 min → decide: continue (+25 min) or finish (rating modal).
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCronograma } from '@/hooks/queries/useCronogramas';
import { useCreateSessao } from '@/hooks/queries/useSessoes';
import { useTodayMeta, useUpdateMetaRating } from '@/hooks/queries/useMetas';
import { useScheduleCalculator } from '@/hooks/useScheduleCalculator';
import { toast } from 'sonner';
import { Cronograma, Materia, DailyRatingValue } from '@/types';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export const DAILY_STUDY_GOAL_MINUTES = 240; // 4 hours
export const SESSION_DURATION_MINUTES = 25; // Pomodoro

export interface StudySessionState {
  // Schedule
  schedule: Cronograma | null;
  subjects: string[];
  todaySubject: Materia | null;
  cycleInfo: { cycleNumber: number; dayInCycle: number } | null;
  selectedSubject: string;

  // Timer & cumulative
  sessionDuration: number; // minutes (always 25)
  isActive: boolean;
  timeLeft: number; // seconds
  totalStudyMinutesToday: number; // cumulative minutes
  sessionEnded: boolean;
  showBreakReminder: boolean;

  // Session
  sessionNotes: string;

  // UI & rating modal
  showSettings: boolean;
  showExame: boolean;
  avaliacao: DailyRatingValue | null;
  examObservacoes: string;
  savingExame: boolean;

  // Loading
  isLoading: boolean;
}

export interface StudySessionActions {
  setSelectedSubject: (subject: string) => void;
  setSessionNotes: (notes: string) => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  continueStudying: () => void;
  finalizarSessao: () => void;
  skipBreakReminder: () => void;
  setShowSettings: (show: boolean | ((prev: boolean) => boolean)) => void;
  setShowExame: (show: boolean) => void;
  setAvaliacao: (rating: DailyRatingValue) => void;
  setExamObservacoes: (value: string) => void;
  saveExameDiario: () => Promise<void>;
  formatTime: (seconds: number) => string;
  getProgress: () => number;
  getCumulativeMinutes: () => number;
}

// ============================================================================
// HOOK
// ============================================================================

export function useStudySession() {
  const { currentUser } = useAuth();
  const { getCurrentSubject, getCycleInfo } = useScheduleCalculator();

  const cronogramaQuery = useActiveCronograma(currentUser?.id);
  const createSessaoMutation = useCreateSessao();
  const todayMetaQuery = useTodayMeta(currentUser?.id);
  const updateMetaRatingMutation = useUpdateMetaRating();

  // Schedule
  const [selectedSubject, setSelectedSubject] = useState('');
  const [todaySubject, setTodaySubject] = useState<Materia | null>(null);
  const [cycleInfo, setCycleInfo] = useState<{ cycleNumber: number; dayInCycle: number } | null>(null);

  // Timer & cumulative (SIMPLIFIED)
  const [sessionDuration] = useState(SESSION_DURATION_MINUTES); // Fixed at 25 min
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION_MINUTES * 60); // in seconds
  const [totalStudyMinutesToday, setTotalStudyMinutesToday] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [showBreakReminder, setShowBreakReminder] = useState(false);

  // Session
  const [sessionNotes, setSessionNotes] = useState('');

  // UI & rating modal
  const [showSettings, setShowSettings] = useState(false);
  const [showExame, setShowExame] = useState(false);
  const [avaliacao, setAvaliacao] = useState<DailyRatingValue | null>(null);
  const [examObservacoes, setExamObservacoes] = useState('');
  const [savingExame, setSavingExame] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const schedule = cronogramaQuery.data ?? null;

  // Derive subjects from schedule
  const subjects = useMemo(() => {
    if (!schedule?.materias) return [];
    return schedule.materias.map((m: Materia) => m.nome);
  }, [schedule]);

  // Compute schedule info
  useEffect(() => {
    if (!schedule?.materias) return;

    const today = new Date();
    const current = getCurrentSubject(schedule, today) as Materia | null;
    const info = getCycleInfo(schedule, today) as { cycleNumber: number; dayInCycle: number } | null;
    setTodaySubject(current);
    setCycleInfo(info);

    if (current?.nome && !selectedSubject) {
      setSelectedSubject(current.nome);
    } else if (!selectedSubject && subjects.length > 0) {
      setSelectedSubject(subjects[0]);
    }
  }, [schedule, getCurrentSubject, getCycleInfo, subjects, selectedSubject]);

  // Timer tick
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsActive(false);
            // Timer completed: show break reminder and decision screen
            setShowBreakReminder(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  // ---- Cumulative Time ----

  const getCumulativeMinutes = useCallback((): number => {
    // Total studied today + elapsed time in current session
    const sessionTotal = sessionDuration * 60; // in seconds
    const sessionElapsed = sessionTotal - timeLeft;
    return totalStudyMinutesToday + Math.ceil(sessionElapsed / 60);
  }, [totalStudyMinutesToday, sessionDuration, timeLeft]);

  // ---- Actions ----

  const toggleTimer = useCallback(() => {
    if (!selectedSubject) {
      toast.error('Selecione uma materia antes de comecar.');
      return;
    }
    setIsActive(prev => !prev);
  }, [selectedSubject]);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTimeLeft(sessionDuration * 60);
  }, [sessionDuration]);

  const continueStudying = useCallback(() => {
    // Add +25 min to cumulative
    const newTotal = totalStudyMinutesToday + sessionDuration;
    setTotalStudyMinutesToday(newTotal);
    setTimeLeft(sessionDuration * 60); // Reset timer
    setShowBreakReminder(false);

    // Check if reached daily goal
    if (newTotal >= DAILY_STUDY_GOAL_MINUTES) {
      toast.success(`Meta diária atingida! 🎉 ${newTotal} min estudados.`);
      setTimeout(() => setSessionEnded(true), 800);
    }
  }, [sessionDuration, totalStudyMinutesToday]);

  const skipBreakReminder = useCallback(() => {
    setShowBreakReminder(false);
  }, []);

  const finalizarSessao = useCallback(() => {
    setIsActive(false);
    setShowBreakReminder(false);
    const cumulativeMinutes = getCumulativeMinutes();
    setTotalStudyMinutesToday(cumulativeMinutes);
    setSessionEnded(true);
    setShowExame(true); // Abre o modal de avaliação
  }, [getCumulativeMinutes]);

  const saveExameDiario = useCallback(async () => {
    if (!avaliacao) {
      toast.error('Selecione uma avaliação de 1 a 5.');
      return;
    }
    try {
      setSavingExame(true);

      // Salva sessão de estudo
      const duracao = Math.max(1, totalStudyMinutesToday);
      if (selectedSubject) {
        await createSessaoMutation.mutateAsync({
          user_id: currentUser?.id || '',
          cronograma_id: schedule?.id || '',
          materia: selectedSubject,
          data_sessao: new Date().toISOString().split('T')[0],
          duracao_minutos: duracao,
          ...(examObservacoes.trim() ? { notas: examObservacoes.trim().slice(0, 500) } : {}),
        });
      }

      // Atualiza avaliação diária na meta do dia
      const todayMeta = todayMetaQuery.data;
      if (todayMeta?.id) {
        await updateMetaRatingMutation.mutateAsync({
          id: todayMeta.id,
          avaliacao_diaria: avaliacao,
        });
      }

      setShowExame(false);
      toast.success('Sessão salva! Ótimo trabalho! 🎉');
    } catch {
      toast.error('Erro ao salvar a sessão. Tente novamente.');
    } finally {
      setSavingExame(false);
    }
  }, [avaliacao, examObservacoes, totalStudyMinutesToday, selectedSubject,
      currentUser?.id, schedule?.id, createSessaoMutation,
      todayMetaQuery.data, updateMetaRatingMutation]);

  const formatTime = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  const getProgress = useCallback(() => {
    const total = sessionDuration * 60;
    if (total === 0) return 0;
    return ((total - timeLeft) / total) * 100;
  }, [sessionDuration, timeLeft]);

  return {
    state: {
      schedule,
      subjects,
      todaySubject,
      cycleInfo,
      selectedSubject,
      sessionDuration,
      isActive,
      timeLeft,
      totalStudyMinutesToday,
      sessionEnded,
      showBreakReminder,
      sessionNotes,
      showSettings,
      showExame,
      avaliacao,
      examObservacoes,
      savingExame,
      isLoading: cronogramaQuery.isLoading,
    },

    actions: {
      setSelectedSubject,
      setSessionNotes,
      toggleTimer,
      resetTimer,
      continueStudying,
      finalizarSessao,
      skipBreakReminder,
      setShowSettings,
      setShowExame,
      setAvaliacao,
      setExamObservacoes,
      saveExameDiario,
      formatTime,
      getProgress,
      getCumulativeMinutes,
    },
  };
}
