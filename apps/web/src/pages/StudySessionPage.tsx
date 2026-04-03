import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { CronogramaService } from '@/services/cronograma.service';
import { apiClient } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Play, Pause, RotateCcw, BookOpen, CalendarDays,
  Brain, PenLine, ClipboardList, ChevronRight, Settings2, Check,
  Trophy, X, ThumbsUp, ThumbsDown, Flag
} from 'lucide-react';
import { toast } from 'sonner';
import { Cronograma, Materia } from '@/types';
import { Card } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import SubjectBadge from '@/components/SubjectBadge';
import { useScheduleCalculator } from '@/hooks';
import { SessoesService } from '@/services/sessoes.service';

type Phase = 'revisao' | 'estudo' | 'questoes';

const EXAM_QUESTIONS = [
  { id: 'horarios',    categoria: 'Disciplina',   texto: 'Cumpri os horários planejados?' },
  { id: 'distracao',  categoria: 'Disciplina',   texto: 'Evitei distrações (celular, redes sociais)?' },
  { id: 'retencao',   categoria: 'Aprendizado',  texto: 'Estou retendo o conteúdo?' },
  { id: 'explicar',   categoria: 'Aprendizado',  texto: 'Consigo explicar o que estudei com minhas palavras?' },
  { id: 'questoes',   categoria: 'Prática',      texto: 'Resolvi questões hoje?' },
  { id: 'erros',      categoria: 'Prática',      texto: 'Revisei os erros das questões?' },
  { id: 'plano',      categoria: 'Progresso',    texto: 'Cumpri o plano do dia?' },
  { id: 'evolucao',   categoria: 'Progresso',    texto: 'Me sinto mais preparado do que ontem?' },
];

type ExamAnswers = Record<string, boolean | null>;

interface PhaseConfig {
  id: Phase;
  label: string;
  description: string;
  tips: string[];
  icon: React.ReactNode;
  defaultMinutes: number;
  color: string;
  bgColor: string;
  borderColor: string;
}

