/**
 * CronogramaPage
 * Lists all user cronogramas, shows detail/cycle view for selected one,
 * and provides CRUD via modal form + AlertDialog delete confirmation.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { ArrowLeft, ChevronLeft, ChevronRight, FileText, Map, Upload } from 'lucide-react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import CronogramaList from '@/components/cronograma/CronogramaList';
import CronogramaForm from '@/components/cronograma/CronogramaForm';
import { MapaBancaModal } from '@/components/cronograma/MapaBancaModal';
import { ImportEditalSheet } from '@/components/cronograma/ImportEditalSheet';
import { EditalVerticalizadoView } from '@/components/cronograma/EditalVerticalizadoView';
import { CycleRingView } from '@/components/cronograma/CycleRingView';
import { ConteudoDoDia } from '@/components/cronograma/ConteudoDoDia';
import SubjectBadge from '@/components/SubjectBadge';
import { useCronogramaManager } from '@/hooks/useCronogramaManager';
import { useUpdateCronograma } from '@/hooks/queries/useCronogramas';
import { useEditaisList } from '@/hooks/queries/useEditais';

const CronogramaPage: React.FC = () => {
  const manager = useCronogramaManager();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editalIdParam = searchParams.get('edital_id');
  const [showLinkDialog, setShowLinkDialog] = useState(false);

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

  const updateCronogramaForLink = useUpdateCronograma();
  const editaisQueryForLink = useEditaisList();
  const linkDialogTriggeredRef = useRef(false);

  // When arriving from /editais with ?edital_id, offer to link or create
  useEffect(() => {
    if (!editalIdParam) return;
    if (isLoading) return;
    if (linkDialogTriggeredRef.current) return;
    const alreadyLinked = cronogramas.some((c: any) => c.edital_id === editalIdParam);
    if (alreadyLinked) return;
    linkDialogTriggeredRef.current = true;
    if (cronogramas.length > 0) {
      setShowLinkDialog(true);
    } else {
      openCreate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editalIdParam, isLoading, cronogramas.length]);

  const handleLinkToExisting = (cronogramaId: string) => {
    const cronograma = cronogramas?.find((c: any) => c.id === cronogramaId);
    const edital = editaisQueryForLink.data?.find((e: any) => e.id === editalIdParam);
    if (!cronograma || !edital) return;
    const editalMaterias: Array<{ nome: string }> = (edital as any).materias ?? [];
    const data: Record<string, unknown> = { edital_id: editalIdParam };
    if (!(cronograma as any).materias?.length && editalMaterias.length > 0) {
      data.materias = editalMaterias.map((m: { nome: string }) => ({ nome: m.nome }));
    }
    updateCronogramaForLink.mutate(
      { id: cronogramaId, data: data as Parameters<typeof updateCronogramaForLink.mutate>[0]['data'] },
      { onSuccess: () => { setShowLinkDialog(false); selectCronograma(cronograma); } }
    );
  };

  if (isLoading) {
    return (
      <>
        <Helmet><title>Cronograma - Alvo Diario</title></Helmet>
        <div className="flex items-center justify-center py-24">
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

      <div>
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
          <div className="mb-6">
            <h1 className="mb-1.5 text-2xl font-bold md:text-3xl tracking-tight">
              Cronograma de Ciclos
            </h1>
            <p className="text-base text-muted-foreground">
              Estude de forma inteligente alternando materias em ciclos continuos.
            </p>
          </div>

          {selectedCronograma ? (
            <CronogramaDetail
              cronograma={selectedCronograma}
              viewCycleOffset={viewCycleOffset}
              onSetViewCycleOffset={setViewCycleOffset}
              getCycleInfo={cycleHelpers.getCycleInfo}
              onBack={clearSelection}
              onEdit={() => openEdit(selectedCronograma)}
              onDelete={() => openDeleteConfirm(selectedCronograma)}
              isActive={selectedCronograma.id === activeCronogramaId}
              onNavigate={navigate}
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

      {/* Link existing cronograma to edital dialog */}
      <AlertDialog open={showLinkDialog} onOpenChange={(open) => { if (!open) setShowLinkDialog(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vincular edital ao cronograma</AlertDialogTitle>
            <AlertDialogDescription>
              Você já tem {cronogramas?.length === 1 ? 'um cronograma' : `${cronogramas?.length} cronogramas`}. Deseja vincular este edital a um cronograma existente ou criar um novo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {cronogramas && cronogramas.length > 0 && (
            <div className="py-2 space-y-2">
              {cronogramas.map((c: any) => (
                <button
                  key={c.id}
                  className="w-full text-left rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/60 hover:bg-primary/5 transition-colors"
                  onClick={() => handleLinkToExisting(c.id)}
                  disabled={updateCronogramaForLink.isPending}
                >
                  <div className="font-medium text-sm">{c.edital}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {c.materias?.length ? `${c.materias.length} matérias` : 'Ciclo vazio'} · {c.status === 'ativo' ? 'Ativo' : c.status}
                  </div>
                </button>
              ))}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLinkDialog(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowLinkDialog(false); openCreate(); }}>
              Criar Novo Cronograma
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create/Edit Modal */}
      <CronogramaForm
        open={isModalOpen}
        onOpenChange={(open) => { if (!open) closeModal(); }}
        onSubmit={handleFormSubmit}
        initialValues={editingCronograma}
        isSubmitting={isCreating || isUpdating}
        editalId={editalIdParam}
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
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isActive: boolean;
  onNavigate: (path: string) => void;
}

const CronogramaDetail: React.FC<CronogramaDetailProps> = ({
  cronograma,
  viewCycleOffset,
  onSetViewCycleOffset,
  getCycleInfo,
  onBack,
  onEdit,
  onDelete,
  isActive,
  onNavigate,
}) => {
  const [showMapaBanca, setShowMapaBanca] = useState(false);
  const [showImportEdital, setShowImportEdital] = useState(false);
  const [linkingEdital, setLinkingEdital] = useState(false);
  const updateCronograma = useUpdateCronograma();
  const editaisQuery = useEditaisList();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const n = cronograma.materias?.length || 0;
  const { cycleNumber: currentCycleNum, dayInCycle, totalDaysInCycle } = getCycleInfo(cronograma, today);
  const targetCycleNum = Math.max(1, currentCycleNum + viewCycleOffset);
  const isCurrentCycle = viewCycleOffset === 0;

  // Current index in the ring (0-based)
  const currentRingIndex = n > 0 ? (dayInCycle - 1) % n : 0;

  // When viewing a different cycle, compute that cycle's day-1 subject as the "highlighted" node
  const viewRingIndex = isCurrentCycle
    ? currentRingIndex
    : 0; // day 1 of the viewed cycle

  // Matéria name for ConteudoDoDia — only show for current cycle
  const todayMateriaRaw = isCurrentCycle && n > 0 ? cronograma.materias[currentRingIndex] : null;
  const todayMateriaName = todayMateriaRaw
    ? typeof todayMateriaRaw === 'string'
      ? todayMateriaRaw
      : todayMateriaRaw.nome
    : '';

  const handleLinkEdital = (editalId: string) => {
    const edital = editaisQuery.data?.find((e: any) => e.id === editalId);
    if (!edital) return;
    const editalMaterias: Array<{ nome: string }> = (edital as any).materias ?? [];
    const data: Record<string, unknown> = { edital_id: editalId };
    if (!cronograma.materias?.length && editalMaterias.length > 0) {
      data.materias = editalMaterias.map((m: { nome: string }) => ({ nome: m.nome }));
    }
    updateCronograma.mutate({ id: cronograma.id, data: data as Parameters<typeof updateCronograma.mutate>[0]['data'] });
    setLinkingEdital(false);
  };

  // Next matéria in the cycle — for "Adiantar" CTA (only relevant when > 1 subject)
  const nextMateriaRaw = n > 1 ? cronograma.materias[(currentRingIndex + 1) % n] : null;
  const nextMateriaName = nextMateriaRaw
    ? typeof nextMateriaRaw === 'string'
      ? nextMateriaRaw
      : nextMateriaRaw.nome
    : undefined;

  // Cycle date range for display
  const cycleStartDate = new Date(cronograma.data_inicio || cronograma.created);
  cycleStartDate.setHours(0, 0, 0, 0);
  cycleStartDate.setDate(cycleStartDate.getDate() + ((targetCycleNum - 1) * totalDaysInCycle));
  const cycleEndDate = new Date(cycleStartDate);
  cycleEndDate.setDate(cycleEndDate.getDate() + totalDaysInCycle - 1);

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
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
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

      {/* Linked Edital card */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Edital Verticalizado</p>
              <p className="text-sm font-medium">
                {cronograma.edital_id
                  ? (editaisQuery.data?.find((e: any) => e.id === cronograma.edital_id) as any)?.titulo ?? 'Edital vinculado'
                  : 'Nenhum edital vinculado'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!cronograma.edital_id && (editaisQuery.data?.length ?? 0) > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLinkingEdital((v) => !v)}
              >
                Vincular
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportEdital(true)}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Importar
            </Button>
            {cronograma.edital_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate(`/editais/${cronograma.edital_id}`)}
              >
                Ver Edital
              </Button>
            )}
          </div>
        </div>
        {linkingEdital && !cronograma.edital_id && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Selecione um edital para vincular e popular o ciclo:</p>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              defaultValue=""
              onChange={(e) => { if (e.target.value) handleLinkEdital(e.target.value); }}
            >
              <option value="" disabled>Escolher edital...</option>
              {editaisQuery.data?.map((e: any) => (
                <option key={e.id} value={e.id}>
                  {e.titulo}{e.cargo ? ` — ${e.cargo}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <ImportEditalSheet
        open={showImportEdital}
        onOpenChange={setShowImportEdital}
        onSuccess={(edital) => {
          const editalMaterias = (edital as any).materias ?? [];
          const data: Record<string, unknown> = { edital_id: edital.id };
          // Auto-populate cycle rotation from edital materias when cycle is empty
          if (!cronograma.materias?.length && editalMaterias.length > 0) {
            data.materias = editalMaterias.map((m: { nome: string }) => ({ nome: m.nome }));
          }
          updateCronograma.mutate({ id: cronograma.id, data: data as Parameters<typeof updateCronograma.mutate>[0]['data'] });
        }}
      />

      {/* Mapa da Banca card — only when banca is defined */}
      {cronograma.banca && cronograma.banca !== 'Sem preferência' && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0 mt-0.5">
                <Map className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold leading-tight">Mapa da Banca — {cronograma.banca}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Distribuição de matérias, pontos críticos e dicas estratégicas gerados por IA.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setShowMapaBanca(true)}
            >
              Ver perfil
            </Button>
          </div>
        </div>
      )}

      {/* Edital Verticalizado — shown when stored on the cronograma */}
      {cronograma.verticalizacao && (
        <EditalVerticalizadoView data={cronograma.verticalizacao} />
      )}

      {/* Cycle Card — Ring + Conteúdo do Dia */}
      {cronograma.materias && cronograma.materias.length > 0 && (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          {/* Cycle navigation header */}
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
                {cycleStartDate.toLocaleDateString('pt-BR')} –{' '}
                {cycleEndDate.toLocaleDateString('pt-BR')}
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

          {/* Ring + Conteúdo side by side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] divide-y lg:divide-y-0 lg:divide-x divide-border">
            {/* Left — cycle ring */}
            <div className="flex items-center justify-center p-6">
              <CycleRingView
                materias={cronograma.materias}
                currentIndex={viewRingIndex}
                cycleNumber={targetCycleNum}
                isCurrentCycle={isCurrentCycle}
              />
            </div>

            {/* Right — today's content */}
            <div className="p-6">
              {isCurrentCycle ? (
                <ConteudoDoDia
                  cronograma={cronograma}
                  materiaName={todayMateriaName}
                  nextMateria={nextMateriaName}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-8 text-center text-muted-foreground">
                  <ChevronLeft className="h-7 w-7 opacity-20" />
                  <p className="text-sm max-w-[220px]">
                    Navegue para o ciclo atual para ver o conteúdo do dia.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mapa da Banca Modal — outside any Dialog, no z-index conflicts */}
      {showMapaBanca && cronograma.banca && (
        <MapaBancaModal
          banca={cronograma.banca}
          onClose={() => setShowMapaBanca(false)}
        />
      )}
    </div>
  );
};

export default CronogramaPage;
