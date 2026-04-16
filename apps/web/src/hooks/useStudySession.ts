/**
 * useStudySession Hook - SIMPLIFIED
 * Single 25-minute Pomodoro timer with cumulative day tracking.
 * User studies 25 min → decide: continue (+25 min) or finish (exam).
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCronograma } from '@/hooks/queries/useCronogramas';
import { useCreateSessao } from '@/hooks/queries/useSessoes';
import { useScheduleCalculator } from '@/hooks/useScheduleCalculator';
import { apiClient } from '@/services/api';
import { toast } from 'sonner';
import { Cronograma, Materia } from '@/types';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export type ExamAnswers = Record<string, boolean | null>;

export const DAILY_STUDY_GOAL_MINUTES = 240; // 4 hours
export const SESSION_DURATION_MINUTES = 25; // Pomodoro

export const EXAM_QUESTIONS = [
  { id: 'horarios', categoria: 'Disciplina', texto: 'Cumpri os horarios planejados?' },
  { id: 'distracao', categoria: 'Disciplina', texto: 'Evitei distracoes (celular, redes sociais)?' },
  { id: 'retencao', categoria: 'Aprendizado', texto: 'Estou retendo o conteudo?' },
  { id: 'explicar', categoria: 'Aprendizado', texto: 'Consigo explicar o que estudei com minhas palavras?' },
  { id: 'questoes', categoria: 'Pratica', texto: 'Resolvi questoes hoje?' },
  { id: 'erros', categoria: 'Pratica', texto: 'Revisei os erros das questoes?' },
  { id: 'plano', categoria: 'Progresso', texto: 'Cumpri o plano do dia?' },
  { id: 'evolucao', categoria: 'Progresso', texto: 'Me sinto mais preparado do que ontem?' },
] as const;

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

  // UI & exam
  showSettings: boolean;
  showExame: boolean;
  examAnswers: ExamAnswers;
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
  setExamAnswers: React.Dispatch<React.SetStateAction<ExamAnswers>>;
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

  // UI & exam
  const [showSettings, setShowSettings] = useState(false);
  const [showExame, setShowExame] = useState(false);
  const [examAnswers, setExamAnswers] = useState<ExamAnswers>({});
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
    toast.info(`Voce estudou ${cumulativeMinutes} minuto${cumulativeMinutes !== 1 ? 's' : ''}`);
    setSessionEnded(true);
  }, [getCumulativeMinutes]);

  const saveExameDiario = useCallback(async () => {
    const totalRespondidas = Object.values(examAnswers).filter(v => v !== null).length;
    if (totalRespondidas < EXAM_QUESTIONS.length) {
      toast.error('Responda todas as perguntas antes de concluir.');
      return;
    }
    try {
      setSavingExame(true);
      const pontuacao = Object.values(examAnswers).filter(Boolean).length;
      await apiClient.post('/api/exames', {
        respostas: examAnswers,
        observacoes: examObservacoes,
        pontuacao,
      });

      // Save study session
      const duracao = Math.max(1, totalStudyMinutesToday);

      if (selectedSubject) {
        await createSessaoMutation.mutateAsync({
          user_id: currentUser?.id || '',
          cronograma_id: schedule?.id || '',
          materia: selectedSubject,
          data_sessao: new Date().toISOString().split('T')[0],
          duracao_minutos: duracao,
          ...(sessionNotes.trim() ? { notas: sessionNotes.trim().slice(0, 500) } : {}),
        });
      }

      setShowExame(false);
      toast.success(`Exame salvo! Voce acertou ${pontuacao} de ${EXAM_QUESTIONS.length} criterios.`);
    } catch {
      toast.error('Erro ao salvar o exame. Tente novamente.');
    } finally {
      setSavingExame(false);
    }
  }, [examAnswers, examObservacoes, totalStudyMinutesToday, selectedSubject, currentUser?.id, schedule?.id, createSessaoMutation, sessionNotes]);

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
      examAnswers,
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
      setExamAnswers,
      setExamObservacoes,
      saveExameDiario,
      formatTime,
      getProgress,
      getCumulativeMinutes,
    },
  };
}
