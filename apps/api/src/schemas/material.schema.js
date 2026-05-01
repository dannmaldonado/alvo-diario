/**
 * Material (Study Resource) validation schemas
 */

import { z } from 'zod';

const TIPOS_VALIDOS = ['curso_online', 'livro', 'apostila', 'outro'];

export const createMaterialSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(200),
  tipo: z.enum(['curso_online', 'livro', 'apostila', 'outro']).default('outro'),
  descricao: z.string().max(500).optional().nullable(),
});

export const updateMaterialSchema = z.object({
  nome: z.string().min(1).max(200).optional(),
  tipo: z.enum(['curso_online', 'livro', 'apostila', 'outro']).optional(),
  descricao: z.string().max(500).optional().nullable(),
  ativo: z.number().int().min(0).max(1).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});
