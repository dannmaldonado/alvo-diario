/**
 * CronogramaPage
 * Lists all user cronogramas, shows detail/cycle view for selected one,
 * and provides CRUD via modal form + AlertDialog delete confirmation.
 */

import React from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import CronogramaList from '@/components/cronograma/CronogramaList';
import CronogramaForm from '@/components/cronograma/CronogramaForm';
import SubjectBadge from '@/components/SubjectBadge';
import { useCronogramaManager } from '@/hooks/useCronogramaManager';

const CronogramaPage: React.FC = () => {
  const manager = useCronogramaManager();

  const {
    cronogramas,
    activeCronogramaId,
    isLoading,
    selectedCronograma,
    selectCronograma,
    clearSelection,
    isModalOpen,
    editingCronograma,
    openCreate,
    openEdit,
    closeModal,
    showDeleteConfirm,
    openDeleteConfirm,
    closeDeleteConfirm,
    handleFormSubmit,
    handleDelete,
    isCreating,
    isUpdating,
    isDeleting,
    viewCycleOffset,
    setViewCycleOffset,
    cycleHelpers,
  } = manager;

  if (isLoading) {
    return (
      <>
        <Helmet><title>Cronograma - Alvo Diario</title></Helmet>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <LoadingSpinner text="Carregando seus cronogramas..." size="lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Cronograma - Alvo Diario</title>
        <meta name="description" content="Gerencie seus cronogramas de estudos em ciclos" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold md:text-4xl tracking-tight">
              Cronograma de Ciclos
            </h1>
            <p className="text-lg text-muted-foreground">
              Estude de forma inteligente alternando materias em ciclos continuos.
            </p>
          </div>

          {selectedCronograma ? (
            <CronogramaDetail
              cronograma={selectedCronograma}
              viewCycleOffset={viewCycleOffset}
              onSetViewCycleOffset={setViewCycleOffset}
              getCycleInfo={cycleHelpers.getCycleInfo}
              getSubjectForDay={cycleHelpers.getSubjectForDay}
              onBack={clearSelection}
              onEdit={() => openEdit(selectedCronograma)}
              onDelete={() => openDeleteConfirm(selectedCronograma)}
              isActive={selectedCronograma.id === activeCronogramaId}
            />
          ) : (
            <CronogramaList
              cronogramas={cronogramas}
              activeCronogramaId={activeCronogramaId}
              onEdit={openEdit}
              onDelete={openDeleteConfirm}
              onCreate={openCreate}
              onSelect={selectCronograma}
            />
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <CronogramaForm
        open={isModalOpen}
        onOpenChange={(open) => { if (!open) closeModal(); }}
        onSubmit={handleFormSubmit}
        initialValues={editingCronograma}
        isSubmitting={isCreating || isUpdating}
      />

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => { if (!open) closeDeleteConfirm(); }}>
        <AlertDialogContent>
          <AlertDialogHeader className="">
            <AlertDialogTitle>Excluir Cronograma</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cronograma? Esta acao nao pode ser desfeita
              e todas as suas materias serao perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="">
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// ============================================================================
// DETAIL VIEW (Selected Cronograma)
// ============================================================================

interface CronogramaDetailProps {
  cronograma: NonNullable<ReturnType<typeof useCronogramaManager>['selectedCronograma']>;
  viewCycleOffset: number;
  onSetViewCycleOffset: (value: number | ((prev: number) => number)) => void;
  getCycleInfo: ReturnType<typeof useCronogramaManager>['cycleHelpers']['getCycleInfo'];
  getSubjectForDay: ReturnType<typeof useCronogramaManager>['cycleHelpers']['getSubjectForDay'];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isActive: boolean;
}

const CronogramaDetail: React.FC<CronogramaDetailProps> = ({
  cronograma,
  viewCycleOffset,
  onSetViewCycleOffset,
  getCycleInfo,
  getSubjectForDay,
  onBack,
  onEdit,
  onDelete,
  isActive,
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { cycleNumber: currentCycleNum, totalDaysInCycle } = getCycleInfo(cronograma, today);
  const targetCycleNum = Math.max(1, currentCycleNum + viewCycleOffset);

  const cycleStartDate = new Date(cronograma.data_inicio || cronograma.created);
  cycleStartDate.setHours(0, 0, 0, 0);
  cycleStartDate.setDate(cycleStartDate.getDate() + ((targetCycleNum - 1) * totalDaysInCycle));

  const days = Array.from({ length: totalDaysInCycle }, (_, i) => {
    const date = new Date(cycleStartDate);
    date.setDate(date.getDate() + i);
    const isToday = date.getTime() === today.getTime();
    const isPast = date.getTime() < today.getTime();
    const subject = getSubjectForDay(cronograma, i);
    return { dayNum: i + 1, date, isToday, isPast, subject };
  });

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{cronograma.edital}</h2>
              {isActive && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  Ativo
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {cronograma.materias?.length || 0} materias no ciclo
              {cronograma.data_alvo && (
                <> &middot; Prova: {new Date(cronograma.data_alvo).toLocaleDateString('pt-BR')}</>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit}>
            Editar
          </Button>
          <Button
            variant="outline"
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            Excluir
          </Button>
        </div>
      </div>

      {/* Materias overview */}
      {cronograma.materias && cronograma.materias.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold mb-3">Materias do Ciclo</h3>
          <div className="flex flex-wrap gap-2">
            {cronograma.materias.map((m, i) => (
              <SubjectBadge key={i} subject={m} size="md" />
            ))}
          </div>
        </div>
      )}

      {/* Cycle Grid */}
      {cronograma.materias && cronograma.materias.length > 0 && (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onSetViewCycleOffset((prev: number) => prev - 1)}
              disabled={targetCycleNum <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <h3 className="font-semibold text-lg">Ciclo {targetCycleNum}</h3>
              <p className="text-sm text-muted-foreground">
                {cycleStartDate.toLocaleDateString('pt-BR')} -{' '}
                {days[days.length - 1].date.toLocaleDateString('pt-BR')}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onSetViewCycleOffset((prev: number) => prev + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="divide-y divide-border">
            {days.map((day) => (
              <div
                key={day.dayNum}
                className={`p-4 flex items-center gap-4 transition-colors ${
                  day.isToday
                    ? 'bg-primary/5 border-l-4 border-l-primary'
                    : day.isPast
                      ? 'opacity-60 bg-muted/20'
                      : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex flex-col items-center justify-center min-w-[60px]">
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    Dia
                  </span>
                  <span className={`text-2xl font-bold ${day.isToday ? 'text-primary' : ''}`}>
                    {day.dayNum}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-muted-foreground">
                      {day.date.toLocaleDateString('pt-BR', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                    {day.isToday && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        Hoje
                      </span>
                    )}
                  </div>
                  <SubjectBadge subject={day.subject} size="lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CronogramaPage;