const DEFAULT_PHASES: PhaseConfig[] = [
  {
    id: 'revisao',
    label: 'Revisão',
    description: 'Ative sua memória e reforce o conteúdo anterior',
    tips: ['Releia suas anotações da última sessão', 'Tente lembrar os pontos principais sem olhar', 'Coloque seu cérebro no modo estudo'],
    icon: <Brain className="w-5 h-5" />,
    defaultMinutes: 60,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  {
    id: 'estudo',
    label: 'Estudo',
    description: 'Aprenda o conteúdo novo com marcação ativa',
    tips: ['Marque os pontos principais enquanto lê', 'Faça pausas de 5 min a cada 50 min', 'Teste sua retenção após cada tópico'],
    icon: <PenLine className="w-5 h-5" />,
    defaultMinutes: 150,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
  },
  {
    id: 'questoes',
    label: 'Questões',
    description: 'Aplique o conteúdo e identifique suas falhas',
    tips: ['Resolva questões sem consultar o material', 'Anote os pontos que errou para revisar', 'Analise o gabarito com atenção'],
    icon: <ClipboardList className="w-5 h-5" />,
    defaultMinutes: 30,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
];

const StudySessionPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { getCurrentSubject, getCycleInfo } = useScheduleCalculator();

  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<Cronograma | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [todaySubject, setTodaySubject] = useState<Materia | null>(null);
  const [cycleInfo, setCycleInfo] = useState<{ cycleNumber: number; dayInCycle: number } | null>(null);
  const [selectedSubject, setSelectedSubject] = useState('');

  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [phaseDurations, setPhaseDurations] = useState<Record<Phase, number>>({
    revisao: 60,
    estudo: 150,
    questoes: 30,
  });
  const [completedPhases, setCompletedPhases] = useState<Set<Phase>>(new Set());
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [showSettings, setShowSettings] = useState(false);
  const [showExame, setShowExame] = useState(false);
  const [examAnswers, setExamAnswers] = useState<ExamAnswers>({});
  const [examObservacoes, setExamObservacoes] = useState('');
  const [savingExame, setSavingExame] = useState(false);
  const [tempoGastoTotal, setTempoGastoTotal] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentPhase = DEFAULT_PHASES[currentPhaseIdx];

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }

    const fetchSchedule = async () => {
      try {
        const cronogramas = await CronogramaService.getAll(currentUser.id) as Cronograma[];
        if (cronogramas.length > 0) {
          const active = cronogramas[0];
          setSchedule(active);
          if (active.materias) {
            const names = active.materias.map((m: Materia) => m.nome);
            setSubjects(names);
            const today = new Date();
            const current = getCurrentSubject(active, today) as Materia | null;
            const info = getCycleInfo(active, today) as { cycleNumber: number; dayInCycle: number } | null;
            setTodaySubject(current);
            setCycleInfo(info);
            if (current?.nome) setSelectedSubject(current.nome);
            else if (names.length > 0) setSelectedSubject(names[0]);
          }
        }
      } catch {
        toast.error('Não foi possível carregar seu cronograma.');
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset timer when phase changes
  useEffect(() => {
    setIsActive(false);
    setTimeLeft(phaseDurations[currentPhase.id] * 60);
  }, [currentPhaseIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer tick
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsActive(false);
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePhaseComplete = () => {
    const updated = new Set([...completedPhases, currentPhase.id]);
    setCompletedPhases(updated);
    if (currentPhaseIdx < DEFAULT_PHASES.length - 1) {
      toast.success(`${currentPhase.label} concluída! Avance para a próxima fase.`);
    } else {
      // Última fase (questões) — abre Exame Diário
      setTimeout(() => setShowExame(true), 800);
    }
  };

  const saveExameDiario = async () => {
    const totalRespondidas = Object.values(examAnswers).filter(v => v !== null).length;
    if (totalRespondidas < EXAM_QUESTIONS.length) {
      toast.error('Responda todas as perguntas antes de concluir.');
      return;
    }
    try {
      setSavingExame(true);
      const pontuacao = Object.values(examAnswers).filter(Boolean).length;

      // Salvar exame diário
      await apiClient.post('/api/exames', {
        respostas: examAnswers,
        observacoes: examObservacoes,
        pontuacao,
      });

      // Usar tempo real gasto, ou se for 0 (completou todas), usar a soma das fases
      const duracao = tempoGastoTotal > 0 ? tempoGastoTotal : Object.values(phaseDurations).reduce((a, b) => a + b, 0);
      const totalMinutos = Math.round(duracao / 60);

      // Salvar sessão de estudo
      if (selectedSubject) {
        await SessoesService.create({
          user_id: currentUser?.id || '',
          cronograma_id: schedule?.id || '',
          materia: selectedSubject,
          data_sessao: new Date().toISOString().split('T')[0],
          duracao_minutos: totalMinutos,
        });
      }

      setShowExame(false);
      toast.success(`Exame salvo! Você acertou ${pontuacao} de ${EXAM_QUESTIONS.length} critérios. 🎉`);
    } catch (error) {
      console.error('Erro ao salvar sessão ou exame:', error);
      toast.error('Erro ao salvar o exame. Tente novamente.');
    } finally {
      setSavingExame(false);
    }
  };

  const goToNextPhase = () => {
    setCompletedPhases(prev => new Set([...prev, currentPhase.id]));
    if (currentPhaseIdx < DEFAULT_PHASES.length - 1) {
      setCurrentPhaseIdx(prev => prev + 1);
    } else {
      setShowExame(true);
    }
  };

  const goToPhase = (idx: number) => {
    setIsActive(false);
    setCurrentPhaseIdx(idx);
  };

  const toggleTimer = () => {
    if (!selectedSubject) {
      toast.error('Selecione uma matéria antes de começar.');
      return;
    }
    setIsActive(prev => !prev);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(phaseDurations[currentPhase.id] * 60);
  };

  const finalizarSessao = () => {
    setIsActive(false);
    // Calcular tempo total gasto
    const timeGastoEstaFase = phaseDurations[currentPhase.id] * 60 - timeLeft;

    // Tempo gasto em fases anteriores
    let tempoFasesAnteriores = 0;
    DEFAULT_PHASES.slice(0, currentPhaseIdx).forEach(phase => {
      tempoFasesAnteriores += phaseDurations[phase.id] * 60;
    });

    const tempoTotalGasto = tempoFasesAnteriores + timeGastoEstaFase;

    // Salvar tempo total para usar no saveExameDiario
    setTempoGastoTotal(tempoTotalGasto);

    // Mostrar o exame com o tempo real gasto
    const horas = Math.floor(tempoTotalGasto / 60);
    const minutos = tempoTotalGasto % 60;
    toast.info(`Você estudou ${horas}h${minutos > 0 ? ` ${minutos}min` : ''} 📚`);
    setShowExame(true);
  };

  const updateDuration = (phase: Phase, minutes: number) => {
    setPhaseDurations(prev => ({ ...prev, [phase]: minutes }));
    if (phase === currentPhase.id && !isActive) {
      setTimeLeft(minutes * 60);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const total = phaseDurations[currentPhase.id] * 60;
    if (total === 0) return 0;
    return ((total - timeLeft) / total) * 100;
  };

  const totalMinutes = Object.values(phaseDurations).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner text="Carregando sessão de estudo..." size="lg" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Sessão de Estudo - Alvo Diário</title>
        <meta name="description" content="Sessão de estudo estruturada em 3 fases" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-5xl">

          {/* Header: matéria do dia */}
          {schedule && todaySubject && (
            <Card className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Matéria do Dia · Ciclo {cycleInfo?.cycleNumber}, Dia {cycleInfo?.dayInCycle}
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
                  <option value="" disabled>Matéria</option>
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
                    {phase.icon}
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
                  {currentPhase.icon}
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
                      {Math.round(getProgress())}% concluído
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
                      title="Avançar para próxima fase"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  )}

                  <Button
                    size="lg"
                    variant="destructive"
                    className="h-14 px-8 rounded-full text-base shadow-lg"
                    onClick={finalizarSessao}
                    title="Finalizar sessão e responder exame"
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
                  {currentPhase.icon}
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

              {/* Configurações de duração */}
              <Card>
                <button
                  className="w-full flex items-center justify-between text-sm font-semibold mb-0"
                  onClick={() => setShowSettings(v => !v)}
                >
                  <span className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-muted-foreground" />
                    Personalizar durações
                  </span>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showSettings ? 'rotate-90' : ''}`} />
                </button>

                {showSettings && (
                  <div className="mt-4 space-y-5">
                    {DEFAULT_PHASES.map(phase => (
                      <div key={phase.id}>
                        <Label className={`flex justify-between text-xs mb-2 ${phase.color}`}>
                          <span className="flex items-center gap-1">{phase.icon} {phase.label}</span>
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

              {/* Matéria (se não tiver cronograma) */}
              {!schedule && (
                <Card>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Matéria
                  </h3>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    disabled={isActive}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  >
                    <option value="" disabled>Selecione uma matéria</option>
                    {subjects.map((s, i) => <option key={i} value={s}>{s}</option>)}
                  </select>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal Exame Diário */}
      {showExame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Exame Diário</h2>
                  <p className="text-xs text-muted-foreground">Avalie sua sessão de hoje</p>
                </div>
              </div>
              <button
                onClick={() => setShowExame(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Perguntas */}
            <div className="p-6 space-y-6">
              {(['Disciplina', 'Aprendizado', 'Prática', 'Progresso'] as const).map(categoria => {
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
                              onClick={() => setExamAnswers(prev => ({ ...prev, [q.id]: true }))}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                examAnswers[q.id] === true
                                  ? 'bg-green-500 text-white shadow-sm'
                                  : 'bg-background border border-border text-muted-foreground hover:border-green-500 hover:text-green-500'
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" /> Sim
                            </button>
                            <button
                              onClick={() => setExamAnswers(prev => ({ ...prev, [q.id]: false }))}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                examAnswers[q.id] === false
                                  ? 'bg-destructive text-white shadow-sm'
                                  : 'bg-background border border-border text-muted-foreground hover:border-destructive hover:text-destructive'
                              }`}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" /> Não
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Pontuação parcial */}
              {Object.keys(examAnswers).length > 0 && (
                <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl">
                  <span className="text-sm font-medium">Critérios cumpridos</span>
                  <span className="font-bold text-primary text-lg">
                    {Object.values(examAnswers).filter(Boolean).length}/{EXAM_QUESTIONS.length}
                  </span>
                </div>
              )}

              {/* Observações */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Observações (opcional)
                </Label>
                <textarea
                  value={examObservacoes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setExamObservacoes(e.target.value)}
                  placeholder="O que foi difícil hoje? O que precisa melhorar amanhã?"
                  rows={3}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Botão concluir */}
              <Button
                onClick={saveExameDiario}
                disabled={savingExame || Object.keys(examAnswers).length < EXAM_QUESTIONS.length}
                className="w-full h-12 text-base"
              >
                {savingExame ? 'Salvando...' : 'Concluir Sessão'}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                {EXAM_QUESTIONS.length - Object.keys(examAnswers).length > 0
                  ? `Responda mais ${EXAM_QUESTIONS.length - Object.keys(examAnswers).length} pergunta(s) para concluir`
                  : 'Todas as perguntas respondidas ✓'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudySessionPage;
