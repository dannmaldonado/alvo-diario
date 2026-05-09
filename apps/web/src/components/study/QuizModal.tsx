/**
 * QuizModal — Post-session AI-generated question quiz
 * Shows questions one by one, tracks responses, shows final score
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ChevronRight, Trophy, X, Brain, Loader2 } from 'lucide-react';
import { useResponderQuestao } from '@/hooks/queries/useQuestoes';
import type { Questao } from '@/types';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface QuizResult {
  acertos: number;
  total: number;
}

interface QuizModalProps {
  questoes: Questao[];
  sessaoId?: string;
  onComplete: (result: QuizResult) => void;
  onClose: () => void;
  isLoading?: boolean;
}

// ============================================================================
// QUESTION VIEW
// ============================================================================

interface QuestionViewProps {
  questao: Questao;
  index: number;
  total: number;
  onAnswer: (opcaoIdx: number) => void;
  isSaving: boolean;
}

const QuestionView: React.FC<QuestionViewProps> = ({ questao, index, total, onAnswer, isSaving }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const isCorrect = selected === questao.resposta_correta;

  const handleSelect = (idx: number) => {
    if (confirmed) return;
    setSelected(idx);
  };

  const handleConfirm = () => {
    if (selected === null) return;
    setConfirmed(true);
  };

  const handleNext = () => {
    if (selected !== null) onAnswer(selected);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Question header */}
      <div>
        <p className="text-xs text-muted-foreground mb-1">
          Questão {index + 1} de {total}
          {questao.banca && <span className="ml-2 font-medium text-primary/70">· {questao.banca}</span>}
        </p>
        <p className="text-sm font-medium leading-relaxed">{questao.enunciado}</p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {questao.opcoes.map((opcao, idx) => {
          let variant: 'default' | 'correct' | 'wrong' | 'neutral' = 'default';
          if (confirmed) {
            if (idx === questao.resposta_correta) variant = 'correct';
            else if (idx === selected && selected !== questao.resposta_correta) variant = 'wrong';
            else variant = 'neutral';
          } else if (selected === idx) {
            variant = 'default';
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={confirmed}
              className={cn(
                'w-full text-left px-4 py-3 rounded-xl text-sm border transition-all duration-200',
                !confirmed && selected !== idx && 'border-border hover:border-primary/50 hover:bg-primary/5',
                !confirmed && selected === idx && 'border-primary bg-primary/10 font-medium',
                confirmed && variant === 'correct' && 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium',
                confirmed && variant === 'wrong' && 'border-destructive bg-destructive/10 text-destructive font-medium',
                confirmed && variant === 'neutral' && 'border-border opacity-50',
              )}
            >
              <span className="flex items-center gap-3">
                {confirmed && variant === 'correct' && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
                {confirmed && variant === 'wrong' && <XCircle className="h-4 w-4 shrink-0 text-destructive" />}
                <span>{opcao}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Explanation (shown after confirming) */}
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

      {/* Action button */}
      <div className="flex justify-end">
        {!confirmed ? (
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={selected === null}
          >
            Confirmar
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleNext}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {index + 1 < total ? (
              <>Próxima <ChevronRight className="h-4 w-4" /></>
            ) : (
              'Ver resultado'
            )}
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
  result: QuizResult;
  onClose: () => void;
}

const ScoreScreen: React.FC<ScoreScreenProps> = ({ result, onClose }) => {
  const pct = Math.round((result.acertos / result.total) * 100);
  const isGood = pct >= 70;

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <div className={cn(
        'p-5 rounded-full',
        isGood ? 'bg-emerald-500/10' : 'bg-amber-500/10'
      )}>
        <Trophy className={cn('h-12 w-12', isGood ? 'text-emerald-500' : 'text-amber-500')} />
      </div>

      <div>
        <p className="text-3xl font-bold mb-1">
          {result.acertos}/{result.total}
        </p>
        <p className="text-muted-foreground text-sm">
          {pct}% de acerto
        </p>
      </div>

      <p className="text-sm text-muted-foreground max-w-xs">
        {isGood
          ? 'Ótimo desempenho! Continue assim e as questões erradas aparecerão na sua fila de revisão.'
          : 'Os tópicos com erro foram adicionados à sua fila de revisão. Revise-os para fixar o conteúdo!'}
      </p>

      <Button onClick={onClose} className="w-full max-w-xs">
        Fechar
      </Button>
    </div>
  );
};

// ============================================================================
// MAIN MODAL
// ============================================================================

const QuizModal: React.FC<QuizModalProps> = ({
  questoes,
  sessaoId,
  onComplete,
  onClose,
  isLoading = false,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [finished, setFinished] = useState(false);

  const responderMutation = useResponderQuestao();

  const handleAnswer = useCallback(async (opcaoIdx: number) => {
    const questao = questoes[currentIdx];
    const isCorrect = opcaoIdx === questao.resposta_correta;

    // Persist response (fire-and-forget on failure — don't block UX)
    try {
      await responderMutation.mutateAsync({
        questaoId: questao.id,
        data: { resposta: opcaoIdx, sessao_id: sessaoId },
      });
    } catch {
      // Silent — SM-2 update failure shouldn't block the quiz flow
    }

    const newAcertos = acertos + (isCorrect ? 1 : 0);

    if (currentIdx + 1 >= questoes.length) {
      setAcertos(newAcertos);
      setFinished(true);
      onComplete({ acertos: newAcertos, total: questoes.length });
    } else {
      setAcertos(newAcertos);
      setCurrentIdx(prev => prev + 1);
    }
  }, [currentIdx, acertos, questoes, sessaoId, responderMutation, onComplete]);

  const progress = questoes.length > 0 ? ((currentIdx) / questoes.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-background rounded-2xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Quiz pós-sessão</span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        {!finished && questoes.length > 0 && (
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div>
                <p className="font-semibold mb-1">Gerando questões...</p>
                <p className="text-sm text-muted-foreground">
                  Isso pode levar alguns segundos.
                </p>
              </div>
            </div>
          ) : questoes.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <p className="text-muted-foreground text-sm">Nenhuma questão disponível.</p>
              <Button size="sm" variant="outline" onClick={onClose}>Fechar</Button>
            </div>
          ) : finished ? (
            <ScoreScreen
              result={{ acertos, total: questoes.length }}
              onClose={onClose}
            />
          ) : (
            <QuestionView
              key={currentIdx}
              questao={questoes[currentIdx]}
              index={currentIdx}
              total={questoes.length}
              onAnswer={handleAnswer}
              isSaving={responderMutation.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizModal;
