/**
 * ConteudoDoDia
 * Shows the edital topics for today's matéria with persisted progress (topico_progresso).
 * Supports multi-pass ("batida") tracking and optional question logging per topic.
 */

import React, { useState } from 'react';
import {
  CheckCircle2, BookOpen, FileText, ChevronRight,
  RefreshCw, Loader2, BookMarked,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEditalDetail } from '@/hooks/queries/useEditais';
import { useTopicoProgresso, usePatchTopicoProgresso } from '@/hooks/queries/useTopicoProgresso';
import type { Cronograma, EditalMateriaItem, EditalTopicoItem } from '@/types';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES / HELPERS
// ============================================================================

interface ConteudoDoDiaProps {
  cronograma: Cronograma;
  materiaName: string;
  nextMateria?: string;
}

function findEditalMateria(nome: string, materias: EditalMateriaItem[]): EditalMateriaItem | undefined {
  const lower = nome.toLowerCase();
  return materias.find(
    (m) => m.nome.toLowerCase().includes(lower) || lower.includes(m.nome.toLowerCase())
  );
}

// ============================================================================
// MINI FORM: optional question log when marking a topic done
// ============================================================================

interface QuestaoLogFormProps {
  topicoNome: string;
  onSave: (total: number | undefined, acertos: number | undefined) => void;
  onSkip: () => void;
}

