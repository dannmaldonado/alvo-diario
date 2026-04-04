/**
 * useCronogramaManager Hook
 * Extracts CRUD operations, form state, schedule generation, and modal state
 * from CronogramaPage into a composable hook.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useActiveCronograma,
  useCreateCronograma,
  useUpdateCronograma,
  useDeleteCronograma,
} from '@/hooks/queries/useCronogramas';
import { useScheduleCalculator } from '@/hooks/useScheduleCalculator';
import { toast } from 'sonner';
import { Cronograma, Materia } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface CronogramaManagerState {
  loading: boolean;
  saving: boolean;
  deleting: boolean;
  showDeleteConfirm: boolean;
  cronograma: Cronograma | null;
  edital: string;
  dataAlvo: string;
  dataInicio: string;
  materias: Materia[];
  viewCycleOffset: number;
  editingDates: boolean;
  errors: { edital?: string; dataAlvo?: string };
}

export interface CronogramaManagerActions {
  setEdital: (value: string) => void;
  setDataAlvo: (value: string) => void;
  setDataInicio: (value: string) => void;
  setEditingDates: (value: boolean) => void;
  setShowDeleteConfirm: (value: boolean) => void;
  setViewCycleOffset: (value: number | ((prev: number) => number)) => void;
  generateSchedule: () => void;
  addMateria: () => void;
  removeMateria: (index: number) => void;
  updateMateria: (index: number, value: string) => void;
  saveCronograma: () => Promise<void>;
  deleteCronograma: () => Promise<void>;
  saveDates: () => Promise<void>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const EDITAL_SUBJECTS: Record<string, string[]> = {
  PC: [
    'Direito Constitucional', 'Direito Administrativo', 'Direito Penal',
    'Direito Processual Penal', 'Criminologia', 'Legislacao Especial',
    'Portugues', 'Raciocinio Logico', 'Informatica',
  ],
  PRF: [
    'Direito Constitucional', 'Direito Administrativo', 'Direito Penal',
    'Direito Processual Penal', 'Legislacao de Transito', 'Fisica',
    'Portugues', 'Raciocinio Logico', 'Informatica', 'Etica e Cidadania',
  ],
  PF: [
    'Direito Constitucional', 'Direito Administrativo', 'Direito Penal',
    'Direito Processual Penal', 'Legislacao Especial', 'Contabilidade',
    'Portugues', 'Raciocinio Logico', 'Informatica', 'Atualidades',
  ],
};

// ============================================================================
// HOOK
// ============================================================================

export function useCronogramaManager() {
  const { currentUser } = useAuth();
  const { getCycleInfo, getSubjectForDay } = useScheduleCalculator();

  // TanStack Query
  const cronogramaQuery = useActiveCronograma(currentUser?.id);
  const createMutation = useCreateCronograma();
  const updateMutation = useUpdateCronograma();
  const deleteMutation = useDeleteCronograma();

  // Local form state
  const [edital, setEdital] = useState('');
  const [dataAlvo, setDataAlvo] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [viewCycleOffset, setViewCycleOffset] = useState(0);
  const [editingDates, setEditingDates] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors] = useState<{ edital?: string; dataAlvo?: string }>({});

  const cronograma = cronogramaQuery.data ?? null;

  // Sync form state when query data arrives
  useEffect(() => {
    if (cronograma) {
      setEdital(cronograma.edital);
      setDataAlvo(cronograma.data_alvo ? cronograma.data_alvo.split('T')[0] : '');
      setDataInicio(cronograma.data_inicio ? cronograma.data_inicio.split('T')[0] : '');
      setMaterias(cronograma.materias);
    }
  }, [cronograma]);

  // ---- Actions ----

  const generateSchedule = useCallback(() => {
    if (!edital || !dataAlvo) {
      toast.error('Selecione o edital e a data alvo');
      return;
    }
    const subjects = EDITAL_SUBJECTS[edital];
    if (!subjects) return;

    const scheduledMaterias: Materia[] = subjects.map((subject) => ({
      nome: subject,
      status: 'nao_iniciada' as const,
    }));

    setMaterias(scheduledMaterias);
    toast.success(`Ciclo gerado com ${subjects.length} materias`);
  }, [edital, dataAlvo]);

  const addMateria = useCallback(() => {
    setMaterias(prev => [...prev, { nome: '', status: 'nao_iniciada' }]);
  }, []);

  const removeMateria = useCallback((index: number) => {
    setMaterias(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateMateria = useCallback((index: number, value: string) => {
    setMaterias(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], nome: value };
      return updated;
    });
  }, []);

  const saveCronograma = useCallback(async () => {
    if (!edital || !dataAlvo || materias.length === 0) {
      toast.error('Preencha todos os campos obrigatorios');
      return;
    }
    if (materias.some(m => !m.nome)) {
      toast.error('Todas as materias devem ter um nome');
      return;
    }
    if (!currentUser) {
      toast.error('Usuario nao autenticado');
      return;
    }

    const data = {
      user_id: currentUser.id,
      edital,
      data_alvo: dataAlvo,
      data_inicio: dataInicio || undefined,
      materias,
    };

    try {
      if (cronograma) {
        await updateMutation.mutateAsync({ id: cronograma.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error('Error saving cronograma:', error);
      toast.error('Erro ao salvar cronograma');
    }
  }, [edital, dataAlvo, dataInicio, materias, currentUser, cronograma, updateMutation, createMutation]);

  const handleDeleteCronograma = useCallback(async () => {
    if (!cronograma) return;
    try {
      await deleteMutation.mutateAsync(cronograma.id);
      // Reset local form state
      setEdital('');
      setDataAlvo('');
      setDataInicio('');
      setMaterias([]);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting cronograma:', error);
      toast.error('Erro ao excluir cronograma');
    }
  }, [cronograma, deleteMutation]);

  const saveDates = useCallback(async () => {
    if (!cronograma || !dataAlvo) {
      toast.error('A data da prova e obrigatoria');
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: cronograma.id,
        data: {
          data_alvo: dataAlvo,
          data_inicio: dataInicio || undefined,
        },
      });
      setEditingDates(false);
    } catch {
      toast.error('Erro ao salvar datas');
    }
  }, [cronograma, dataAlvo, dataInicio, updateMutation]);

  // Exposed cycle helpers for rendering
  const cycleHelpers = useMemo(() => ({
    getCycleInfo,
    getSubjectForDay,
  }), [getCycleInfo, getSubjectForDay]);

  return {
    state: {
      loading: cronogramaQuery.isLoading,
      saving: createMutation.isPending || updateMutation.isPending,
      deleting: deleteMutation.isPending,
      showDeleteConfirm,
      cronograma,
      edital,
      dataAlvo,
      dataInicio,
      materias,
      viewCycleOffset,
      editingDates,
      errors,
    } satisfies CronogramaManagerState,

    actions: {
      setEdital,
      setDataAlvo,
      setDataInicio,
      setEditingDates,
      setShowDeleteConfirm,
      setViewCycleOffset,
      generateSchedule,
      addMateria,
      removeMateria,
      updateMateria,
      saveCronograma,
      deleteCronograma: handleDeleteCronograma,
      saveDates,
    } satisfies CronogramaManagerActions,

    cycleHelpers,
  };
}
