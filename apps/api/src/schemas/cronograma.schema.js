/**
 * Cronograma (Schedule) validation schemas
 */

import { z } from 'zod';

const materiaSchema = z.object({
  nome: z.string().min(1).max(200),
  status: z.enum(['nao_iniciada', 'em_progresso', 'concluida']).optional().default('nao_iniciada'),
  horas_dedicadas: z.number().min(0).optional(),
});

export const createCronogramaSchema = z.object({
  edital: z.string().min(1, 'Edital is required').max(500),
  data_alvo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'data_alvo must be YYYY-MM-DD format'),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'data_inicio must be YYYY-MM-DD format').optional().nullable(),
  materias: z.array(materiaSchema).min(1, 'At least one materia is required').max(50),
  status: z.enum(['ativo', 'concluido', 'pausado']).optional().default('ativo'),
});

export const updateCronogramaSchema = z.object({
  edital: z.string().min(1).max(500).optional(),
  data_alvo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  materias: z.array(materiaSchema).min(1).max(50).optional(),
  status: z.enum(['ativo', 'concluido', 'pausado']).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});
