/**
 * CronogramaForm Component
 * Modal form for creating and editing cronogramas (study schedules).
 * Uses React Hook Form + Zod for validation with inline error display.
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Map } from 'lucide-react';
import { EditalUpload } from '@/components/cronograma/EditalUpload';
import { MapaBancaModal } from '@/components/cronograma/MapaBancaModal';

interface CronogramaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CronogramaFormData) => void;
  initialValues?: Cronograma | null;
  isSubmitting?: boolean;
}

const EDITAL_LABELS: Record<string, string> = {
  PC: 'Policia Civil (PC)',
  PRF: 'Policia Rodoviaria Federal (PRF)',
  PF: 'Policia Federal (PF)',
  PERSONALIZADO: 'Personalizado',
};

const CronogramaForm: React.FC<CronogramaFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialValues,
  isSubmitting = false,
}) => {
  const isEdit = !!initialValues;
  const [showMapaBanca, setShowMapaBanca] = useState(false);

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
    defaultValues: {
      edital: '',
      banca: '',
      materias: [],
      data_alvo: '',
      data_inicio: '',
    },
  });

  const watchedEdital = watch('edital');
  const watchedBanca = watch('banca');
  const watchedMaterias = watch('materias');

  // Reset form when modal opens/closes or initialValues change
  useEffect(() => {
    if (open) {
      if (initialValues) {
        reset({
          edital: initialValues.edital || '',
          banca: initialValues.banca || '',
          materias: initialValues.materias?.map((m) => m.nome) || [],
          data_alvo: initialValues.data_alvo
            ? initialValues.data_alvo.split('T')[0]
            : '',
          data_inicio: initialValues.data_inicio
            ? initialValues.data_inicio.split('T')[0]
            : '',
        });
      } else {
        reset({
          edital: '',
          banca: '',
          materias: [],
          data_alvo: '',
          data_inicio: '',
        });
      }
    }
  }, [open, initialValues, reset]);

  const handleGenerateFromEdital = () => {
    const subjects = EDITAL_SUBJECTS[watchedEdital];
    if (subjects) {
      setValue('materias', subjects, { shouldValidate: true });
    }
  };

  const handleEditalImport = (materias: string[], banca?: string | null) => {
    // Merge with existing materias (deduplicate)
    const existing = watchedMaterias ?? [];
    const merged = Array.from(new Set([...existing, ...materias]));
    setValue('materias', merged, { shouldValidate: true });
    if (banca && !watchedBanca) {
      setValue('banca', banca, { shouldValidate: true });
    }
  };

  const handleFormSubmit = (data: CronogramaFormData) => {
    onSubmit(data);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="">
          <DialogTitle>
            {isEdit ? 'Editar Cronograma' : 'Novo Cronograma'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Altere os dados do seu cronograma de estudos.'
              : 'Configure seu edital e materias para criar um novo ciclo de estudos.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-5 mt-2"
        >
          {/* Edital */}
          <div className="space-y-2">
            <Label htmlFor="edital">
              Edital Foco <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="edital"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="edital" className="w-full">
                    <SelectValue placeholder="Selecione um edital" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(EDITAL_SUBJECTS).map((key) => (
                      <SelectItem key={key} value={key}>
                        {EDITAL_LABELS[key] || key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.edital && (
              <p className="text-xs font-medium text-destructive animate-slide-down">
                {errors.edital.message}
              </p>
            )}
          </div>

          {/* Banca */}
          <div className="space-y-2">
            <Label htmlFor="banca">
              Banca Organizadora <span className="text-xs text-muted-foreground">(opcional — para questoes no estilo certo)</span>
            </Label>
            <div className="flex gap-2">
              <Controller
                name="banca"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ''}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="banca" className="flex-1">
                      <SelectValue placeholder="Selecione a banca (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sem preferência</SelectItem>
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
              {/* Mapa da Banca button — only shown when a banca is selected */}
              {watchedBanca && watchedBanca !== '' && (
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

          {/* Edital Upload — PDF parsing via Claude AI */}
          <div className="space-y-2">
            <Label className="text-sm">Importar Matérias do Edital (PDF)</Label>
            <EditalUpload onImport={handleEditalImport} />
          </div>

          {/* Data Inicio */}
          <FormInput
            label="Data de Inicio dos Estudos"
            type="date"
            {...register('data_inicio')}
            error={errors.data_inicio?.message}
            hint="Quando voce vai comecar a estudar"
            disabled={isSubmitting}
          />

          {/* Data Alvo */}
          <FormInput
            label="Data Prevista da Prova"
            type="date"
            {...register('data_alvo')}
            error={errors.data_alvo?.message}
            required
            disabled={isSubmitting}
          />

          {/* Generate from edital button — hidden for PERSONALIZADO (user adds manually) */}
          {watchedEdital &&
            watchedEdital !== 'PERSONALIZADO' &&
            EDITAL_SUBJECTS[watchedEdital]?.length > 0 &&
            watchedMaterias.length === 0 && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGenerateFromEdital}
                disabled={isSubmitting}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar Materias do {watchedEdital}
              </Button>
            )}

          {/* Materias */}
          <div className="space-y-2">
            <Label>
              Materias do Ciclo <span className="text-destructive">*</span>
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

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting
                ? 'Salvando...'
                : isEdit
                  ? 'Salvar Alteracoes'
                  : 'Criar Cronograma'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Mapa da Banca Modal — rendered outside Dialog to avoid stacking context issues */}
    {showMapaBanca && watchedBanca && (
      <MapaBancaModal
        banca={watchedBanca}
        onClose={() => setShowMapaBanca(false)}
      />
    )}
    </>
  );
};

export default CronogramaForm;
