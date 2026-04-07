/**
 * useCronogramaManager Hook
 * Manages cronograma CRUD operations, list state, form modal state,
 * and selected cronograma for detail/cycle view.
 */

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useCronogramaList,
  useActiveCronograma,
  useCreateCronograma,
  useUpdateCronograma,
  useDeleteCronograma,
} from '@/hooks/queries/useCronogramas';
import { useScheduleCalculator } from '@/hooks/useScheduleCalculator';
import { toast } from 'sonner';
import { Cronograma, Materia } from '@/types';
import { CronogramaFormData } from '@/schemas/cronograma';

// ============================================================================
// TYPES
// ============================================================================

export interface CronogramaManagerReturn {
  // List data
  cronogramas: Cronograma[];
  activeCronograma: Cronograma | null;
  activeCronogramaId: string | null;
  isLoading: boolean;

  // Selected cronograma (for detail/cycle view)
  selectedCronograma: Cronograma | null;
  selectCronograma: (cronograma: Cronograma) => void;
  clearSelection: () => void;

  // Modal state
  isModalOpen: boolean;
  editingCronograma: Cronograma | null;
  openCreate: () => void;
  openEdit: (cronograma: Cronograma) => void;
  closeModal: () => void;

  // Delete state
  showDeleteConfirm: boolean;
  deletingCronograma: Cronograma | null;
  openDeleteConfirm: (cronograma: Cronograma) => void;
  closeDeleteConfirm: () => void;

  // Mutations
  handleFormSubmit: (data: CronogramaFormData) => Promise<void>;
  handleDelete: () => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  // Cycle view helpers
  viewCycleOffset: number;
  setViewCycleOffset: (value: number | ((prev: number) => number)) => void;
  cycleHelpers: {
    getCycleInfo: ReturnType<typeof useScheduleCalculator>['getCycleInfo'];
    getSubjectForDay: ReturnType<typeof useScheduleCalculator>['getSubjectForDay'];
  };
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

export function useCronogramaManager(): CronogramaManagerReturn {
  const { currentUser } = useAuth();
  const { getCycleInfo, getSubjectForDay } = useScheduleCalculator();

  // TanStack Query - List and Active
  const listQuery = useCronogramaList(currentUser?.id);
  const activeQuery = useActiveCronograma(currentUser?.id);
  const createMutation = useCreateCronograma();
  const updateMutation = useUpdateCronograma();
  const deleteMutation = useDeleteCronograma();

  // Local UI state
  const [selectedCronograma, setSelectedCronograma] = useState<Cronograma | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCronograma, setEditingCronograma] = useState<Cronograma | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCronograma, setDeletingCronograma] = useState<Cronograma | null>(null);
  const [viewCycleOffset, setViewCycleOffset] = useState(0);

  // Derived data
  const cronogramas = listQuery.data ?? [];
  const activeCronograma = activeQuery.data ?? null;
  const activeCronogramaId = activeCronograma?.id ?? null;

  // ---- Selection Actions ----

  const selectCronograma = useCallback((cronograma: Cronograma) => {
    setSelectedCronograma(cronograma);
    setViewCycleOffset(0);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCronograma(null);
    setViewCycleOffset(0);
  }, []);

  // ---- Modal Actions ----

  const openCreate = useCallback(() => {
    setEditingCronograma(null);
    setIsModalOpen(true);
  }, []);

  const openEdit = useCallback((cronograma: Cronograma) => {
    setEditingCronograma(cronograma);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingCronograma(null);
  }, []);

  // ---- Delete Actions ----

  const openDeleteConfirm = useCallback((cronograma: Cronograma) => {
    setDeletingCronograma(cronograma);
    setShowDeleteConfirm(true);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setShowDeleteConfirm(false);
    setDeletingCronograma(null);
  }, []);

  // ---- Mutations ----

  const handleFormSubmit = useCallback(async (data: CronogramaFormData) => {
    if (!currentUser) {
      toast.error('Usuario nao autenticado');
      return;
    }

    const materias: Materia[] = data.materias.map((nome) => ({
      nome,
      status: 'nao_iniciada' as const,
    }));

    const payload = {
      user_id: currentUser.id,
      edital: data.edital,
      data_alvo: data.data_alvo,
      data_inicio: data.data_inicio || undefined,
      materias,
    };

    try {
      if (editingCronograma) {
        await updateMutation.mutateAsync({
          id: editingCronograma.id,
          data: payload,
        });
        // Update selected if this was the selected one
        if (selectedCronograma?.id === editingCronograma.id) {
          setSelectedCronograma(null);
        }
      } else {
        await createMutation.mutateAsync(payload);
      }
      closeModal();
    } catch (error) {
      console.error('Error saving cronograma:', error);
      toast.error('Erro ao salvar cronograma');
    }
  }, [currentUser, editingCronograma, selectedCronograma, updateMutation, createMutation, closeModal]);

  const handleDelete = useCallback(async () => {
    if (!deletingCronograma) return;
    try {
      await deleteMutation.mutateAsync(deletingCronograma.id);
      // Clear selection if deleted the selected one
      if (selectedCronograma?.id === deletingCronograma.id) {
        setSelectedCronograma(null);
      }
      closeDeleteConfirm();
    } catch (error) {
      console.error('Error deleting cronograma:', error);
      toast.error('Erro ao excluir cronograma');
    }
  }, [deletingCronograma, selectedCronograma, deleteMutation, closeDeleteConfirm]);

  // Cycle helpers
  const cycleHelpers = useMemo(() => ({
    getCycleInfo,
    getSubjectForDay,
  }), [getCycleInfo, getSubjectForDay]);

  return {
    cronogramas,
    activeCronograma,
    activeCronogramaId,
    isLoading: listQuery.isLoading,

    selectedCronograma,
    selectCronograma,
    clearSelection,

    isModalOpen,
    editingCronograma,
    openCreate,
    openEdit,
    closeModal,

    showDeleteConfirm,
    deletingCronograma,
    openDeleteConfirm,
    closeDeleteConfirm,

    handleFormSubmit,
    handleDelete,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    viewCycleOffset,
    setViewCycleOffset,
    cycleHelpers,
  };
}
