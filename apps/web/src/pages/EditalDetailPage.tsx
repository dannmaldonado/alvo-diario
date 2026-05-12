/**
 * EditalDetailPage — Gamified checklist for a single edital
 *
 * Shows:
 *   - Overall progress bar (% topics studied)
 *   - Per-materia sections: question count, priority badge, per-topic progress bar
 *   - Checkable topics with optimistic UI
 *   - CTA: "Criar Cronograma" → /cronograma?edital_id=:id
 */

import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Circle,
  FileText,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useEditalDetail } from '@/hooks/queries/useEditais';
import { useMarcarTopico } from '@/hooks/queries/useEditais';
import type { EditalMateriaItem } from '@/types';

// ============================================================================
// HELPERS
// ============================================================================

function calcMateriaProgress(materia: EditalMateriaItem) {
  const total = materia.topicos.length;
  if (total === 0) return 0;
  const done = materia.topicos.filter(t => t.estudado).length;
  return Math.round((done / total) * 100);
}

function calcOverallProgress(materias: EditalMateriaItem[]) {
  let total = 0;
  let done = 0;
  materias.forEach(m => {
    m.topicos.forEach(t => {
      total++;
      if (t.estudado) done++;
    });
  });
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

const PRIORITY_CONFIG = {
  alta: { label: 'Alta', className: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  media: { label: 'Média', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  baixa: { label: 'Baixa', className: 'bg-slate-500/10 text-slate-500' },
} as const;

// ============================================================================
// MATERIA SECTION
// ============================================================================

interface MateriaSectionProps {
  materia: EditalMateriaItem;
  materiaIdx: number;
  editalId: string;
}

const MateriaSection: React.FC<MateriaSectionProps> = ({ materia, materiaIdx, editalId }) => {
  const marcarTopico = useMarcarTopico(editalId);
  const progress = calcMateriaProgress(materia);
  const doneCount = materia.topicos.filter(t => t.estudado).length;
  const prioConfig = PRIORITY_CONFIG[materia.prioridade] ?? PRIORITY_CONFIG.media;
  const isComplete = progress === 100;

  const handleToggle = (topicoIdx: number, estudado: boolean) => {
    marcarTopico.mutate({ materiaIdx, topicoIdx, estudado });
  };

  return (
    <div className={`rounded-2xl border bg-card shadow-sm transition-all ${isComplete ? 'border-emerald-500/30' : 'border-border'}`}>
      {/* Materia header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {isComplete ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
            )}
            <h3 className="font-semibold text-sm leading-snug truncate">{materia.nome}</h3>
          </div>
          <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0 ${prioConfig.className}`}>
            {prioConfig.label}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2 ml-6">
          {materia.questoes > 0 && (
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {materia.questoes} questões
            </span>
          )}
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {doneCount}/{materia.topicos.length} tópicos
          </span>
        </div>

        {/* Progress bar */}
        <div className="ml-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">Progresso</span>
            <span className={`text-[10px] font-bold ${isComplete ? 'text-emerald-500' : 'text-primary'}`}>
              {progress}%
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${isComplete ? 'bg-emerald-500' : 'bg-primary'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Topics list */}
      <div className="border-t border-border">
        {materia.topicos.map((topico, tIdx) => (
          <button
            key={tIdx}
            type="button"
            onClick={() => handleToggle(tIdx, !topico.estudado)}
            disabled={marcarTopico.isPending}
            className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50 ${tIdx < materia.topicos.length - 1 ? 'border-b border-border/50' : ''}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {topico.estudado ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40" />
              )}
            </div>
            <span className={`text-xs leading-relaxed ${topico.estudado ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {topico.nome}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE
// ============================================================================

const EditalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: edital, isLoading, error } = useEditalDetail(id);

  const overallProgress = useMemo(
    () => (edital ? calcOverallProgress(edital.materias) : 0),
    [edital]
  );

  const totalTopicos = useMemo(
    () => (edital ? edital.materias.reduce((acc, m) => acc + m.topicos.length, 0) : 0),
    [edital]
  );

  const doneTopicos = useMemo(
    () =>
      edital
        ? edital.materias.reduce((acc, m) => acc + m.topicos.filter(t => t.estudado).length, 0)
        : 0,
    [edital]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner text="Carregando edital..." />
      </div>
    );
  }

  if (error || !edital) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl text-center">
        <p className="text-muted-foreground mb-4">Edital não encontrado.</p>
        <Button variant="outline" onClick={() => navigate('/editais')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{edital.titulo} — Alvo Diário</title>
      </Helmet>

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-3xl">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate('/editais')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
        >
          <ArrowLeft className="h-4 w-4" />
          Meus Editais
        </button>

        {/* Hero card */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold leading-snug">{edital.titulo}</h1>
                {edital.cargo && (
                  <p className="text-sm text-muted-foreground mt-0.5">{edital.cargo}</p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {edital.banca && (
                    <span className="inline-flex text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">
                      {edital.banca}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              className="flex-shrink-0"
              onClick={() => navigate(`/cronograma?edital_id=${edital.id}`)}
            >
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              Cronograma
            </Button>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-4">
            {edital.total_questoes && (
              <span className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                {edital.total_questoes} questões no total
              </span>
            )}
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              {edital.materias.length} matérias
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {doneTopicos} de {totalTopicos} tópicos estudados
            </span>
          </div>

          {/* Overall progress */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium">Progresso geral</span>
              <span className={`text-sm font-bold ${overallProgress === 100 ? 'text-emerald-500' : 'text-primary'}`}>
                {overallProgress}%
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${overallProgress === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            {overallProgress === 100 && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 font-medium">
                🎉 Edital concluído! Todos os tópicos estudados.
              </p>
            )}
          </div>
        </div>

        {/* Materias checklist */}
        <div className="space-y-4">
          {edital.materias.map((materia, idx) => (
            <MateriaSection
              key={idx}
              materia={materia}
              materiaIdx={idx}
              editalId={edital.id}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        {edital.materias.length > 0 && (
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <Button
              size="lg"
              className="w-full max-w-sm"
              onClick={() => navigate(`/cronograma?edital_id=${edital.id}`)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Criar Cronograma com este Edital
            </Button>
            <p className="text-xs text-muted-foreground">
              O cronograma será gerado com base nas matérias deste edital verticalizado.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default EditalDetailPage;
