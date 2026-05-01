/**
 * Sessao (Study Session) validation schemas
 */

import { z } from 'zod';

export const createSessaoSchema = z.object({
  cronograma_id: z.string().uuid().optional().nullable(),
  materia: z.string().min(1, 'Materia is required').max(200),
  data_sessao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'data_sessao must be YYYY-MM-DD format'),
  duracao_minutos: z.number().int().min(1, 'Duration must be at least 1 minute').max(1440, 'Duration cannot exceed 24 hours'),
  notas: z.string().max(500).optional().nullable(),
  material_id: z.string().uuid().optional().nullable(),
  material_nome: z.string().max(200).optional().nullable(),
});

export const updateSessaoSchema = z.object({
  materia: z.string().min(1).max(200).optional(),
  data_sessao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  duracao_minutos: z.number().int().min(1).max(1440).optional(),
  pontos_ganhos: z.number().int().min(0).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});
