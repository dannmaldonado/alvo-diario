/**
 * Edital Service — PDF upload + subject extraction
 */

import type { EditalParseResult, MapaBanca } from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export const EditalService = {
  /** Upload PDF edital and extract subjects via Claude AI */
  parse: async (file: File): Promise<EditalParseResult> => {
    const formData = new FormData();
    formData.append('edital', file);

    const res = await fetch(`${BASE_URL}/api/edital/parse`, {
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
  getMapaBanca: async (banca: string): Promise<MapaBanca> => {
    const res = await fetch(
      `${BASE_URL}/api/questoes/mapa-banca?banca=${encodeURIComponent(banca)}`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao buscar mapa da banca.' }));
      throw new Error(err.error || `Erro ${res.status}`);
    }

    return res.json();
  },
};
