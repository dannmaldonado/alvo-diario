/**
 * MapaBancaModal — AI-generated strategic profile for a banca
 * Shows subject distribution, question style, tips and critical points.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Map, Loader2, TrendingUp, AlertTriangle, Lightbulb, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditalService } from '@/services/edital.service';
import type { MapaBanca } from '@/types';

interface MapaBancaModalProps {
  banca: string;
  onClose: () => void;
}

function DistribuicaoBar({ area, peso, dica }: { area: string; peso: number; dica: string }) {
  const color = peso >= 20 ? 'bg-primary' : peso >= 10 ? 'bg-amber-500' : 'bg-muted-foreground';
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium truncate mr-2">{area}</span>
        <span className="text-sm font-bold text-muted-foreground flex-shrink-0">{peso}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-1">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${peso}%` }}
        />
      </div>
      {dica && (
        <p className="text-xs text-muted-foreground leading-snug hidden group-hover:block">{dica}</p>
      )}
    </div>
  );
}

export function MapaBancaModal({ banca, onClose }: MapaBancaModalProps) {
  const { data, isLoading, error } = useQuery<MapaBanca>({
    queryKey: ['mapa-banca', banca],
    queryFn: () => EditalService.getMapaBanca(banca),
    staleTime: 24 * 60 * 60 * 1000, // 24h — banca profiles don't change
  });

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-lg">Mapa da Banca — {banca}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Analisando perfil da banca com IA...</p>
              <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <p className="text-sm font-medium">Não foi possível gerar o mapa da banca.</p>
              {(error as Error).message?.includes('não configurado') || (error as Error).message?.includes('503') ? (
                <p className="text-xs text-muted-foreground max-w-sm">
                  O serviço de IA não está configurado no servidor. Configure a variável{' '}
                  <code className="font-mono bg-muted px-1 rounded">ANTHROPIC_API_KEY</code>{' '}
                  no painel do servidor e reinicie a aplicação.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground max-w-sm">
                  {(error as Error).message || 'Erro interno. Tente novamente em alguns instantes.'}
                </p>
              )}
            </div>
          )}

          {data && (
            <>
              {/* Perfil */}
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                <p className="text-sm leading-relaxed">{data.perfil}</p>
                <p className="text-xs text-muted-foreground mt-2 italic">{data.estilo_questoes}</p>
              </div>

              {/* Distribuição por área */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Distribuição por Área</h3>
                  <span className="text-xs text-muted-foreground">(passe o mouse para ver a dica)</span>
                </div>
                <div className="space-y-3">
                  {data.distribuicao
                    .sort((a, b) => b.peso - a.peso)
                    .map(item => (
                      <DistribuicaoBar key={item.area} {...item} />
                    ))}
                </div>
              </div>

              {/* Pontos críticos */}
              {data.pontos_criticos?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <h3 className="font-semibold text-sm">Pontos Críticos</h3>
                  </div>
                  <ul className="space-y-2">
                    {data.pontos_criticos.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="flex-shrink-0 mt-0.5 h-4 w-4 rounded-full bg-amber-500/20 text-amber-600 text-xs flex items-center justify-center font-bold">!</span>
                        <span className="text-muted-foreground">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Dicas estratégicas */}
              {data.dicas_estrategicas?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-emerald-500" />
                    <h3 className="font-semibold text-sm">Dicas Estratégicas</h3>
                  </div>
                  <ul className="space-y-2">
                    {data.dicas_estrategicas.map((dica, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{dica}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.cached && (
                <p className="text-xs text-center text-muted-foreground">
                  Análise em cache — atualizada automaticamente periodicamente.
                </p>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t flex justify-end">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  );
}

export default MapaBancaModal;
