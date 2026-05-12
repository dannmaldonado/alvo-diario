import React from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, CalendarDays, Trophy, X, Timer, Clock, FileText, Video } from 'lucide-react';
import { Card } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import SubjectBadge from '@/components/SubjectBadge';
import PomodoroTimer from '@/components/study/PomodoroTimer';
import QuizModal from '@/components/study/QuizModal';
import TodaySessionsList from '@/components/study/TodaySessionsList';
import { DailyRating } from '@/components/dashboard/DailyRating';
import { useStudySession } from '@/hooks/useStudySession';
import { useAuth } from '@/contexts/AuthContext';
import { useTodaySessions } from '@/hooks/queries/useSessoes';
import { DailyRatingValue } from '@/types';

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
    timerMode,
    isActive,
    timeLeft,
    totalStudyMinutesToday,
    sessionEnded,
    showBreakReminder,
    sessionNotes,
    selectedMaterial,
    materials,
    paginasLidas,
    videoaulas,
    showExame,
    avaliacao,
    examObservacoes,
    savingExame,
    showQuiz,
    questoesGeradas,
    quizSessaoId,
    generatingQuestoes,
    isLoading,
  } = state;

  const {
    setSelectedSubject,
    setSessionNotes,
    setSelectedMaterial,
    setPaginasLidas,
    setVideoaulas,
    setTimerMode,
    toggleTimer,
    resetTimer,
    continueStudying,
    skipBreakReminder,
    finalizarSessao,
    setShowExame,
    setShowQuiz,
    setAvaliacao,
    setExamObservacoes,
    saveExameDiario,
    formatTime,
    getProgress,
    getCumulativeMinutes,
  } = actions;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
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

      <div>
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
                <Select
                  value={selectedSubject}
                  onValueChange={setSelectedSubject}
                  disabled={isActive}
                >
                  <SelectTrigger className="h-9 w-48 text-sm">
                    <SelectValue placeholder="Matéria" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s, i) => (
                      <SelectItem key={i} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

          {/* Timer mode selector */}
          <div className="mb-6 flex gap-3">
            <button
              onClick={() => setTimerMode('pomodoro')}
              disabled={isActive}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all
                ${timerMode === 'pomodoro'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/50'}
                ${isActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Timer className="h-4 w-4" />
              Pomodoro (25 min)
            </button>
            <button
              onClick={() => setTimerMode('livre')}
              disabled={isActive}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all
                ${timerMode === 'livre'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/50'}
                ${isActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Clock className="h-4 w-4" />
              Tempo Livre
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main timer */}
            <div className="lg:col-span-2">
              <Card className="border-2 border-primary/30">
                <PomodoroTimer
                  timerMode={timerMode}
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

              {/* Pages read + Video lessons */}
              <Card>
                <h3 className="text-sm font-semibold mb-3">Progresso do Material</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <label className="text-xs text-muted-foreground w-28 shrink-0">Páginas lidas</label>
                    <input
                      type="number"
                      min={0}
                      max={9999}
                      value={paginasLidas}
                      onChange={(e) => setPaginasLidas(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-right"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-primary shrink-0" />
                    <label className="text-xs text-muted-foreground w-28 shrink-0">Videoaulas</label>
                    <input
                      type="number"
                      min={0}
                      max={999}
                      value={videoaulas}
                      onChange={(e) => setVideoaulas(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-right"
                    />
                  </div>
                </div>
              </Card>

              {/* Material selector */}
              {materials.length > 0 && (
                <Card>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Material (opcional)
                  </h3>
                  <Select
                    value={selectedMaterial || '__none__'}
                    onValueChange={(v) => setSelectedMaterial(v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger className="w-full h-10 text-sm">
                      <SelectValue placeholder="Nenhum material" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum material</SelectItem>
                      {materials.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Card>
              )}

              {/* Materia selector (if no schedule) */}
              {!schedule && (
                <Card>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Materia
                  </h3>
                  <Select
                    value={selectedSubject}
                    onValueChange={setSelectedSubject}
                    disabled={isActive}
                  >
                    <SelectTrigger className="w-full h-10 text-sm">
                      <SelectValue placeholder="Selecione uma matéria" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s, i) => (
                        <SelectItem key={i} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

      {/* Rating Modal */}
      {showExame && (
        <RatingModal
          avaliacao={avaliacao}
          examObservacoes={examObservacoes}
          savingExame={savingExame}
          totalMinutes={totalStudyMinutesToday}
          onSetAvaliacao={setAvaliacao}
          onSetExamObservacoes={setExamObservacoes}
          onSave={saveExameDiario}
          onClose={() => setShowExame(false)}
        />
      )}

      {/* AI Quiz Modal */}
      {showQuiz && (
        <QuizModal
          questoes={questoesGeradas}
          sessaoId={quizSessaoId}
          isLoading={generatingQuestoes}
          onComplete={() => setShowQuiz(false)}
          onClose={() => setShowQuiz(false)}
        />
      )}
    </>
  );
};

// ============================================================================
// RATING MODAL
// ============================================================================

interface RatingModalProps {
  avaliacao: DailyRatingValue | null;
  examObservacoes: string;
  savingExame: boolean;
  totalMinutes: number;
  onSetAvaliacao: (rating: DailyRatingValue) => void;
  onSetExamObservacoes: (value: string) => void;
  onSave: () => Promise<void>;
  onClose: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({
  avaliacao,
  examObservacoes,
  savingExame,
  totalMinutes,
  onSetAvaliacao,
  onSetExamObservacoes,
  onSave,
  onClose,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
    <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md">

      {/* Header */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Avaliacao Diaria</h2>
            <p className="text-xs text-muted-foreground">
              Sessao concluida — {totalMinutes} min estudados
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">

        {/* 1-5 Star Rating */}
        <div>
          <p className="text-sm font-medium mb-4">Como foi sua dedicacao hoje?</p>
          <DailyRating
            value={avaliacao ?? undefined}
            onChange={onSetAvaliacao}
            showPointsMultiplier
            todaySessionMinutes={totalMinutes}
          />
        </div>

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

        {/* Submit */}
        <Button
          onClick={onSave}
          disabled={savingExame || !avaliacao}
          className="w-full h-12 text-base"
        >
          {savingExame ? 'Salvando...' : 'Concluir Sessao'}
        </Button>

        {!avaliacao && (
          <p className="text-xs text-center text-muted-foreground">
            Selecione uma avaliacao (1 a 5 estrelas) para concluir
          </p>
        )}
      </div>
    </div>
  </div>
);

export default StudySessionPage;
