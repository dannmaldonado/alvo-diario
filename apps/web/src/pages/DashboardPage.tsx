
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CronogramaService } from '@/services/cronograma.service';
import { MetasService } from '@/services/metas.service';
import { SessoesService } from '@/services/sessoes.service';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Flame, Play, CalendarDays, ArrowRight, BookOpen, BarChart3, Clock, Target } from 'lucide-react';
import { toast } from 'sonner';

import SubjectBadge from '@/components/SubjectBadge';
import { useScheduleCalculator } from '@/hooks';

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { getCurrentSubject, getCycleInfo } = useScheduleCalculator();
  
  const [loading, setLoading] = useState(true);
  const [cronograma, setCronograma] = useState(null);
  const [todayProgress, setTodayProgress] = useState({ horas_realizadas: 0, horas_meta: 0 });
  
  // Derived schedule state
  const [todaySubject, setTodaySubject] = useState(null);
  const [tomorrowSubject, setTomorrowSubject] = useState(null);
  const [cycleInfo, setCycleInfo] = useState(null);

  // Monthly Stats State
  const [monthlyStats, setMonthlyStats] = useState({
    totalHours: 0,
    topSubject: null,
    avgSessionMins: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Load active cronograma via service
      const activeSchedule = await CronogramaService.getActive(currentUser.id);

      if (activeSchedule) {
        setCronograma(activeSchedule as any);

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        setTodaySubject(getCurrentSubject(activeSchedule as unknown as any, today));
        setTomorrowSubject(getCurrentSubject(activeSchedule as unknown as any, tomorrow));
        setCycleInfo(getCycleInfo(activeSchedule as unknown as any, today));
      }

      // 2. Load today's progress via service
      const todayStr = new Date().toISOString().split('T')[0];
      let meta = await MetasService.getByDate(currentUser.id, todayStr);

      if (!meta) {
        try {
          meta = await MetasService.create({
            user_id: currentUser.id,
            data: todayStr,
            horas_meta: currentUser.meta_diaria_horas || 4,
            horas_realizadas: 0,
            status: 'pendente'
          });
        } catch (error) {
          console.error('Error creating daily goal:', error);
          meta = { id: '', user_id: currentUser.id, data: todayStr, horas_meta: currentUser.meta_diaria_horas || 4, horas_realizadas: 0, status: 'pendente', created: '', updated: '' };
        }
      }

      setTodayProgress({ horas_realizadas: meta.horas_realizadas || 0, horas_meta: meta.horas_meta || 0 });

      // 3. Load Monthly Stats via service
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const monthSessions = await SessoesService.getByDateRange(currentUser.id, startOfMonth, endOfMonth);

      if (monthSessions.length > 0) {
        let totalMins = 0;
        const subjectCounts: Record<string, number> = {};

        monthSessions.forEach(s => {
          const duracao = s.duracao_minutos || 0;
          const materia = s.materia;
          totalMins += duracao;
          subjectCounts[materia] = (subjectCounts[materia] || 0) + duracao;
        });

        let topSubj: string | null = null;
        let maxMins = 0;
        for (const [subj, mins] of Object.entries(subjectCounts)) {
          if ((mins as number) > maxMins) {
            maxMins = mins as number;
            topSubj = subj;
          }
        }

        setMonthlyStats({
          totalHours: Number((totalMins / 60).toFixed(1)),
          topSubject: topSubj,
          avgSessionMins: Math.round(totalMins / monthSessions.length)
        });
      }

    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Erro ao carregar dashboard. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getTodayProgressPercentage = () => {
    const meta = todayProgress.horas_meta || 1;
    const realizado = todayProgress.horas_realizadas || 0;
    return Math.min(Math.round((realizado / meta) * 100), 100);
  };

  if (loading) {
    return (
      <>
        <Helmet>        <title>Dashboard - Alvo Diário</title></Helmet>
        <div className="min-h-screen bg-background">

          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <Skeleton className="h-12 w-64 mb-8" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Skeleton className="h-64 md:col-span-2 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
                <title>Dashboard - Alvo Diário</title>
        <meta name="description" content="Acompanhe seu progresso nos estudos" />
      </Helmet>

      <div className="min-h-screen bg-background">


        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Welcome Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="mb-2 text-3xl font-bold md:text-4xl tracking-tight">
                Olá, {currentUser?.nome?.split(' ')[0] || 'Estudante'}
              </h1>
              <p className="text-lg text-muted-foreground">
                Pronto para mais um dia de preparação?
              </p>
            </div>
            
            <div className="flex gap-4">
              <div className="flex items-center gap-3 bg-card border border-border px-4 py-2 rounded-xl shadow-sm">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Pontos</p>
                  <p className="font-bold leading-none">{currentUser?.pontos_totais || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-card border border-border px-4 py-2 rounded-xl shadow-sm">
                <div className="bg-secondary/10 p-2 rounded-lg">
                  <Flame className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ofensiva</p>
                  <p className="font-bold leading-none">{currentUser?.streak_atual || 0} dias</p>
                </div>
              </div>
            </div>
          </div>

          {cronograma ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Hero Card: Today's Subject */}
              <div className="md:col-span-2 bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[320px]">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 text-primary/5 pointer-events-none">
                  <BookOpen className="w-64 h-64" />
                </div>
                
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                    <CalendarDays className="w-4 h-4" />
                    Matéria de Hoje
                  </div>
                  
                  <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-balance">
                    {todaySubject?.name || 'Revisão Geral'}
                  </h2>
                  
                  <div className="flex items-center gap-3 text-muted-foreground mb-8">
                    <SubjectBadge subject={todaySubject} size="md" />
                    <span>•</span>
                    <span>Ciclo {cycleInfo?.cycleNumber}</span>
                  </div>
                </div>

                <div className="relative z-10 mt-auto">
                  <Button size="lg" asChild className="w-full sm:w-auto rounded-xl h-14 px-8 text-lg shadow-md hover:shadow-xl transition-all">
                    <Link to="/study-session">
                      <Play className="mr-2 h-5 w-5 fill-current" />
                      Iniciar Sessão
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Cycle Progress Card */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
                <h3 className="text-lg font-semibold mb-6">Progresso do Ciclo</h3>
                
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-4xl font-bold text-primary">{cycleInfo?.dayInCycle}</p>
                      <p className="text-sm text-muted-foreground font-medium">Dia atual</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-muted-foreground">{cycleInfo?.totalDaysInCycle}</p>
                      <p className="text-sm text-muted-foreground font-medium">Total de dias</p>
                    </div>
                  </div>
                  
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden mt-4">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${(cycleInfo?.dayInCycle / cycleInfo?.totalDaysInCycle) * 100}%` }}
                    />
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Ciclo {cycleInfo?.cycleNumber} em andamento
                  </p>
                </div>
              </div>

              {/* Daily Goal Card */}
              <div className="md:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6">
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" className="stroke-muted fill-none" strokeWidth="8" />
                    <circle 
                      cx="50" cy="50" r="44" 
                      className="stroke-secondary fill-none transition-all duration-1000" 
                      strokeWidth="8"
                      strokeDasharray="276.46"
                      strokeDashoffset={276.46 - (276.46 * getTodayProgressPercentage()) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-xl font-bold">{getTodayProgressPercentage()}%</span>
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-semibold mb-1">Meta Diária</h3>
                  <p className="text-muted-foreground mb-3">
                    Você estudou <strong className="text-foreground">{todayProgress.horas_realizadas?.toFixed(1) || 0}h</strong> de <strong className="text-foreground">{todayProgress.horas_meta || 0}h</strong> hoje.
                  </p>
                  {getTodayProgressPercentage() >= 100 ? (
                    <span className="inline-flex items-center text-sm font-medium text-secondary bg-secondary/10 px-3 py-1 rounded-full">
                      Meta atingida! 🎉
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Continue assim!</span>
                  )}
                </div>
              </div>

              {/* Next Subject Card */}
              <div className="bg-muted/50 border border-border rounded-2xl p-6 flex flex-col justify-center">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Amanhã</h3>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center shadow-sm shrink-0">
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg line-clamp-2">{tomorrowSubject?.name || 'Revisão'}</p>
                    <SubjectBadge subject={tomorrowSubject} size="sm" className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Monthly Stats Section */}
              <div className="md:col-span-3 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Estatísticas do Mês</h3>
                  <Button variant="ghost" size="sm" asChild className="text-primary">
                    <Link to="/analise">Ver Análise Completa <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg shrink-0">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Total Estudado</p>
                      <p className="text-2xl font-bold">{monthlyStats.totalHours}h</p>
                    </div>
                  </div>
                  
                  <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
                    <div className="bg-secondary/10 p-3 rounded-lg shrink-0">
                      <Target className="h-6 w-6 text-secondary" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm text-muted-foreground font-medium">Mais Estudada</p>
                      <p className="text-lg font-bold truncate" title={monthlyStats.topSubject || 'Nenhuma'}>
                        {monthlyStats.topSubject || 'Nenhuma'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
                    <div className="bg-amber-500/10 p-3 rounded-lg shrink-0">
                      <BarChart3 className="h-6 w-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Média por Sessão</p>
                      <p className="text-2xl font-bold">{monthlyStats.avgSessionMins} min</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-sm max-w-2xl mx-auto mt-12">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CalendarDays className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Nenhum cronograma ativo</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Crie seu cronograma de estudos baseado no edital para começar a acompanhar seu progresso diário.
              </p>
              <Button size="lg" asChild className="rounded-xl px-8">
                <Link to="/cronograma">Criar Meu Cronograma</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
