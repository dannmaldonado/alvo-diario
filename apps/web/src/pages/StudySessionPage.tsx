
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { CronogramaService } from '@/services/cronograma.service';
import { SessoesService } from '@/services/sessoes.service';
import { AuthService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, RotateCcw, BookOpen, Coffee, Trophy, Settings2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

import SubjectBadge from '@/components/SubjectBadge';
import { useScheduleCalculator } from '@/hooks';

const StudySessionPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { getCurrentSubject, getCycleInfo } = useScheduleCalculator();
  
  // Schedule State
  const [schedule, setSchedule] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [todaySubject, setTodaySubject] = useState(null);
  const [cycleInfo, setCycleInfo] = useState(null);
  
  // Settings State
  const [studyDuration, setStudyDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [selectedSubject, setSelectedSubject] = useState('');
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(studyDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  
  // Modal & Saving State
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch schedule and subjects
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const cronogramas = await CronogramaService.getAll(currentUser.id);

        if (cronogramas.length > 0) {
          const activeSchedule = cronogramas[0] as any;
          setSchedule(activeSchedule);

          if (activeSchedule.materias) {
            const subjectNames = activeSchedule.materias.map((m: any) => m.name);
            setSubjects(subjectNames);

            // Calculate today's subject
            const today = new Date();
            const current = getCurrentSubject(activeSchedule, today);
            const info = getCycleInfo(activeSchedule, today);

            setTodaySubject(current);
            setCycleInfo(info);

            // Auto-select today's subject if available
            if (current && (current as any).name) {
              setSelectedSubject((current as any).name);
            } else if (subjectNames.length > 0) {
              setSelectedSubject(subjectNames[0]);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
        toast.error('Não foi possível carregar seu cronograma.');
      }
    };
    
    fetchSchedule();
  }, [currentUser.id, getCurrentSubject, getCycleInfo]);

  // Update timer when duration settings change (only if not active)
  useEffect(() => {
    if (!isActive) {
      setTimeLeft((isBreak ? breakDuration : studyDuration) * 60);
    }
  }, [studyDuration, breakDuration, isBreak, isActive]);

  const playBeep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio not supported or blocked');
    }
  }, []);

  const handleTimerComplete = useCallback(() => {
    playBeep();
    
    if (!isBreak) {
      setShowCompletionModal(true);
    } else {
      toast.success('Pausa finalizada! Pronto para voltar aos estudos?');
      setIsBreak(false);
      setTimeLeft(studyDuration * 60);
    }
  }, [isBreak, playBeep, studyDuration]);

  // Timer Logic
  useEffect(() => {
    let interval = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      handleTimerComplete();
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft, handleTimerComplete]);

  const toggleTimer = () => {
    if (!selectedSubject && !isBreak) {
      toast.error('Selecione uma matéria antes de começar.');
      return;
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft((isBreak ? breakDuration : studyDuration) * 60);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calculateProgress = () => {
    const total = (isBreak ? breakDuration : studyDuration) * 60;
    return ((total - timeLeft) / total) * 100;
  };

  const saveSession = async () => {
    if (!selectedSubject) return;

    setSaving(true);
    try {
      const pontos = studyDuration; // 1 point per minute
      const today = new Date().toISOString().split('T')[0];

      // Save session via service
      await SessoesService.create({
        user_id: currentUser.id,
        cronograma_id: schedule?.id || '',
        materia: selectedSubject,
        data_sessao: today,
        duracao_minutos: studyDuration
      });

      // Update user points via service
      await AuthService.updateUser({
        pontos_totais: (currentUser.pontos_totais || 0) + pontos
      });

      toast.success(`Sessão registrada! +${pontos} pontos`);
      setShowCompletionModal(false);

      setIsBreak(true);
      setTimeLeft(breakDuration * 60);

    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Erro ao registrar a sessão de estudo.');
    } finally {
      setSaving(false);
    }
  };

  const skipSession = () => {
    setShowCompletionModal(false);
    setIsBreak(true);
    setTimeLeft(breakDuration * 60);
  };

  return (
    <>
      <Helmet>
        <title>Sessão de Estudo - Alvo Diário</title>
        <meta name="description" content="Timer Pomodoro para seus estudos" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">


        <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center max-w-5xl">
          
          {/* Schedule Banner */}
          {schedule && todaySubject && (
            <div className="w-full bg-card border border-border rounded-2xl p-4 mb-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Matéria do Dia (Ciclo {cycleInfo?.cycleNumber}, Dia {cycleInfo?.dayInCycle})</p>
                  <div className="mt-1">
                    <SubjectBadge subject={todaySubject} size="md" />
                  </div>
                </div>
              </div>
              {selectedSubject !== todaySubject.name && (
                <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full font-medium">
                  Estudando matéria diferente do cronograma
                </div>
              )}
            </div>
          )}

          <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Timer Area */}
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

                <div className="relative flex justify-center items-center mb-12">
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
                    {isActive ? (
                      <><Pause className="mr-2 h-6 w-6 fill-current" /> Pausar</>
                    ) : (
                      <><Play className="mr-2 h-6 w-6 fill-current" /> Começar</>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Settings Sidebar */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Matéria Atual
                </h3>
                
                <div className="space-y-2">
                  <Label>Selecione o que vai estudar</Label>
                  <Select 
                    value={selectedSubject} 
                    onValueChange={setSelectedSubject}
                    disabled={isActive && !isBreak}
                  >
                    <SelectTrigger className="w-full h-12">
                      <SelectValue placeholder="Escolha uma matéria" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.length > 0 ? (
                        subjects.map((subject, idx) => (
                          <SelectItem key={idx} value={subject}>{subject}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>Nenhuma matéria no cronograma</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {subjects.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Adicione matérias no seu cronograma primeiro.
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
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
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Completion Modal Overlay */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-3xl p-6 sm:p-8 max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Trophy className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Sessão Concluída!</h2>
              <p className="text-muted-foreground text-lg">
                Você completou {studyDuration} minutos de estudo.
              </p>
            </div>
            
            <div className="bg-muted/50 border border-border rounded-2xl p-5 mb-8 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground">Matéria:</span>
                <SubjectBadge subject={selectedSubject} size="sm" />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground">Pontos ganhos:</span>
                <span className="text-2xl font-bold text-primary">+{studyDuration} pts</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button size="lg" className="w-full h-14 text-lg rounded-xl" onClick={saveSession} disabled={saving}>
                {saving ? 'Registrando...' : 'Registrar e Iniciar Pausa'}
              </Button>
              <Button variant="ghost" className="w-full h-12 rounded-xl" onClick={skipSession} disabled={saving}>
                Pular registro
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudySessionPage;
