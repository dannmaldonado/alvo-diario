/**
 * Cronograma Form Validation Schemas (Frontend)
 * Uses Zod for type-safe form validation with React Hook Form
 */

import { z } from 'zod';

export const cronogramaFormSchema = z.object({
  edital: z
    .string()
    .min(1, 'Nome do edital e obrigatorio')
    .max(500, 'Maximo de 500 caracteres'),
  materias: z
    .array(z.string().min(1, 'Nome da materia e obrigatorio'))
    .min(1, 'Adicione pelo menos 1 materia'),
  data_alvo: z
    .string()
    .min(1, 'Data da prova e obrigatoria')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato invalido (YYYY-MM-DD)'),
  data_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato invalido (YYYY-MM-DD)')
    .optional()
    .or(z.literal('')),
});

export type CronogramaFormData = z.infer<typeof cronogramaFormSchema>;
