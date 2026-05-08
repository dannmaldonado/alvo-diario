/**
 * RevisaoPage — Spaced repetition review queue
 * Shows questions due today and runs them through the SM-2 quiz interface
 */

import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Brain, CheckCircle2, XCircle, ChevronRight, Trophy, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useQuestoesRevisao, useResponderQuestao } from '@/hooks/queries/useQuestoes';
import type { Questao } from '@/types';
import { cn } from '@/lib/utils';

// ============================================================================
// QUESTION CARD
// ============================================================================

interface ReviewQuestionProps {
  questao: Questao;
  index: number;
  total: number;
  onAnswer: (opcaoIdx: number, correta: boolean) => void;
  isSaving: boolean;
}

const ReviewQuestion: React.FC<ReviewQuestionProps> = ({ questao, index, total, onAnswer, isSaving }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const isCorrect = selected === questao.resposta_correta;

  return (
    <div className="flex flex-col gap-5">
      {/* Meta info */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
          {index + 1}/{total}
        </span>
        <span>{questao.materia}</span>
        {questao.banca && <span>· {questao.banca}</span>}
        <span className={cn(
          'ml-auto px-2 py-0.5 rounded-full font-medium',
          questao.dificuldade === 'facil' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
          questao.dificuldade === 'media' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
          questao.dificuldade === 'dificil' && 'bg-red-500/10 text-red-600 dark:text-red-400',
        )}>
          {questao.dificuldade === 'facil' ? 'Fácil' : questao.dificuldade === 'media' ? 'Médio' : 'Difícil'}
        </span>
      </div>

      {/* Enunciado */}
      <p className="text-base font-medium leading-relaxed">{questao.enunciado}</p>

      {/* Opcoes */}
      <div className="flex flex-col gap-2">
        {questao.opcoes.map((opcao, idx) => {
          let cls = '';
          if (!confirmed) {
            cls = selected === idx
              ? 'border-primary bg-primary/10 font-medium'
              : 'border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer';
          } else {
            if (idx === questao.resposta_correta) {
              cls = 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium';
            } else if (idx === selected && !isCorrect) {
              cls = 'border-destructive bg-destructive/10 text-destructive font-medium';
            } else {
              cls = 'border-border opacity-40';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => { if (!confirmed) setSelected(idx); }}
              disabled={confirmed}
              className={cn('w-full text-left px-4 py-3 rounded-xl text-sm border transition-all duration-150', cls)}
            >
              <span className="flex items-center gap-3">
                {confirmed && idx === questao.resposta_correta && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                )}
                {confirmed && idx === selected && !isCorrect && (
                  <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                )}
                {opcao}
              </span>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {confirmed && questao.explicacao && (
        <div className={cn(
          'p-3 rounded-xl text-xs leading-relaxed border',
          isCorrect
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
        )}>
          <span className="font-semibold">Explicação: </span>
          {questao.explicacao}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {!confirmed ? (
          <Button size="sm" onClick={() => setConfirmed(true)} disabled={selected === null}>
            Confirmar
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => onAnswer(selected!, isCorrect)}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {index + 1 < total ? <>Próxima <ChevronRight className="h-4 w-4" /></> : 'Ver resultado'}
          </Button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// SCORE SCREEN
// ============================================================================

interface ScoreScreenProps {
  acertos: number;
  total: number;
}

const ScoreScreen: React.FC<ScoreScreenProps> = ({ acertos, total }) => {
  const pct = Math.round((acertos / total) * 100);
  const isGood = pct >= 70;

  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className={cn('p-5 rounded-full', isGood ? 'bg-emerald-500/10' : 'bg-amber-500/10')}>
        <Trophy className={cn('h-14 w-14', isGood ? 'text-emerald-500' : 'text-amber-500')} />
      </div>
      <div>
        <p className="text-4xl font-bold mb-1">{acertos}/{total}</p>
        <p className="text-muted-foreground">{pct}% de acerto</p>
      </div>
      <p className="text-sm text-muted-foreground max-w-sm">
        {isGood
          ? 'Excelente! Os acertos foram reagendados para revisão futura (SM-2).'
          : 'Os erros voltam para revisão amanhã. Continue praticando!'}
      </p>
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link to="/dashboard">Ir ao Dashboard</Link>
        </Button>
        <Button asChild>
          <Link to="/study-session">Estudar Agora</Link>
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// EMPTY STATE
// ============================================================================

const EmptyState: React.FC = () => (
  <Card className="flex flex-col items-center justify-center py-16 text-center">
    <div className="p-4 rounded-full bg-primary/10 mb-4">
      <Brain className="h-10 w-10 text-primary" />
    </div>
    <p className="font-semibold text-lg mb-1">Nenhuma revisão pendente</p>
    <p className="text-sm text-muted-foreground mb-6 max-w-sm">
      Ótimo trabalho! Todas as revisões em dia. Estude uma nova sessão para gerar mais questões.
    </p>
    <div className="flex gap-3">
      <Button asChild variant="outline">
        <Link to="/dashboard">Dashboard</Link>
      </Button>
      <Button asChild>
        <Link to="/study-session">
          <BookOpen className="mr-2 h-4 w-4" />
          Estudar Agora
        </Link>
      </Button>
    </div>
  </Card>
);

// ============================================================================
// PAGE
// ============================================================================

const RevisaoPage: React.FC = () => {
  const questoesQuery = useQuestoesRevisao();
  const responderMutation = useResponderQuestao();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [finished, setFinished] = useState(false);

  const questoes: Questao[] = questoesQuery.data ?? [];

  const handleAnswer = useCallback(async (opcaoIdx: number, correta: boolean) => {
    const questao = questoes[currentIdx];

    try {
      await responderMutation.mutateAsync({
        questaoId: questao.id,
        data: { resposta: opcaoIdx },
      });
    } catch {
      // SM-2 failure is non-blocking
    }

    const newAcertos = acertos + (correta ? 1 : 0);

    if (currentIdx + 1 >= questoes.length) {
      setAcertos(newAcertos);
      setFinished(true);
    } else {
      setAcertos(newAcertos);
      setCurrentIdx(prev => prev + 1);
    }
  }, [currentIdx, acertos, questoes, responderMutation]);

  const progress = questoes.length > 0 ? (currentIdx / questoes.length) * 100 : 0;

  return (
    <>
      <Helmet>
        <title>Revisão - Alvo Diário</title>
        <meta name="description" content="Fila de revisão por repetição espaçada (SM-2)" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-2xl">

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-xl bg-primary/10">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Revisão do Dia</h1>
              <p className="text-sm text-muted-foreground">
                Questões agendadas pela repetição espaçada
              </p>
            </div>
            {!questoesQuery.isLoading && questoes.length > 0 && !finished && (
              <div className="ml-auto text-sm font-semibold text-muted-foreground">
                {currentIdx + 1}/{questoes.length}
              </div>
            )}
          </div>

          {/* Loading */}
          {questoesQuery.isLoading && (
            <div className="flex justify-center py-16">
              <LoadingSpinner text="Carregando revisões..." />
            </div>
          )}

          {/* Empty state */}
          {!questoesQuery.isLoading && questoes.length === 0 && <EmptyState />}

          {/* Finished */}
          {finished && <Card><ScoreScreen acertos={acertos} total={questoes.length} /></Card>}

          {/* Quiz */}
          {!questoesQuery.isLoading && questoes.length > 0 && !finished && (
            <Card className="overflow-hidden p-0">
              {/* Progress bar */}
              <div className="h-1.5 bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="p-6">
                <ReviewQuestion
                  questao={questoes[currentIdx]}
                  index={currentIdx}
                  total={questoes.length}
                  onAnswer={handleAnswer}
                  isSaving={responderMutation.isPending}
                />
              </div>
            </Card>
          )}

        </main>
      </div>
    </>
  );
};

export default RevisaoPage;
