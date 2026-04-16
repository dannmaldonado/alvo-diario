import React from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  BookOpen, CalendarDays, Settings2, Check, Trophy, X, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { Card } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import SubjectBadge from '@/components/SubjectBadge';
import PomodoroTimer from '@/components/study/PomodoroTimer';
import TodaySessionsList from '@/components/study/TodaySessionsList';
import {
  useStudySession,
  EXAM_QUESTIONS,
} from '@/hooks/useStudySession';
import { useAuth } from '@/contexts/AuthContext';
import { useTodaySessions } from '@/hooks/queries/useSessoes';

const StudySessionPage: React.FC = () => {
  const { state, actions } = useStudySession();
  const { currentUser } = useAuth();
  const todaySessionsQuery = useTodaySessions(currentUser?.id);

  const {
    schedule,
    subjects,
    todaySubject,
    cycleInfo,
    selectedSubject,
    sessionDuration,
    isActive,
    timeLeft,
    totalStudyMinutesToday,
    sessionEnded,
    showBreakReminder,
    sessionNotes,
    showSettings,
    showExame,
    examAnswers,
    examObservacoes,
    savingExame,
    isLoading,
  } = state;

  const {
    setSelectedSubject,
    setSessionNotes,
    toggleTimer,
    resetTimer,
    continueStudying,
    skipBreakReminder,
    finalizarSessao,
    setShowSettings,
    setShowExame,
    setExamAnswers,
    setExamObservacoes,
    saveExameDiario,
    formatTime,
    getProgress,
    getCumulativeMinutes,
  } = actions;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner text="Carregando sessao de estudo..." size="lg" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Pomodoro - Alvo Diario</title>
        <meta name="description" content="Timer Pomodoro para estudo estruturado" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-4xl">

          {/* Header: materia do dia */}
          {schedule && todaySubject && (
            <Card className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Materia do Dia - Ciclo {cycleInfo?.cycleNumber}, Dia {cycleInfo?.dayInCycle}
                  </p>
                  <div className="mt-1">
                    <SubjectBadge subject={todaySubject} size="md" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={isActive}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                  <option value="" disabled>Materia</option>
                  {subjects.map((s, i) => (
                    <option key={i} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </Card>
          )}

          {/* Progress bar to 4h goal */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Progresso diário
              </span>
              <span className="text-sm font-bold">
                {getCumulativeMinutes()}min / 240min
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 via-primary to-amber-500 h-full transition-all duration-300"
                style={{
                  width: `${Math.min((getCumulativeMinutes() / 240) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {getCumulativeMinutes() >= 240
                ? '✨ Meta atingida! Parabéns!'
                : `${240 - getCumulativeMinutes()} minutos restantes`}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main timer */}
            <div className="lg:col-span-2">
              <Card className="border-2 border-primary/30">
                <PomodoroTimer
                  timeLeft={timeLeft}
                  isActive={isActive}
                  progress={getProgress()}
                  totalStudyMinutesToday={totalStudyMinutesToday}
                  sessionEnded={sessionEnded}
                  showBreakReminder={showBreakReminder}
                  formatTime={formatTime}
                  onToggle={toggleTimer}
                  onReset={resetTimer}
                  onContinueStudying={continueStudying}
                  onSkipBreakReminder={skipBreakReminder}
                  onFinalize={finalizarSessao}
                />
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">

              {/* Session notes */}
              <Card>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Anotacoes
                </h3>
                <textarea
                  value={sessionNotes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSessionNotes(e.target.value)}
                  placeholder="Anotacoes da sessao (opcional, max 500 caracteres)"
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {sessionNotes.length}/500
                </p>
              </Card>

              {/* Materia selector (if no schedule) */}
              {!schedule && (
                <Card>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Materia
                  </h3>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    disabled={isActive}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  >
                    <option value="" disabled>Selecione uma materia</option>
                    {subjects.map((s, i) => (
                      <option key={i} value={s}>{s}</option>
                    ))}
                  </select>
                </Card>
              )}

              {/* Info card */}
              <Card>
                <h3 className="text-sm font-semibold mb-3">💡 Dica</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cada sessao tem 25 minutos. Quando terminar, escolha continuar ou finalizar. Meta: 240 minutos (4h) de estudo por dia.
                </p>
              </Card>

            </div>
          </div>

          {/* Today's sessions list */}
          <TodaySessionsList
            sessions={todaySessionsQuery.data ?? []}
            isLoading={todaySessionsQuery.isLoading}
          />

        </main>
      </div>

      {/* Exam Modal */}
      {showExame && (
        <ExamModal
          examAnswers={examAnswers}
          examObservacoes={examObservacoes}
          savingExame={savingExame}
          onSetExamAnswers={setExamAnswers}
          onSetExamObservacoes={setExamObservacoes}
          onSave={saveExameDiario}
          onClose={() => setShowExame(false)}
        />
      )}
    </>
  );
};

// ============================================================================
// EXAM MODAL
// ============================================================================

interface ExamModalProps {
  examAnswers: Record<string, boolean | null>;
  examObservacoes: string;
  savingExame: boolean;
  onSetExamAnswers: React.Dispatch<React.SetStateAction<Record<string, boolean | null>>>;
  onSetExamObservacoes: (value: string) => void;
  onSave: () => Promise<void>;
  onClose: () => void;
}

const ExamModal: React.FC<ExamModalProps> = ({
  examAnswers,
  examObservacoes,
  savingExame,
  onSetExamAnswers,
  onSetExamObservacoes,
  onSave,
  onClose,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
    <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

      {/* Header */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Exame Diario</h2>
            <p className="text-xs text-muted-foreground">Avalie sua sessao de hoje</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Questions */}
      <div className="p-6 space-y-6">
        {(['Disciplina', 'Aprendizado', 'Pratica', 'Progresso'] as const).map(categoria => {
          const perguntas = EXAM_QUESTIONS.filter(q => q.categoria === categoria);
          return (
            <div key={categoria}>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">{categoria}</p>
              <div className="space-y-3">
                {perguntas.map(q => (
                  <div key={q.id} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-muted/50">
                    <p className="text-sm flex-1">{q.texto}</p>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => onSetExamAnswers(prev => ({ ...prev, [q.id]: true }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          examAnswers[q.id] === true
                            ? 'bg-green-500 text-white shadow-sm'
                            : 'bg-background border border-border text-muted-foreground hover:border-green-500 hover:text-green-500'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" /> Sim
                      </button>
                      <button
                        onClick={() => onSetExamAnswers(prev => ({ ...prev, [q.id]: false }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          examAnswers[q.id] === false
                            ? 'bg-destructive text-white shadow-sm'
                            : 'bg-background border border-border text-muted-foreground hover:border-destructive hover:text-destructive'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" /> Nao
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Score */}
        {Object.keys(examAnswers).length > 0 && (
          <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl">
            <span className="text-sm font-medium">Criterios cumpridos</span>
            <span className="font-bold text-primary text-lg">
              {Object.values(examAnswers).filter(Boolean).length}/{EXAM_QUESTIONS.length}
            </span>
          </div>
        )}

        {/* Notes */}
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-2 block">
            Observacoes (opcional)
          </Label>
          <textarea
            value={examObservacoes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onSetExamObservacoes(e.target.value)}
            placeholder="O que foi dificil? O que melhorar amanha?"
            rows={3}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Submit button */}
        <Button
          onClick={onSave}
          disabled={savingExame || Object.keys(examAnswers).length < EXAM_QUESTIONS.length}
          className="w-full h-12 text-base"
        >
          {savingExame ? 'Salvando...' : 'Concluir Sessao'}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          {EXAM_QUESTIONS.length - Object.keys(examAnswers).length > 0
            ? `Responda mais ${EXAM_QUESTIONS.length - Object.keys(examAnswers).length} pergunta(s) para concluir`
            : 'Todas as perguntas respondidas'}
        </p>
      </div>
    </div>
  </div>
);

export default StudySessionPage;
