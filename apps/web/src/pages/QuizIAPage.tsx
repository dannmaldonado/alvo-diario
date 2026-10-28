/**
 * QuizIAPage — Dedicated AI quiz screen.
 * User picks matéria + banca + difficulty → generates 10 questions → QuizModal.
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Brain, Loader2, Trophy, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import QuizModal, { type QuizResult } from '@/components/study/QuizModal';
import { useGerarQuestoes } from '@/hooks/queries/useQuestoes';
import { useEditaisList } from '@/hooks/queries/useEditais';
import { cn } from '@/lib/utils';
import type { Questao } from '@/types';

// ============================================================================
// DIFFICULTY CONFIG
// ============================================================================

const DIFICULDADES = [
  { value: 'facil',   label: 'Fácil',   desc: 'Conceitos fundamentais' },
  { value: 'media',   label: 'Média',   desc: 'Nível concurso' },
  { value: 'dificil', label: 'Difícil', desc: 'Questões complexas' },
] as const;

type Dificuldade = 'facil' | 'media' | 'dificil';

// ============================================================================
// PAGE
// ============================================================================

const QuizIAPage: React.FC = () => {
  const gerarMutation = useGerarQuestoes();
  const { data: editais } = useEditaisList();

  const [materia, setMateria] = useState('');
  const [banca, setBanca] = useState('');
  const [dificuldade, setDificuldade] = useState<Dificuldade>('media');

  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  // Collect unique matéria names from all user editais
  const materiasDoEdital = React.useMemo(() => {
    if (!editais?.length) return [];
    const names = new Set<string>();
    for (const e of editais) {
      for (const m of (e.materias ?? [])) {
        if (m.nome) names.add(m.nome);
      }
    }
    return Array.from(names).sort();
  }, [editais]);

  const handleGerar = async () => {
    if (!materia.trim()) return;
    setResult(null);
    try {
      const qs = await gerarMutation.mutateAsync({
        materia: materia.trim(),
        banca: banca.trim() || undefined,
        dificuldade,
        quantidade: 10,
      });
      setQuestoes(qs);
      setShowModal(true);
    } catch {
      // error surfaced via gerarMutation.error
    }
  };

  const handleComplete = (r: QuizResult) => {
    setResult(r);
  };

  const handleClose = () => {
    setShowModal(false);
  };

  const handleNovo = () => {
    setResult(null);
    setQuestoes([]);
    setMateria('');
    setBanca('');
    setDificuldade('media');
  };

  const pct = result ? Math.round((result.acertos / result.total) * 100) : 0;
  const isGood = pct >= 70;

  return (
    <>
      <Helmet><title>Quiz IA — Alvo Diário</title></Helmet>

      <div className="min-h-screen bg-background">
        <div className="max-w-xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6">

          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Quiz com IA</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Gere 10 questões inéditas por tema e pratique quando quiser.
              </p>
            </div>
          </div>

          {/* Result card */}
          {result && !showModal && (
            <div className={cn(
              'rounded-2xl border p-5 text-center space-y-3',
              isGood
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/20'
            )}>
              <Trophy className={cn(
                'h-10 w-10 mx-auto',
                isGood ? 'text-emerald-500' : 'text-amber-500'
              )} />
              <div>
                <p className="text-3xl font-bold">{result.acertos}/{result.total}</p>
                <p className={cn(
                  'text-sm font-medium mt-0.5',
                  isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                )}>
                  {pct}% de acerto em <span className="font-semibold">{materia}</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {isGood
                  ? 'Ótimo! Os erros foram adicionados à sua fila de revisão.'
                  : 'Tópicos com erro adicionados à fila de revisão. Continue praticando!'}
              </p>
              <Button variant="outline" size="sm" onClick={handleNovo} className="gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Novo quiz
              </Button>
            </div>
          )}

          {/* Form */}
          {!result && (
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-5">

              {/* Matéria */}
              <div className="space-y-2">
                <Label htmlFor="materia-quiz">Matéria *</Label>
                {materiasDoEdital.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      id="materia-quiz"
                      value={materia}
                      onChange={(e) => setMateria(e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Selecione ou digite abaixo</option>
                      {materiasDoEdital.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Ou digite um tema livre..."
                      value={materia}
                      onChange={(e) => setMateria(e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ) : (
                  <input
                    id="materia-quiz"
                    type="text"
                    placeholder="Ex: Direito Penal — Crimes contra a pessoa"
                    value={materia}
                    onChange={(e) => setMateria(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                )}
              </div>

              {/* Banca */}
              <div className="space-y-2">
                <Label htmlFor="banca-quiz">Banca <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                <input
                  id="banca-quiz"
                  type="text"
                  placeholder="Ex: VUNESP, CESPE, FGV..."
                  value={banca}
                  onChange={(e) => setBanca(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground">
                  A IA adapta o estilo das questões para a banca informada.
                </p>
              </div>

              {/* Dificuldade */}
              <div className="space-y-2">
                <Label>Dificuldade</Label>
                <div className="grid grid-cols-3 gap-2">
                  {DIFICULDADES.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setDificuldade(d.value)}
                      className={cn(
                        'rounded-xl border p-3 text-left transition-colors',
                        dificuldade === d.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40 hover:bg-muted/30'
                      )}
                    >
                      <p className={cn(
                        'text-sm font-semibold',
                        dificuldade === d.value ? 'text-primary' : 'text-foreground'
                      )}>
                        {d.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{d.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {gerarMutation.error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  {gerarMutation.error.message}
                </p>
              )}

              {/* Generate button */}
              <Button
                className="w-full gap-2"
                disabled={!materia.trim() || gerarMutation.isPending}
                onClick={handleGerar}
              >
                {gerarMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando questões...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Gerar 10 questões
                  </>
                )}
              </Button>

              {gerarMutation.isPending && (
                <p className="text-xs text-center text-muted-foreground -mt-2">
                  Isso pode levar alguns segundos ✨
                </p>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Quiz Modal */}
      {showModal && (
        <QuizModal
          questoes={questoes}
          onComplete={handleComplete}
          onClose={handleClose}
          isLoading={gerarMutation.isPending}
        />
      )}
    </>
  );
};

export default QuizIAPage;
