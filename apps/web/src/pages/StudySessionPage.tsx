import React from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Play, Pause, RotateCcw, BookOpen, CalendarDays,
  Brain, PenLine, ClipboardList, ChevronRight, Settings2, Check,
  Trophy, X, ThumbsUp, ThumbsDown, Flag
} from 'lucide-react';
import { Card } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import SubjectBadge from '@/components/SubjectBadge';
import {
  useStudySession,
  DEFAULT_PHASES,
  EXAM_QUESTIONS,
  Phase,
} from '@/hooks/useStudySession';

const PHASE_ICONS: Record<Phase, React.ReactNode> = {
  revisao: <Brain className="w-5 h-5" />,
  estudo: <PenLine className="w-5 h-5" />,
  questoes: <ClipboardList className="w-5 h-5" />,
};

const StudySessionPage: React.FC = () => {
  const { state, actions } = useStudySession();

  const {
    schedule, subjects, todaySubject, cycleInfo, selectedSubject,
    currentPhaseIdx, currentPhase, phaseDurations, completedPhases,
    isActive, timeLeft, totalMinutes,
    showSettings, showExame, examAnswers, examObservacoes, savingExame,
    isLoading,
  } = state;

  const {
    setSelectedSubject, toggleTimer, resetTimer, goToPhase, goToNextPhase,
    finalizarSessao, updateDuration, setShowSettings, setShowExame,
    setExamAnswers, setExamObservacoes, saveExameDiario, formatTime, getProgress,
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
        <title>Sessao de Estudo - Alvo Diario</title>
        <meta name="description" content="Sessao de estudo estruturada em 3 fases" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-5xl">

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
                  {subjects.map((s, i) => <option key={i} value={s}>{s}</option>)}
                </select>
                <span className="text-sm text-muted-foreground">
                  Total: <strong>{Math.floor(totalMinutes / 60)}h{totalMinutes % 60 > 0 ? `${totalMinutes % 60}min` : ''}</strong>
                </span>
              </div>
            </Card>
          )}

          {/* Phase selector */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {DEFAULT_PHASES.map((phase, idx) => {
              const isCurrentPhase = idx === currentPhaseIdx;
              const isDone = completedPhases.has(phase.id);
              return (
                <button
                  key={phase.id}
                  onClick={() => goToPhase(idx)}
                  className={`relative rounded-xl p-4 text-left border-2 transition-all ${
                    isCurrentPhase
                      ? `${phase.bgColor} ${phase.borderColor}`
                      : isDone
                        ? 'bg-muted/40 border-muted opacity-70'
                        : 'bg-card border-border hover:border-muted-foreground/30'
                  }`}
                >
                  {isDone && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  )}
                  <div className={`mb-2 ${isCurrentPhase ? phase.color : 'text-muted-foreground'}`}>
                    {PHASE_ICONS[phase.id]}
                  </div>
                  <p className={`text-sm font-semibold ${isCurrentPhase ? phase.color : ''}`}>
                    {phase.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {phaseDurations[phase.id] >= 60
                      ? `${Math.floor(phaseDurations[phase.id] / 60)}h${phaseDurations[phase.id] % 60 > 0 ? `${phaseDurations[phase.id] % 60}min` : ''}`
                      : `${phaseDurations[phase.id]}min`}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Timer principal */}
            <div className="lg:col-span-2">
              <Card className={`flex flex-col items-center border-2 transition-colors ${currentPhase.borderColor}`}>

                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6 ${currentPhase.bgColor} ${currentPhase.color}`}>
                  {PHASE_ICONS[currentPhase.id]}
                  {currentPhase.label}
                </div>

                <p className="text-sm text-muted-foreground text-center mb-8 max-w-xs">
                  {currentPhase.description}
                </p>

                {/* Circular progress */}
                <div className="relative flex items-center justify-center mb-10">
                  <svg className="w-56 h-56 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" className="stroke-muted fill-none" strokeWidth="3" />
                    <circle
                      cx="50" cy="50" r="46"
                      className={`fill-none transition-all duration-1000 ease-linear ${
                        currentPhase.id === 'revisao' ? 'stroke-blue-500'
                        : currentPhase.id === 'questoes' ? 'stroke-amber-500'
                        : 'stroke-primary'
                      }`}
                      strokeWidth="3"
                      strokeDasharray="289.03"
                      strokeDashoffset={289.03 - (289.03 * getProgress()) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <div className="text-5xl font-bold tabular-nums tracking-tighter">
                      {formatTime(timeLeft)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {Math.round(getProgress())}% concluido
                    </div>
                  </div>
                </div>

                {/* Controles */}
                <div className="flex items-center gap-4">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 w-12 rounded-full p-0"
                    onClick={resetTimer}
                    disabled={timeLeft === phaseDurations[currentPhase.id] * 60 && !isActive}
                  >
                    <RotateCcw className="h-5 w-5" />
                  </Button>

                  <Button
                    size="lg"
                    className={`h-14 px-10 rounded-full text-base shadow-lg active:scale-95 transition-transform ${
                      currentPhase.id === 'revisao' ? 'bg-blue-500 hover:bg-blue-600'
                      : currentPhase.id === 'questoes' ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : ''
                    }`}
                    onClick={toggleTimer}
                  >
                    {isActive
                      ? <><Pause className="mr-2 h-5 w-5 fill-current" /> Pausar</>
                      : <><Play className="mr-2 h-5 w-5 fill-current" /> {timeLeft === phaseDurations[currentPhase.id] * 60 ? 'Iniciar' : 'Continuar'}</>
                    }
                  </Button>

                  {currentPhaseIdx < DEFAULT_PHASES.length - 1 && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-12 w-12 rounded-full p-0"
                      onClick={goToNextPhase}
                      title="Avancar para proxima fase"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  )}

                  <Button
                    size="lg"
                    variant="destructive"
                    className="h-14 px-8 rounded-full text-base shadow-lg"
                    onClick={finalizarSessao}
                    title="Finalizar sessao agora"
                  >
                    <Flag className="mr-2 h-5 w-5" />
                    Finalizar
                  </Button>
                </div>

              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">

              {/* Dicas da fase atual */}
              <Card>
                <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${currentPhase.color}`}>
                  {PHASE_ICONS[currentPhase.id]}
                  Dicas para {currentPhase.label}
                </h3>
                <ul className="space-y-2">
                  {currentPhase.tips.map((tip, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className={`mt-0.5 shrink-0 w-4 h-4 rounded-full ${currentPhase.bgColor} ${currentPhase.color} flex items-center justify-center text-[10px] font-bold`}>
                        {i + 1}
                      </span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Configuracoes de duracao */}
              <Card>
                <button
                  className="w-full flex items-center justify-between text-sm font-semibold mb-0"
                  onClick={() => setShowSettings(v => !v)}
                >
                  <span className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-muted-foreground" />
                    Personalizar duracoes
                  </span>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showSettings ? 'rotate-90' : ''}`} />
                </button>

                {showSettings && (
                  <div className="mt-4 space-y-5">
                    {DEFAULT_PHASES.map(phase => (
                      <div key={phase.id}>
                        <Label className={`flex justify-between text-xs mb-2 ${phase.color}`}>
                          <span className="flex items-center gap-1">{PHASE_ICONS[phase.id]} {phase.label}</span>
                          <span className="text-muted-foreground font-medium">
                            {phaseDurations[phase.id] >= 60
                              ? `${Math.floor(phaseDurations[phase.id] / 60)}h${phaseDurations[phase.id] % 60 > 0 ? `${phaseDurations[phase.id] % 60}min` : ''}`
                              : `${phaseDurations[phase.id]}min`}
                          </span>
                        </Label>
                        <Input
                          type="range"
                          min={phase.id === 'questoes' ? 10 : 30}
                          max={phase.id === 'questoes' ? 90 : 240}
                          step={phase.id === 'questoes' ? 5 : 10}
                          value={phaseDurations[phase.id]}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDuration(phase.id, parseInt(e.target.value))}
                          disabled={isActive && phase.id === currentPhase.id}
                          className="cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Materia (se nao tiver cronograma) */}
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
                    {subjects.map((s, i) => <option key={i} value={s}>{s}</option>)}
                  </select>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal Exame Diario */}
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
// EXAM MODAL (extracted sub-component)
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
  examAnswers, examObservacoes, savingExame,
  onSetExamAnswers, onSetExamObservacoes, onSave, onClose,
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

      {/* Perguntas */}
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
                        <ThumbsDown className="w-3.5 h-3.5" /> Nao
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Pontuacao parcial */}
        {Object.keys(examAnswers).length > 0 && (
          <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl">
            <span className="text-sm font-medium">Criterios cumpridos</span>
            <span className="font-bold text-primary text-lg">
              {Object.values(examAnswers).filter(Boolean).length}/{EXAM_QUESTIONS.length}
            </span>
          </div>
        )}

        {/* Observacoes */}
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-2 block">
            Observacoes (opcional)
          </Label>
          <textarea
            value={examObservacoes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onSetExamObservacoes(e.target.value)}
            placeholder="O que foi dificil hoje? O que precisa melhorar amanha?"
            rows={3}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Botao concluir */}
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
