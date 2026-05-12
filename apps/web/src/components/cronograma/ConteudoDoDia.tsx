/**
 * ConteudoDoDia
 * Shows the edital topics for today's matéria, with local checkbox state.
 * When all topics are checked → shows a "Revisão recomendada" banner.
 * Requires cronograma.edital_id to be set; otherwise shows a subtle prompt.
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle2, BookOpen, RotateCcw, FileText } from 'lucide-react';
import { useEditalDetail } from '@/hooks/queries/useEditais';
import type { Cronograma, EditalMateriaItem, EditalTopicoItem } from '@/types';

interface ConteudoDoDiaProps {
  cronograma: Cronograma;
  /** Name of today's matéria (from the cycle) */
  materiaName: string;
}

/** Case-insensitive substring match between cronograma matéria and edital matéria */
function findEditalMateria(
  nome: string,
  materias: EditalMateriaItem[]
): EditalMateriaItem | undefined {
  const lower = nome.toLowerCase();
  return materias.find(
    (m) => m.nome.toLowerCase().includes(lower) || lower.includes(m.nome.toLowerCase())
  );
}

export function ConteudoDoDia({ cronograma, materiaName }: ConteudoDoDiaProps) {
  const editalId = cronograma.edital_id ?? undefined;
  const { data: edital, isLoading } = useEditalDetail(editalId);

  // Local checkbox state — keyed by topic nome
  const [checked, setChecked] = useState<Set<string>>(new Set());

  // Reset checkboxes when matéria changes
  useEffect(() => {
    setChecked(new Set());
  }, [materiaName]);

  const toggleTopico = (nome: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(nome)) next.delete(nome);
      else next.add(nome);
      return next;
    });
  };

  // ---- No edital linked ----
  if (!editalId) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-muted-foreground">
        <FileText className="h-8 w-8 opacity-30" />
        <p className="text-sm max-w-[240px]">
          Vincule um edital verticalizado ao cronograma para ver o conteúdo do dia.
        </p>
      </div>
    );
  }

  // ---- Loading ----
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // ---- Edital loaded but matéria not matched ----
  if (!edital) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
        <BookOpen className="h-7 w-7 opacity-30" />
        <p className="text-sm">Edital não encontrado.</p>
      </div>
    );
  }

  const editalMateria = findEditalMateria(materiaName, edital.materias);

  if (!editalMateria) {
    return (
      <div className="flex flex-col gap-2 py-6 text-center text-muted-foreground">
        <BookOpen className="mx-auto h-7 w-7 opacity-30" />
        <p className="text-sm">
          Matéria <span className="font-medium text-foreground">"{materiaName}"</span> não
          encontrada no edital vinculado.
        </p>
        <p className="text-xs opacity-70">
          Verifique se os nomes batem com os do edital.
        </p>
      </div>
    );
  }

  const topicos: EditalTopicoItem[] = editalMateria.topicos ?? [];
  const totalTopicos = topicos.length;
  const totalChecked = checked.size;
  const allDone = totalTopicos > 0 && totalChecked >= totalTopicos;
  const progressPct = totalTopicos > 0 ? Math.round((totalChecked / totalTopicos) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
            Conteúdo do Dia
          </p>
          <h3 className="font-bold text-base leading-tight">{editalMateria.nome}</h3>
          {editalMateria.questoes != null && (
            <p className="text-xs text-muted-foreground mt-0.5">
              ~{editalMateria.questoes} questões estimadas
            </p>
          )}
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
            editalMateria.prioridade === 'alta'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : editalMateria.prioridade === 'media'
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-muted text-muted-foreground'
          }`}
        >
          {editalMateria.prioridade}
        </span>
      </div>

      {/* Progress bar */}
      {totalTopicos > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{totalChecked} / {totalTopicos} tópicos</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* All done banner */}
      {allDone && (
        <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-3">
          <RotateCcw className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              Revisão recomendada!
            </p>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">
              Você concluiu todos os tópicos. Faça questões ou releia os pontos críticos antes de avançar.
            </p>
          </div>
        </div>
      )}

      {/* Topic list */}
      {topicos.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          Nenhum tópico detalhado disponível para esta matéria no edital.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {topicos.map((topico) => {
            const isChecked = checked.has(topico.nome);
            return (
              <li key={topico.nome}>
                <button
                  type="button"
                  onClick={() => toggleTopico(topico.nome)}
                  className={`w-full flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    isChecked
                      ? 'bg-emerald-500/8 hover:bg-emerald-500/12'
                      : 'hover:bg-muted/60'
                  }`}
                >
                  {/* Checkbox */}
                  <div
                    className={`mt-0.5 h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                      isChecked
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-border bg-background'
                    }`}
                  >
                    {isChecked && (
                      <svg
                        className="h-2.5 w-2.5 text-white"
                        viewBox="0 0 10 10"
                        fill="none"
                      >
                        <path
                          d="M1.5 5L4 7.5L8.5 2.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Topic name */}
                  <span
                    className={`text-sm leading-snug transition-colors ${
                      isChecked
                        ? 'line-through text-muted-foreground'
                        : 'text-foreground'
                    }`}
                  >
                    {topico.nome}
                  </span>

                  {/* Estudado badge from edital data */}
                  {topico.estudado && !isChecked && (
                    <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Reset button */}
      {totalChecked > 0 && (
        <button
          type="button"
          onClick={() => setChecked(new Set())}
          className="self-start text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <RotateCcw className="h-3 w-3" />
          Limpar seleção
        </button>
      )}
    </div>
  );
}

export default ConteudoDoDia;
