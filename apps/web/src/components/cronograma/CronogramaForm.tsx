/**
 * CronogramaForm Component
 * Modal form for creating and editing cronogramas (study schedules).
 *
 * "Edital Foco" has three modes:
 *   myEdital  — selects from existing verticalized editais (auto-populates materias + banca)
 *   preset    — pre-defined concurso types (PC / PRF / PF) with subject templates
 *   custom    — free-text name, materias added manually
 */

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FormInput } from '@/components/FormInput';
import MateriasInput from '@/components/forms/MateriasInput';
import { cronogramaFormSchema, CronogramaFormData } from '@/schemas/cronograma';
import { Cronograma } from '@/types';
import { EDITAL_SUBJECTS } from '@/hooks/useCronogramaManager';
import { useEditaisList, useEditalDetail } from '@/hooks/queries/useEditais';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Loader2, Map, PenLine, Sparkles } from 'lucide-react';
import { EditalUpload } from '@/components/cronograma/EditalUpload';
import { MapaBancaModal } from '@/components/cronograma/MapaBancaModal';
import type { EditalVerticalizado } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

type EditalMode = 'myEdital' | 'preset' | 'custom';

interface CronogramaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CronogramaFormData, verticalizacao?: EditalVerticalizado | null, editalId?: string | null) => void;
  initialValues?: Cronograma | null;
  isSubmitting?: boolean;
  /** Pre-linked edital ID (from /editais/:id → "Criar Cronograma" flow) */
  editalId?: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PRESET_LABELS: Record<string, string> = {
  PC: 'Policia Civil (PC)',
  PRF: 'Policia Rodoviaria Federal (PRF)',
  PF: 'Policia Federal (PF)',
};

/** Detect which mode a given edital string came from */
function detectMode(edital: string | undefined, edital_id: string | null | undefined): EditalMode {
  if (edital_id) return 'myEdital';
  if (edital && EDITAL_SUBJECTS[edital] !== undefined) return 'preset';
  return 'custom';
}

// ============================================================================
// COMPONENT
// ============================================================================

