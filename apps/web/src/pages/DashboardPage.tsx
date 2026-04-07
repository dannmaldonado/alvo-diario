
import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trophy, Flame, Play, CalendarDays, ArrowRight, BookOpen, BarChart3, Clock, Target, AlertTriangle, RefreshCw } from 'lucide-react';
import { Materia } from '@/types';

import SubjectBadge from '@/components/SubjectBadge';
import { Card, StatsCard } from '@/components/Card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardData } from '@/hooks/useDashboardData';
import MonthlyStatsChart from '@/components/dashboard/MonthlyStatsChart';

const DashboardPage: React.FC = () => {
  const {
    currentUser,
    cronograma,
    todayProgress,
    monthlyStats,
    monthlySessions,
    todaySubject,
    tomorrowSubject,
    cycleInfo,
    isLoading,
    error,
  } = useDashboardData();

  const getTodayProgressPercentage = () => {
    const meta = todayProgress.horas_meta || 1;
    const realizado = todayProgress.horas_realizadas || 0;
    return Math.min(Math.round((realizado / meta) * 100), 100);
  };

  if (error) {
    return (
      <>
        <Helmet><title>Dashboard - Alvo Diario</title></Helmet>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="bg-card border border-destructive/30 rounded-2xl p-12 text-center shadow-sm max-w-2xl mx-auto mt-12">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Erro ao carregar dados</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                {error instanceof Error ? error.message : 'Ocorreu um erro inesperado ao carregar o dashboard.'}
              </p>
              <Button size="lg" onClick={() => window.location.reload()} className="rounded-xl px-8">
                <RefreshCw className="mr-2 h-5 w-5" />
                Tentar Novamente
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Helmet><title>Dashboard - Alvo Diario</title></Helmet>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header skeleton */}
            <div className="mb-8 animate-pulse">
              <div className="h-8 w-48 bg-muted rounded-lg mb-2" />
              <div className="h-5 w-72 bg-muted rounded-lg" />
            </div>

            {/* Cards grid with animation */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Skeleton className="h-48 rounded-2xl md:col-span-2" />
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl md:col-span-2" />
              <Skeleton className="h-48 rounded-2xl" />
            </div>

            {/* Stats section */}
            <div className="mt-8">
              <Skeleton className="h-6 w-40 rounded-lg mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
                <title>Dashboard - Alvo Diario</title>
        <meta name="description" content="Acompanhe seu progresso nos estudos" />
      </Helmet>

      <div className="min-h-screen bg-background">


        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Welcome Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="mb-2 text-3xl font-bold md:text-4xl tracking-tight">
                Ola, {currentUser?.nome?.split(' ')[0] || 'Estudante'}
              </h1>
              <p className="text-lg text-muted-foreground">
                Pronto para mais um dia de preparacao?
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
              <div className="md:col-span-2 bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[320px] animate-slide-up transition-all duration-250 hover:shadow-xl">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 text-primary/5 pointer-events-none">
                  <BookOpen className="w-64 h-64" />
                </div>

                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                    <CalendarDays className="w-4 h-4" />
                    Materia de Hoje
                  </div>

                  <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-balance">
                    {typeof todaySubject === 'string' ? todaySubject : (todaySubject?.nome || 'Revisao Geral')}
                  </h2>

                  <div className="flex items-center gap-3 text-muted-foreground mb-8">
                    <SubjectBadge subject={todaySubject} size="md" />
                    <span>-</span>
                    <span>Ciclo {cycleInfo?.cycleNumber}</span>
                  </div>
                </div>

                <div className="relative z-10 mt-auto">
                  <Button size="lg" asChild className="w-full sm:w-auto rounded-xl h-14 px-8 text-lg shadow-md hover:shadow-xl transition-all text-black dark:text-black hover:text-black dark:hover:text-black">
                    <Link to="/study-session">
                      <Play className="mr-2 h-5 w-5 fill-current" />
                      Iniciar Sessao
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Cycle Progress Card */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col animate-slide-up transition-all duration-250 hover:shadow-lg" style={{ animationDelay: '0.1s' }}>
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
                      style={{ width: `${cycleInfo && cycleInfo.dayInCycle && cycleInfo.totalDaysInCycle ? (cycleInfo.dayInCycle / cycleInfo.totalDaysInCycle) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Ciclo {cycleInfo?.cycleNumber} em andamento
                  </p>
                </div>
              </div>

              {/* Daily Goal Card */}
              <div className="md:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6 animate-slide-up transition-all duration-250 hover:shadow-lg" style={{ animationDelay: '0.2s' }}>
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
                  <h3 className="text-xl font-semibold mb-1">Meta Diaria</h3>
                  <p className="text-muted-foreground mb-3">
                    Voce estudou <strong className="text-foreground">{todayProgress.horas_realizadas?.toFixed(1) || 0}h</strong> de <strong className="text-foreground">{todayProgress.horas_meta || 0}h</strong> hoje.
                  </p>
                  {getTodayProgressPercentage() >= 100 ? (
                    <span className="inline-flex items-center text-sm font-medium text-secondary bg-secondary/10 px-3 py-1 rounded-full">
                      Meta atingida!
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Continue assim!</span>
                  )}
                </div>
              </div>

              {/* Next Subject Card */}
              <div className="bg-muted/50 border border-border rounded-2xl p-6 flex flex-col justify-center animate-slide-up transition-all duration-250 hover:bg-muted" style={{ animationDelay: '0.3s' }}>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Amanha</h3>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center shadow-sm shrink-0">
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg line-clamp-2">{typeof tomorrowSubject === 'string' ? tomorrowSubject : (tomorrowSubject?.nome || 'Revisao')}</p>
                    <SubjectBadge subject={tomorrowSubject} size="sm" className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Monthly Stats Section */}
              <div className="md:col-span-3 mt-4 animate-slide-up">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Estatisticas do Mes</h3>
                  <Button variant="ghost" size="sm" asChild className="text-primary hover:bg-primary/10">
                    <Link to="/analise">
                      Ver Analise Completa <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <StatsCard
                      label="Total Estudado"
                      value={`${monthlyStats.totalHours}h`}
                      icon={<Clock className="h-5 w-5" />}
                      description="Horas de estudo este mes"
                    />
                  </div>

                  <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <StatsCard
                      label="Mais Estudada"
                      value={monthlyStats.topSubject || 'Nenhuma'}
                      icon={<Target className="h-5 w-5" />}
                      description="Sua materia favorita"
                    />
                  </div>

                  <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <StatsCard
                      label="Media por Sessao"
                      value={`${monthlyStats.avgSessionMins}m`}
                      icon={<BarChart3 className="h-5 w-5" />}
                      description="Tempo medio de estudo"
                    />
                  </div>
                </div>

                {/* Monthly Hours Bar Chart */}
                <div className="mt-6 bg-card border border-border rounded-2xl p-6 shadow-sm animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Horas por Dia</h4>
                  <MonthlyStatsChart sessions={monthlySessions} />
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
                Crie seu cronograma de estudos baseado no edital para comecar a acompanhar seu progresso diario.
              </p>
              <Button size="lg" asChild className="rounded-xl px-8 text-black dark:text-black hover:text-black dark:hover:text-black">
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
