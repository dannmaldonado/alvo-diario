/**
 * Questao (Question) Zod schemas for validation
 */

import { z } from 'zod';

export const gerarQuestoesSchema = z.object({
  sessao_id: z.string().uuid().optional(),
  materia: z.string().min(1, 'Matéria é obrigatória').max(200),
  banca: z.string().max(100).optional(),
  quantidade: z.number().int().min(3).max(10).default(5),
  dificuldade: z.enum(['facil', 'media', 'dificil']).default('media'),
});

export const responderQuestaoSchema = z.object({
  sessao_id: z.string().uuid().optional(),
  resposta: z.number().int().min(0).max(3),
  tempo_resposta_s: z.number().int().optional(),
});

export default {
  gerarQuestoesSchema,
  responderQuestaoSchema,
};