const CronogramaForm: React.FC<CronogramaFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialValues,
  isSubmitting = false,
  editalId,
}) => {
  const isEdit = !!initialValues;

  // ---- mode state ----
  const [editalMode, setEditalMode] = useState<EditalMode>(editalId ? 'myEdital' : 'preset');
  const [selectedEditalId, setSelectedEditalId] = useState<string | null>(editalId || null);
  const [customEditalName, setCustomEditalName] = useState('');
  const [customNameError, setCustomNameError] = useState('');

  // ---- other state ----
  const [showMapaBanca, setShowMapaBanca] = useState(false);
  const [verticalizacao, setVerticalizacao] = useState<EditalVerticalizado | null>(null);

  // ---- data hooks ----
  const { data: editaisList, isLoading: editaisLoading } = useEditaisList();
  const { data: editalData } = useEditalDetail(selectedEditalId ?? undefined);

  // ---- RHF ----
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CronogramaFormData>({
    resolver: zodResolver(cronogramaFormSchema),
    defaultValues: { edital: '', banca: '', materias: [], data_alvo: '', data_inicio: '' },
  });

  const watchedEdital = watch('edital');
  const watchedBanca = watch('banca');
  const watchedMaterias = watch('materias');

  // ---- Auto-populate when edital data loads (myEdital mode) ----
  useEffect(() => {
    if (!editalData || editalMode !== 'myEdital') return;
    setValue('edital', editalData.titulo, { shouldValidate: true });
    if (editalData.banca) setValue('banca', editalData.banca, { shouldValidate: true });
    const nomes = editalData.materias.map((m) => m.nome);
    if (nomes.length > 0) setValue('materias', nomes, { shouldValidate: true });
  }, [editalData, editalMode, setValue]);

  // ---- Reset form when modal opens ----
  useEffect(() => {
    if (!open) return;

    setVerticalizacao(null);
    setCustomNameError('');

    if (editalId && !isEdit) {
      // Coming from EditalDetailPage → force myEdital mode, populate via hook
      setEditalMode('myEdital');
      setSelectedEditalId(editalId);
      reset({ edital: '', banca: '', materias: [], data_alvo: '', data_inicio: '' });
      return;
    }

    if (initialValues) {
      // Editing an existing cronograma — detect mode
      const mode = detectMode(initialValues.edital, initialValues.edital_id);
      setEditalMode(mode);
      setSelectedEditalId(initialValues.edital_id || null);
      if (mode === 'custom') setCustomEditalName(initialValues.edital || '');
      else setCustomEditalName('');

      reset({
        edital: mode !== 'custom' ? (initialValues.edital || '') : '',
        banca: initialValues.banca || '',
        materias: initialValues.materias?.map((m) => m.nome) || [],
        data_alvo: initialValues.data_alvo ? initialValues.data_alvo.split('T')[0] : '',
        data_inicio: initialValues.data_inicio ? initialValues.data_inicio.split('T')[0] : '',
      });
    } else {
      // Fresh create (no editalId) → preset mode
      setEditalMode('preset');
      setSelectedEditalId(null);
      setCustomEditalName('');
      reset({ edital: '', banca: '', materias: [], data_alvo: '', data_inicio: '' });
    }
  }, [open, initialValues, editalId, isEdit, reset]);

  // ---- Handlers ----

  const handleModeChange = (mode: EditalMode) => {
    setEditalMode(mode);
    // Clear mode-specific state
    if (mode !== 'myEdital') setSelectedEditalId(null);
    if (mode !== 'custom') setCustomEditalName('');
    setCustomNameError('');
    // Clear edital + materias when switching mode (avoid stale data)
    setValue('edital', '', { shouldValidate: false });
    setValue('materias', [], { shouldValidate: false });
  };

  const handleEditalSelect = (editalId: string) => {
    setSelectedEditalId(editalId);
    // Data will be fetched by useEditalDetail and populated via useEffect
  };

  const handleGenerateFromPreset = () => {
    const subjects = EDITAL_SUBJECTS[watchedEdital];
    if (subjects) setValue('materias', subjects, { shouldValidate: true });
  };

  const handleEditalImport = (materias: string[], banca?: string | null) => {
    const existing = watchedMaterias ?? [];
    const merged = Array.from(new Set([...existing, ...materias]));
    setValue('materias', merged, { shouldValidate: true });
    if (banca && (!watchedBanca || watchedBanca === 'none' || watchedBanca === '')) {
      setValue('banca', banca, { shouldValidate: true });
    }
  };

  const handleFormSubmit = (data: CronogramaFormData) => {
    if (editalMode === 'custom') {
      if (!customEditalName.trim()) {
        setCustomNameError('Digite o nome do concurso');
        return;
      }
      onSubmit({ ...data, edital: customEditalName.trim() }, verticalizacao, null);
      return;
    }
    onSubmit(data, verticalizacao, editalMode === 'myEdital' ? selectedEditalId : null);
  };

  // ============================================================================
  // RENDER — MODE SECTIONS
  // ============================================================================

  const renderEditalModeContent = () => {
    // ---- Meu Edital ----
    if (editalMode === 'myEdital') {
      return (
        <div className="space-y-2">
          {editaisLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando seus editais...
            </div>
          ) : !editaisList || editaisList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Nenhum edital verticalizado criado ainda.{' '}
              <a href="/editais" className="text-primary underline-offset-2 hover:underline">
                Criar edital
              </a>
            </div>
          ) : (
            <Select
              value={selectedEditalId || ''}
              onValueChange={handleEditalSelect}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um edital verticalizado" />
              </SelectTrigger>
              <SelectContent>
                {editaisList.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    <span className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      <span className="truncate">{e.titulo}</span>
                      {e.banca && (
                        <span className="ml-1 text-[10px] font-semibold text-primary opacity-70">
                          {e.banca}
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {selectedEditalId && editalData && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              ✓ {editalData.materias.length} matérias e banca preenchidas automaticamente
            </p>
          )}
          {selectedEditalId && !editalData && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Carregando dados do edital...
            </p>
          )}
        </div>
      );
    }

    // ---- Modelo ----
    if (editalMode === 'preset') {
      return (
        <div className="space-y-3">
          <Controller
            name="edital"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o concurso" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(PRESET_LABELS).map((key) => (
                    <SelectItem key={key} value={key}>
                      {PRESET_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.edital && (
            <p className="text-xs font-medium text-destructive">{errors.edital.message}</p>
          )}

          {/* Gerar matérias do modelo */}
          {watchedEdital && EDITAL_SUBJECTS[watchedEdital]?.length > 0 && watchedMaterias.length === 0 && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGenerateFromPreset}
              disabled={isSubmitting}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar Matérias do {watchedEdital}
            </Button>
          )}

          {/* PDF import */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Ou importe do PDF do edital:</p>
            <EditalUpload onImport={handleEditalImport} />
          </div>
        </div>
      );
    }

    // ---- Personalizado ----
    return (
      <div className="space-y-3">
        <div>
          <input
            type="text"
            value={customEditalName}
            onChange={(e) => {
              setCustomEditalName(e.target.value);
              setCustomNameError('');
              // Keep RHF edital field in sync so validation on the schema doesn't fail
              setValue('edital', e.target.value || 'CUSTOM', { shouldValidate: false });
            }}
            placeholder="Ex: Concurso TJ-SP 2026"
            disabled={isSubmitting}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          {customNameError && (
            <p className="mt-1 text-xs font-medium text-destructive">{customNameError}</p>
          )}
        </div>

        {/* PDF import */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Importe as matérias do PDF (opcional):</p>
          <EditalUpload onImport={handleEditalImport} />
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER — FULL FORM
  // ============================================================================

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {/* flex col so the body scrolls and the footer stays visible */}
        <DialogContent className="sm:max-w-lg flex flex-col max-h-[90dvh] p-0 gap-0">

          {/* Fixed header */}
          <DialogHeader className="px-5 pt-5 pb-3 flex-shrink-0 border-b border-border">
            <DialogTitle>{isEdit ? 'Editar Cronograma' : 'Novo Cronograma'}</DialogTitle>
            <DialogDescription className="text-xs mt-0.5">
              {isEdit
                ? 'Altere os dados do seu cronograma de estudos.'
                : 'Use um edital verticalizado, um modelo pré-definido, ou monte do zero.'}
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable body */}
          <form
            id="cronograma-form"
            onSubmit={handleSubmit(handleFormSubmit)}
            className="flex-1 overflow-y-auto px-5 py-4 space-y-5"
          >

            {/* ── Edital Foco ── */}
            <div className="space-y-3">
              <Label>
                Edital Foco <span className="text-destructive">*</span>
              </Label>

              {/* Mode toggle — grid so buttons are always equal width */}
              <div className="grid grid-cols-3 rounded-lg border border-border overflow-hidden text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => handleModeChange('myEdital')}
                  disabled={isSubmitting}
                  className={`flex items-center justify-center gap-1 py-2.5 px-1 transition-colors ${
                    editalMode === 'myEdital'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <FileText className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">Meu Edital</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('preset')}
                  disabled={isSubmitting}
                  className={`flex items-center justify-center gap-1 py-2.5 px-1 transition-colors border-x border-border ${
                    editalMode === 'preset'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <Sparkles className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">Modelo</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('custom')}
                  disabled={isSubmitting}
                  className={`flex items-center justify-center gap-1 py-2.5 px-1 transition-colors ${
                    editalMode === 'custom'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <PenLine className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">Personalizado</span>
                </button>
              </div>

              {/* Mode content */}
              {renderEditalModeContent()}
            </div>

            {/* ── Banca ── */}
            <div className="space-y-2">
              <Label htmlFor="banca">
                Banca Organizadora{' '}
                <span className="text-xs text-muted-foreground">(opcional — para questões no estilo certo)</span>
              </Label>
              <div className="flex gap-2">
                <Controller
                  name="banca"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || 'none'}
                      onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="banca" className="flex-1">
                        <SelectValue placeholder="Selecione a banca (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem preferência</SelectItem>
                        <SelectItem value="CESPE/Cebraspe">CESPE/Cebraspe</SelectItem>
                        <SelectItem value="FGV">FGV</SelectItem>
                        <SelectItem value="FUNDATEC">FUNDATEC</SelectItem>
                        <SelectItem value="VUNESP">VUNESP</SelectItem>
                        <SelectItem value="IBFC">IBFC</SelectItem>
                        <SelectItem value="AOCP">AOCP</SelectItem>
                        <SelectItem value="NC-UFPR">NC-UFPR</SelectItem>
                        <SelectItem value="FEPESE">FEPESE</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {watchedBanca && watchedBanca !== '' && watchedBanca !== 'none' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Ver Mapa da Banca"
                    onClick={() => setShowMapaBanca(true)}
                    className="flex-shrink-0"
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* ── Datas ── */}
            <FormInput
              label="Data de Inicio dos Estudos"
              type="date"
              {...register('data_inicio')}
              error={errors.data_inicio?.message}
              hint="Quando voce vai comecar a estudar"
              disabled={isSubmitting}
            />
            <FormInput
              label="Data Prevista da Prova"
              type="date"
              {...register('data_alvo')}
              error={errors.data_alvo?.message}
              required
              disabled={isSubmitting}
            />

            {/* ── Matérias ── */}
            <div className="space-y-2">
              <Label>
                Matérias do Ciclo <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="materias"
                control={control}
                render={({ field }) => (
                  <MateriasInput
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.materias?.message}
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>

          {/* bottom spacer so last field isn't hidden under sticky footer */}
          <div className="h-2" />
          </form>

          {/* Sticky footer — always visible, not inside scroll area */}
          <div className="flex gap-3 px-5 py-4 border-t border-border flex-shrink-0 bg-background">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="cronograma-form"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Cronograma'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mapa da Banca Modal — outside Dialog to avoid stacking context issues */}
      {showMapaBanca && watchedBanca && (
        <MapaBancaModal banca={watchedBanca} onClose={() => setShowMapaBanca(false)} />
      )}
    </>
  );
};

export default CronogramaForm;
