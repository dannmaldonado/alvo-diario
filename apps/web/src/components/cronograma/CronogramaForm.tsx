/**
 * CronogramaForm Component
 * Modal form for creating and editing cronogramas (study schedules).
 * Uses React Hook Form + Zod for validation with inline error display.
 */

import React, { useEffect } from 'react';
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
import { Sparkles } from 'lucide-react';

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
      materias: [],
      data_alvo: '',
      data_inicio: '',
    },
  });

  const watchedEdital = watch('edital');
  const watchedMaterias = watch('materias');

  // Reset form when modal opens/closes or initialValues change
  useEffect(() => {
    if (open) {
      if (initialValues) {
        reset({
          edital: initialValues.edital || '',
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

  const handleFormSubmit = (data: CronogramaFormData) => {
    onSubmit(data);
  };

  return (
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
  );
};

export default CronogramaForm;
