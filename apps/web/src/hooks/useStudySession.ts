/**
 * useStudySession Hook
 * Extracts timer logic, phase management, session save, and exam state
 * from StudySessionPage into a composable hook.
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
// TYPES
// ============================================================================

export type Phase = 'revisao' | 'estudo' | 'questoes';

export type ExamAnswers = Record<string, boolean | null>;

export interface PhaseConfig {
  id: Phase;
  label: string;
  description: string;
  tips: string[];
  defaultMinutes: number;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface StudySessionState {
  // Schedule data
  schedule: Cronograma | null;
  subjects: string[];
  todaySubject: Materia | null;
  cycleInfo: { cycleNumber: number; dayInCycle: number } | null;
  selectedSubject: string;

  // Phase management
  currentPhaseIdx: number;
  currentPhase: PhaseConfig;
  phaseDurations: Record<Phase, number>;
  completedPhases: Set<Phase>;

  // Timer
  isActive: boolean;
  timeLeft: number;
  totalMinutes: number;

  // Settings & exam modal
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
  toggleTimer: () => void;
  resetTimer: () => void;
  goToPhase: (idx: number) => void;
  goToNextPhase: () => void;
  finalizarSessao: () => void;
  updateDuration: (phase: Phase, minutes: number) => void;
  setShowSettings: (show: boolean | ((prev: boolean) => boolean)) => void;
  setShowExame: (show: boolean) => void;
  setExamAnswers: React.Dispatch<React.SetStateAction<ExamAnswers>>;
  setExamObservacoes: (value: string) => void;
  saveExameDiario: () => Promise<void>;
  formatTime: (seconds: number) => string;
  getProgress: () => number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

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

export const DEFAULT_PHASES: PhaseConfig[] = [
  {
    id: 'revisao',
    label: 'Revisao',
    description: 'Ative sua memoria e reforce o conteudo anterior',
    tips: [
      'Releia suas anotacoes da ultima sessao',
      'Tente lembrar os pontos principais sem olhar',
      'Coloque seu cerebro no modo estudo',
    ],
    defaultMinutes: 60,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  {
    id: 'estudo',
    label: 'Estudo',
    description: 'Aprenda o conteudo novo com marcacao ativa',
    tips: [
      'Marque os pontos principais enquanto le',
      'Faca pausas de 5 min a cada 50 min',
      'Teste sua retencao apos cada topico',
    ],
    defaultMinutes: 150,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
  },
  {
    id: 'questoes',
    label: 'Questoes',
    description: 'Aplique o conteudo e identifique suas falhas',
    tips: [
      'Resolva questoes sem consultar o material',
      'Anote os pontos que errou para revisar',
      'Analise o gabarito com atencao',
    ],
    defaultMinutes: 30,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
];

// ============================================================================
// HOOK
// ============================================================================

export function useStudySession() {
  const { currentUser } = useAuth();
  const { getCurrentSubject, getCycleInfo } = useScheduleCalculator();

  // TanStack Query for schedule data
  const cronogramaQuery = useActiveCronograma(currentUser?.id);
  const createSessaoMutation = useCreateSessao();

  // Schedule-derived state
  const [selectedSubject, setSelectedSubject] = useState('');
  const [todaySubject, setTodaySubject] = useState<Materia | null>(null);
  const [cycleInfo, setCycleInfo] = useState<{ cycleNumber: number; dayInCycle: number } | null>(null);

  // Phase state
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [phaseDurations, setPhaseDurations] = useState<Record<Phase, number>>({
    revisao: 60,
    estudo: 150,
    questoes: 30,
  });
  const [completedPhases, setCompletedPhases] = useState<Set<Phase>>(new Set());

  // Timer state
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [tempoGastoTotal, setTempoGastoTotal] = useState(0);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showExame, setShowExame] = useState(false);
  const [examAnswers, setExamAnswers] = useState<ExamAnswers>({});
  const [examObservacoes, setExamObservacoes] = useState('');
  const [savingExame, setSavingExame] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentPhase = DEFAULT_PHASES[currentPhaseIdx];
  const schedule = cronogramaQuery.data ?? null;

  // Derive subjects from schedule
  const subjects = useMemo(() => {
    if (!schedule?.materias) return [];
    return schedule.materias.map((m: Materia) => m.nome);
  }, [schedule]);

  // Compute schedule info when data arrives
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

  // Reset timer when phase changes
  useEffect(() => {
    setIsActive(false);
    setTimeLeft(phaseDurations[currentPhase.id] * 60);
  }, [currentPhaseIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer tick
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsActive(false);
            handlePhaseComplete();
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
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Actions ----

  const handlePhaseComplete = useCallback(() => {
    setCompletedPhases(prev => {
      const updated = new Set([...prev, DEFAULT_PHASES[currentPhaseIdx].id]);
      return updated;
    });
    if (currentPhaseIdx < DEFAULT_PHASES.length - 1) {
      toast.success(`${DEFAULT_PHASES[currentPhaseIdx].label} concluida! Avance para a proxima fase.`);
    } else {
      setTimeout(() => setShowExame(true), 800);
    }
  }, [currentPhaseIdx]);

  const goToNextPhase = useCallback(() => {
    setCompletedPhases(prev => new Set([...prev, currentPhase.id]));
    if (currentPhaseIdx < DEFAULT_PHASES.length - 1) {
      setCurrentPhaseIdx(prev => prev + 1);
    } else {
      setShowExame(true);
    }
  }, [currentPhase.id, currentPhaseIdx]);

  const goToPhase = useCallback((idx: number) => {
    setIsActive(false);
    setCurrentPhaseIdx(idx);
  }, []);

  const toggleTimer = useCallback(() => {
    if (!selectedSubject) {
      toast.error('Selecione uma materia antes de comecar.');
      return;
    }
    setIsActive(prev => !prev);
  }, [selectedSubject]);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTimeLeft(phaseDurations[currentPhase.id] * 60);
  }, [phaseDurations, currentPhase.id]);

  const finalizarSessao = useCallback(() => {
    setIsActive(false);
    const gastoEstaFase = phaseDurations[currentPhase.id] * 60 - timeLeft;
    const gastoFasesAnteriores = DEFAULT_PHASES
      .slice(0, currentPhaseIdx)
      .reduce((acc, p) => acc + phaseDurations[p.id] * 60, 0);
    const total = gastoFasesAnteriores + gastoEstaFase;
    setTempoGastoTotal(total);
    const min = Math.round(total / 60);
    toast.info(`Voce estudou ${min} minuto${min !== 1 ? 's' : ''}`);
    setShowExame(true);
  }, [phaseDurations, currentPhase.id, timeLeft, currentPhaseIdx]);

  const updateDuration = useCallback((phase: Phase, minutes: number) => {
    setPhaseDurations(prev => ({ ...prev, [phase]: minutes }));
    // If updating current phase and not running, update timeLeft too
    if (phase === DEFAULT_PHASES[currentPhaseIdx].id && !isActive) {
      setTimeLeft(minutes * 60);
    }
  }, [currentPhaseIdx, isActive]);

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
      const duracaoSegundos = tempoGastoTotal > 0
        ? tempoGastoTotal
        : Object.values(phaseDurations).reduce((a, b) => a + b, 0) * 60;
      const duracao = Math.max(1, Math.round(duracaoSegundos / 60));

      if (selectedSubject) {
        await createSessaoMutation.mutateAsync({
          user_id: currentUser?.id || '',
          cronograma_id: schedule?.id || '',
          materia: selectedSubject,
          data_sessao: new Date().toISOString().split('T')[0],
          duracao_minutos: duracao,
        });
      }

      setShowExame(false);
      toast.success(`Exame salvo! Voce acertou ${pontuacao} de ${EXAM_QUESTIONS.length} criterios.`);
    } catch {
      toast.error('Erro ao salvar o exame. Tente novamente.');
    } finally {
      setSavingExame(false);
    }
  }, [examAnswers, examObservacoes, tempoGastoTotal, phaseDurations, selectedSubject, currentUser?.id, schedule?.id, createSessaoMutation]);

  const formatTime = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  const getProgress = useCallback(() => {
    const total = phaseDurations[currentPhase.id] * 60;
    if (total === 0) return 0;
    return ((total - timeLeft) / total) * 100;
  }, [phaseDurations, currentPhase.id, timeLeft]);

  const totalMinutes = useMemo(
    () => Object.values(phaseDurations).reduce((a, b) => a + b, 0),
    [phaseDurations]
  );

  return {
    // State
    state: {
      schedule,
      subjects,
      todaySubject,
      cycleInfo,
      selectedSubject,
      currentPhaseIdx,
      currentPhase,
      phaseDurations,
      completedPhases,
      isActive,
      timeLeft,
      totalMinutes,
      showSettings,
      showExame,
      examAnswers,
      examObservacoes,
      savingExame,
      isLoading: cronogramaQuery.isLoading,
    },

    // Actions
    actions: {
      setSelectedSubject,
      toggleTimer,
      resetTimer,
      goToPhase,
      goToNextPhase,
      finalizarSessao,
      updateDuration,
      setShowSettings,
      setShowExame,
      setExamAnswers,
      setExamObservacoes,
      saveExameDiario,
      formatTime,
      getProgress,
    },
  };
}
