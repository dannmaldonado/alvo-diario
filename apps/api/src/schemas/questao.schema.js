/**
 * Questao (AI Question) validation schemas
 */

import { z } from 'zod';

export const gerarQuestoesSchema = z.object({
  sessao_id: z.string().uuid().optional().nullable(),
  materia: z.string().min(1, 'Matéria é obrigatória').max(200),
  banca: z.string().max(100).optional().nullable(),
  quantidade: z.number().int().min(3).max(10).default(5),
  dificuldade: z.enum(['facil', 'media', 'dificil']).default('media'),
});

export const responderQuestaoSchema = z.object({
  sessao_id: z.string().uuid().optional().nullable(),
  resposta: z.number().int().min(0).max(3),
  tempo_resposta_s: z.number().int().min(0).optional().nullable(),
});