function QuestaoLogForm({ topicoNome, onSave, onSkip }: QuestaoLogFormProps) {
  const [total, setTotal] = useState('');
  const [acertos, setAcertos] = useState('');

  const handleSave = () => {
    const t = total ? parseInt(total) : undefined;
    const a = acertos ? parseInt(acertos) : undefined;
    onSave(t, a);
  };

  return (
    <div className="rounded-xl border bg-muted/30 px-3.5 py-3 space-y-2.5">
      <p className="text-xs font-semibold text-foreground/80 leading-snug">
        Fez questões sobre <span className="text-foreground">"{topicoNome}"</span>?
      </p>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-muted-foreground mb-1 block">Total</label>
          <input
            type="number"
            min="0"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            placeholder="0"
            className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-muted-foreground mb-1 block">Acertos</label>
          <input
            type="number"
            min="0"
            value={acertos}
            onChange={(e) => setAcertos(e.target.value)}
            placeholder="0"
            className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Pular
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
        >
          Salvar
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConteudoDoDia({ cronograma, materiaName, nextMateria }: ConteudoDoDiaProps) {
  const navigate = useNavigate();
  const editalId = cronograma.edital_id ?? undefined;
  const { data: edital, isLoading: editalLoading } = useEditalDetail(editalId);
  const { data: progresso, isLoading: progressoLoading } = useTopicoProgresso(editalId, materiaName);
  const patchMutation = usePatchTopicoProgresso();

  // Which topic is showing the optional question form
  const [pendingQuestaoTopico, setPendingQuestaoTopico] = useState<string | null>(null);
  // Nova batida banner shown after reset
  const [novaBatidaShown, setNovaBatidaShown] = useState(false);

  // ---- No edital linked ----
  if (!editalId) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-muted-foreground">
        <FileText className="h-8 w-8 opacity-30" />
        <p className="text-sm max-w-[240px]">
          Vincule um edital ao cronograma para ver o conteúdo do dia.
        </p>
      </div>
    );
  }

  if (editalLoading || progressoLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

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
        <p className="text-xs opacity-70">Verifique se os nomes batem com os do edital.</p>
      </div>
    );
  }

  const topicos: EditalTopicoItem[] = editalMateria.topicos ?? [];
  const totalTopicos = topicos.length;

  // Build progress map from API data
  const progressMap: Record<string, boolean> = {};
  const batidaAtual = progresso?.batida_atual ?? 1;
  for (const row of progresso?.topicos ?? []) {
    if (row.batida === batidaAtual) {
      progressMap[row.topico_nome] = !!row.concluido_em;
    }
  }

  const totalChecked = topicos.filter((t) => progressMap[t.nome]).length;
  const allDone = totalTopicos > 0 && totalChecked >= totalTopicos;
  const progressPct = totalTopicos > 0 ? Math.round((totalChecked / totalTopicos) * 100) : 0;

  // First uncompleted topic = "current" (highlighted)
  const currentTopicoNome = topicos.find((t) => !progressMap[t.nome])?.nome;

  const handleToggle = async (topico: EditalTopicoItem) => {
    if (patchMutation.isPending) return;
    const isNowDone = !progressMap[topico.nome];

    if (isNowDone) {
      // Show question log form before persisting
      setPendingQuestaoTopico(topico.nome);
    } else {
      // Uncheck immediately
      await patchMutation.mutateAsync({
        edital_id: editalId!,
        materia_nome: materiaName,
        topico_nome: topico.nome,
        concluido: false,
      });
    }
  };

  const handleQuestaoSave = async (total: number | undefined, acertos: number | undefined) => {
    if (!pendingQuestaoTopico) return;
    const result = await patchMutation.mutateAsync({
      edital_id: editalId!,
      materia_nome: materiaName,
      topico_nome: pendingQuestaoTopico,
      concluido: true,
      questoes_total: total,
      questoes_acertos: acertos,
    });
    setPendingQuestaoTopico(null);
    if (result.nova_batida) setNovaBatidaShown(true);
  };

  const handleQuestaoSkip = async () => {
    if (!pendingQuestaoTopico) return;
    const result = await patchMutation.mutateAsync({
      edital_id: editalId!,
      materia_nome: materiaName,
      topico_nome: pendingQuestaoTopico,
      concluido: true,
    });
    setPendingQuestaoTopico(null);
    if (result.nova_batida) setNovaBatidaShown(true);
  };

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
        <div className="flex items-center gap-2 shrink-0">
          {batidaAtual > 1 && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              <RefreshCw className="h-2.5 w-2.5" />
              Batida {batidaAtual}
            </span>
          )}
          <span
            className={cn(
              'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
              editalMateria.prioridade === 'alta'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : editalMateria.prioridade === 'media'
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-muted text-muted-foreground'
            )}
          >
            {editalMateria.prioridade}
          </span>
        </div>
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

      {/* Nova batida banner */}
      {novaBatidaShown && (
        <div className="rounded-xl bg-primary/10 border border-primary/20 px-3.5 py-3 flex items-start gap-2.5">
          <BookMarked className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-primary">Segunda batida iniciada!</p>
            <p className="text-xs text-primary/70 mt-0.5">
              Você zerou todos os tópicos. O ciclo começa novamente — desta vez você já conhece o conteúdo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNovaBatidaShown(false)}
            className="ml-auto text-primary/50 hover:text-primary transition-colors"
          >
            <span className="sr-only">Fechar</span>×
          </button>
        </div>
      )}

      {/* All done banner */}
      {allDone && !novaBatidaShown && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-3 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                Assunto concluído!
              </p>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">
                Você marcou todos os tópicos. Revise ou avance para o próximo assunto.
              </p>
            </div>
          </div>
          {nextMateria && nextMateria !== materiaName && (
            <button
              type="button"
              onClick={() => navigate(`/sessao?subject=${encodeURIComponent(nextMateria)}`)}
              className="w-full flex items-center justify-between gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-sm font-semibold transition-colors"
            >
              <span>Adiantar: {nextMateria}</span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </button>
          )}
        </div>
      )}

      {/* Question log form (shown when marking a topic done) */}
      {pendingQuestaoTopico && (
        <QuestaoLogForm
          topicoNome={pendingQuestaoTopico}
          onSave={handleQuestaoSave}
          onSkip={handleQuestaoSkip}
        />
      )}

      {/* Topic list */}
      {topicos.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          Nenhum tópico detalhado disponível para esta matéria no edital.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {topicos.map((topico) => {
            const isChecked = !!progressMap[topico.nome];
            const isCurrent = topico.nome === currentTopicoNome;
            const isSaving = patchMutation.isPending && pendingQuestaoTopico === topico.nome;

            return (
              <li key={topico.nome}>
                <button
                  type="button"
                  onClick={() => handleToggle(topico)}
                  disabled={patchMutation.isPending}
                  className={cn(
                    'w-full flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors',
                    isChecked
                      ? 'bg-emerald-500/8 hover:bg-emerald-500/12'
                      : isCurrent
                        ? 'bg-primary/5 border border-primary/20 hover:bg-primary/10'
                        : 'hover:bg-muted/60'
                  )}
                >
                  {/* Checkbox */}
                  <div
                    className={cn(
                      'mt-0.5 h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors',
                      isChecked
                        ? 'bg-emerald-500 border-emerald-500'
                        : isCurrent
                          ? 'border-primary/50 bg-background'
                          : 'border-border bg-background'
                    )}
                  >
                    {isSaving ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin text-muted-foreground" />
                    ) : isChecked ? (
                      <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </div>

                  {/* Topic name */}
                  <span
                    className={cn(
                      'text-sm leading-snug transition-colors flex-1',
                      isChecked
                        ? 'line-through text-muted-foreground'
                        : isCurrent
                          ? 'text-foreground font-medium'
                          : 'text-foreground'
                    )}
                  >
                    {topico.nome}
                    {isCurrent && (
                      <span className="ml-1.5 text-[10px] font-semibold text-primary/70 uppercase tracking-wide">
                        atual
                      </span>
                    )}
                  </span>

                  {/* Question performance badge (if recorded) */}
                  {isChecked && (() => {
                    const row = progresso?.topicos.find(
                      (r) => r.topico_nome === topico.nome && r.batida === batidaAtual
                    );
                    if (!row?.questoes_total) return null;
                    const pct = Math.round((row.questoes_acertos! / row.questoes_total) * 100);
                    return (
                      <span className={cn(
                        'text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0',
                        pct >= 70
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      )}>
                        {pct}%
                      </span>
                    );
                  })()}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default ConteudoDoDia;
