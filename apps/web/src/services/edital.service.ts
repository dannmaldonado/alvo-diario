/**
 * Edital Service — PDF upload + subject extraction
 */

import { apiClient } from '@/services/api';
import type { EditalParseResult, MapaBanca } from '@/types';

// Used only for multipart/form-data (PDF upload) — apiClient sets Content-Type: application/json
// which is incompatible with file uploads, so we use raw fetch for the parse endpoint.
const API_BASE_URL = import.meta.env.PROD
  ? ''
  : (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001';

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export const EditalService = {
  /** Upload PDF edital and extract subjects via Claude AI */
  parse: async (file: File): Promise<EditalParseResult> => {
    const formData = new FormData();
    formData.append('edital', file);

    const res = await fetch(`${API_BASE_URL}/api/edital/parse`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        // Note: DO NOT set Content-Type — browser sets it with boundary for multipart/form-data
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao processar edital.' }));
      throw new Error(err.error || `Erro ${res.status}`);
    }

    return res.json();
  },

  /** Get AI-generated banca profile (cached per banca) */
  getMapaBanca: async (banca: string): Promise<MapaBanca> =>
    apiClient.get<MapaBanca>(`/api/questoes/mapa-banca?banca=${encodeURIComponent(banca)}`),
};
