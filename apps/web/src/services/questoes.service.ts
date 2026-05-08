/**
 * Questoes Service — API calls for AI question generation and response tracking
 */

import { apiClient } from '@/services/api';
import type {
  Questao,
  RespostaQuestao,
  GerarQuestoesInput,
  ResponderQuestaoInput,
  AccuracyByMateria,
} from '@/types';

export const QuestoesService = {
  async gerar(params: GerarQuestoesInput): Promise<Questao[]> {
    return apiClient.post<Questao[]>('/api/questoes/gerar', params);
  },

  async getAll(materia?: string, limit?: number): Promise<Questao[]> {
    const params = new URLSearchParams();
    if (materia) params.set('materia', materia);
    if (limit) params.set('limit', String(limit));
    const qs = params.toString();
    return apiClient.get<Questao[]>(`/api/questoes${qs ? `?${qs}` : ''}`);
  },

  async getRevisao(): Promise<Questao[]> {
    return apiClient.get<Questao[]>('/api/questoes/revisao');
  },

  async getAnalytics(): Promise<AccuracyByMateria[]> {
    return apiClient.get<AccuracyByMateria[]>('/api/questoes/analytics');
  },

  async responder(questaoId: string, data: ResponderQuestaoInput): Promise<RespostaQuestao> {
    return apiClient.post<RespostaQuestao>(`/api/questoes/${questaoId}/resposta`, data);
  },
};
