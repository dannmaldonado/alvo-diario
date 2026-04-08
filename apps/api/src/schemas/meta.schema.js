/**
 * Meta (Daily Goal) validation schemas
 */

import { z } from 'zod';

export const createMetaSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'data must be YYYY-MM-DD format'),
  horas_meta: z.number().min(0.5, 'Meta must be at least 0.5 hours').max(24, 'Meta cannot exceed 24 hours'),
  status: z.enum(['nao_iniciada', 'em_progresso', 'concluida']).optional().default('nao_iniciada'),
});

export const updateMetaSchema = z.object({
  horas_meta: z.number().min(0.5).max(24).optional(),
  horas_realizadas: z.number().min(0).max(24).optional(),
  status: z.enum(['nao_iniciada', 'em_progresso', 'concluida']).optional(),
  avaliacao_diaria: z.number().int().min(1).max(5).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});
