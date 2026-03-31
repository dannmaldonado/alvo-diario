import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { CronogramaService } from '@/services/cronograma.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, RotateCcw, BookOpen, Coffee, Settings2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { Cronograma, Materia } from '@/types';
import { Card } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import SubjectBadge from '@/components/SubjectBadge';
import { useScheduleCalculator } from '@/hooks';

const StudySessionPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { getCurrentSubject, getCycleInfo } = useScheduleCalculator();

  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<Cronograma | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [todaySubject, setTodaySubject] = useState<Materia | null>(null);
  const [cycleInfo, setCycleInfo] = useState<{ cycleNumber: number; dayInCycle: number } | null>(null);
  const [studyDuration, setStudyDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch schedule on mount
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

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
      } catch (error) {
        console.error('Error fetching schedule:', error);
        toast.error('Não foi possível carregar seu cronograma.');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer logic using ref to avoid dependency loops
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsActive(false);
            if (!isBreak) {
              toast.success('Sessão de estudo concluída!');
            } else {
              toast.success('Pausa finalizada! Pronto para voltar aos estudos?');
              setIsBreak(false);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]); // only depends on isActive

  // Reset timer when duration or mode changes (only when paused)
  useEffect(() => {
    if (!isActive) {
      setTimeLeft((isBreak ? breakDuration : studyDuration) * 60);
    }
  }, [studyDuration, breakDuration, isBreak]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTimer = () => {
    if (!selectedSubject && !isBreak) {
      toast.error('Selecione uma matéria antes de começar.');
      return;
    }
    setIsActive(prev => !prev);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft((isBreak ? breakDuration : studyDuration) * 60);
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calculateProgress = () => {
    const total = (isBreak ? breakDuration : studyDuration) * 60;
    if (total === 0) return 0;
    return ((total - timeLeft) / total) * 100;
  };

  return (
    <>
      <Helmet>
        <title>Sessão de Estudo - Alvo Diário</title>
        <meta name="description" content="Timer Pomodoro para seus estudos" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 flex flex-col items-center max-w-5xl">

          {loading && (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner text="Carregando sua sessão de estudo..." size="lg" />
            </div>
          )}

          {!loading && (
            <>
              {schedule && todaySubject && (
                <Card className="w-full mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <CalendarDays className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">
                        Matéria do Dia (Ciclo {cycleInfo?.cycleNumber}, Dia {cycleInfo?.dayInCycle})
                      </p>
                      <div className="mt-1">
                        <SubjectBadge subject={todaySubject} size="md" />
                      </div>
                    </div>
                  </div>
                  {todaySubject && selectedSubject !== todaySubject.nome && (
                    <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full font-medium">
                      Estudando matéria diferente do cronograma
                    </div>
                  )}
                </Card>
              )}

              <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Timer */}
                <div className="lg:col-span-2 flex flex-col items-center">
                  <div className={`w-full rounded-3xl p-8 sm:p-12 shadow-lg transition-colors duration-500 ${
                    isBreak ? 'bg-secondary/10 border border-secondary/20' : 'bg-card border border-border'
                  }`}>

                    <div className="flex justify-center mb-8">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                        isBreak ? 'bg-secondary/20 text-secondary-foreground' : 'bg-primary/10 text-primary'
                      }`}>
                        {isBreak ? <Coffee className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                        {isBreak ? 'Pausa' : 'Foco nos Estudos'}
                      </div>
                    </div>

                    <div className="relative flex justify-center items-center mb-12 min-h-[16rem] sm:min-h-[20rem]">
                      <svg className="absolute w-64 h-64 sm:w-80 sm:h-80 -rotate-90 transform" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="48" className="stroke-muted fill-none" strokeWidth="2" />
                        <circle
                          cx="50" cy="50" r="48"
                          className={`fill-none transition-all duration-1000 ease-linear ${
                            isBreak ? 'stroke-secondary' : 'stroke-primary'
                          }`}
                          strokeWidth="2"
                          strokeDasharray="301.59"
                          strokeDashoffset={301.59 - (301.59 * calculateProgress()) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="text-6xl sm:text-8xl font-bold tabular-nums tracking-tighter z-10">
                        {formatTime(timeLeft)}
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-4">
                      <Button
                        size="lg"
                        variant="outline"
                        className="h-14 w-14 rounded-full p-0"
                        onClick={resetTimer}
                        disabled={timeLeft === (isBreak ? breakDuration : studyDuration) * 60 && !isActive}
                      >
                        <RotateCcw className="h-6 w-6" />
                      </Button>

                      <Button
                        size="lg"
                        className={`h-16 px-8 rounded-full text-lg shadow-lg transition-transform active:scale-95 ${
                          isBreak ? 'bg-secondary hover:bg-secondary/90 text-secondary-foreground' : ''
                        }`}
                        onClick={toggleTimer}
                      >
                        {isActive
                          ? <><Pause className="mr-2 h-6 w-6 fill-current" /> Pausar</>
                          : <><Play className="mr-2 h-6 w-6 fill-current" /> Começar</>
                        }
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  <Card>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      Matéria Atual
                    </h3>
                    <div className="space-y-2">
                      <Label>Selecione o que vai estudar</Label>
                      <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        disabled={isActive && !isBreak}
                        className="w-full h-12 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="" disabled>Escolha uma matéria</option>
                        {subjects.map((subject, idx) => (
                          <option key={idx} value={subject}>{subject}</option>
                        ))}
                      </select>
                      {subjects.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Adicione matérias no seu cronograma primeiro.
                        </p>
                      )}
                    </div>
                  </Card>

                  <Card>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Settings2 className="w-5 h-5 text-muted-foreground" />
                      Configurações
                    </h3>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="flex justify-between">
                          <span>Tempo de Estudo</span>
                          <span className="text-muted-foreground font-medium">{studyDuration} min</span>
                        </Label>
                        <Input
                          type="range"
                          min="5" max="120" step="5"
                          value={studyDuration}
                          onChange={(e) => setStudyDuration(parseInt(e.target.value))}
                          disabled={isActive}
                          className="cursor-pointer accent-primary"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="flex justify-between">
                          <span>Tempo de Pausa</span>
                          <span className="text-muted-foreground font-medium">{breakDuration} min</span>
                        </Label>
                        <Input
                          type="range"
                          min="1" max="30" step="1"
                          value={breakDuration}
                          onChange={(e) => setBreakDuration(parseInt(e.target.value))}
                          disabled={isActive}
                          className="cursor-pointer accent-secondary"
                        />
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default StudySessionPage;
