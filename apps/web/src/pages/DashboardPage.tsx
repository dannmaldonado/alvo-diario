
import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trophy, Flame, Play, CalendarDays, ArrowRight, BookOpen, BarChart3, Clock, Target, AlertTriangle, RefreshCw, Award, Brain } from 'lucide-react';
import { Materia, DailyRatingValue } from '@/types';

import SubjectBadge from '@/components/SubjectBadge';
import { Card, StatsCard } from '@/components/Card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useQuestoesRevisao } from '@/hooks/queries/useQuestoes';
import MonthlyStatsChart from '@/components/dashboard/MonthlyStatsChart';
import { DailyRating } from '@/components/dashboard/DailyRating';
import { MissoesWidget } from '@/components/dashboard/MissoesWidget';

const DashboardPage: React.FC = () => {
  const {
    currentUser,
    cronograma,
    todayMeta,
    todayProgress,
    todaySessionMinutes,
    monthlyStats,
    monthlySessions,
    todaySubject,
    tomorrowSubject,
    cycleInfo,
    updateRating,
    isLoading,
    error,
  } = useDashboardData();

  const revisaoQuery = useQuestoesRevisao();
  const revisaoPendente = revisaoQuery.data?.length ?? 0;

  const handleRatingChange = (rating: DailyRatingValue) => {
    if (todayMeta?.id) {
      updateRating.mutate({ id: todayMeta.id, avaliacao_diaria: rating });
    }
  };

  const getTodayProgressPercentage = () => {
    const meta = todayProgress.horas_meta || 1;
    const realizado = todayProgress.horas_realizadas || 0;
    return Math.min(Math.round((realizado / meta) * 100), 100);
  };

  if (error) {
    return (
      <>
        <Helmet><title>Dashboard - Alvo Diario</title></Helmet>
        <div>
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
        <div>
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

      <div>
        <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
          {/* Welcome Header */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="mb-1 text-2xl font-bold md:text-3xl tracking-tight">
                Olá, {currentUser?.nome?.split(' ')[0] || 'Estudante'} 👋
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Pronto para mais um dia de preparação?
              </p>
            </div>

            <div className="flex gap-2 shrink-0">
              <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-xl shadow-sm">
                <Trophy className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-none">Pontos</p>
                  <p className="font-bold text-sm leading-tight">{currentUser?.pontos_totais || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-xl shadow-sm group relative">
                <Flame className="h-4 w-4 text-secondary shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-none">Ofensiva</p>
                  <p className="font-bold text-sm leading-tight">{currentUser?.streak_atual || 0}d</p>
                </div>
                {/* Tooltip explaining streak logic */}
                <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg text-xs text-muted-foreground whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-10">
                  Dias consecutivos com avaliação 3+ estrelas
                </div>
              </div>
            </div>
          </div>

          {cronograma ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

              {/* Hero Card: Today's Subject */}
              <div className="md:col-span-2 bg-card border border-border rounded-2xl p-5 sm:p-8 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[260px] md:min-h-[320px] animate-slide-up transition-all duration-250 hover:shadow-xl">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 text-primary/5 pointer-events-none">
                  <BookOpen className="w-64 h-64" />
                </div>

                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                    <CalendarDays className="w-4 h-4" />
                    Matéria de Hoje
                  </div>

                  <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3 text-balance">
                    {typeof todaySubject === 'string' ? todaySubject : (todaySubject?.nome || 'Revisão Geral')}
                  </h2>

                  <div className="flex items-center gap-3 text-muted-foreground mb-6">
                    <SubjectBadge subject={todaySubject} size="md" />
                    <span>·</span>
                    <span className="text-sm">Ciclo {cycleInfo?.cycleNumber}</span>
                  </div>
                </div>

                <div className="relative z-10 mt-auto">
                  <Button size="lg" asChild className="w-full sm:w-auto rounded-xl h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg shadow-md hover:shadow-xl transition-all text-black dark:text-black hover:text-black dark:hover:text-black">
                    <Link to="/study-session">
                      <Play className="mr-2 h-5 w-5 fill-current" />
                      Iniciar Sessão
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Cycle Progress Card */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col animate-slide-up transition-all duration-250 hover:shadow-lg" style={{ animationDelay: '0.1s' }}>
                <h3 className="text-base font-semibold mb-4">Progresso do Ciclo</h3>

                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-3xl font-bold text-primary">{cycleInfo?.dayInCycle}</p>
                      <p className="text-xs text-muted-foreground font-medium">Dia atual</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold text-muted-foreground">{cycleInfo?.totalDaysInCycle}</p>
                      <p className="text-xs text-muted-foreground font-medium">Total dias</p>
                    </div>
                  </div>

                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden mt-3">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${cycleInfo && cycleInfo.dayInCycle && cycleInfo.totalDaysInCycle ? (cycleInfo.dayInCycle / cycleInfo.totalDaysInCycle) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-center text-xs text-muted-foreground mt-3">
                    Ciclo {cycleInfo?.cycleNumber} em andamento
                  </p>
                </div>
              </div>

              {/* Daily Goal Card */}
              <div className="md:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center gap-5 animate-slide-up transition-all duration-250 hover:shadow-lg" style={{ animationDelay: '0.2s' }}>
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

                  {/* Daily Rating */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Como foi sua dedicacao hoje?</p>
                    <DailyRating
                      value={todayMeta?.avaliacao_diaria}
                      onChange={handleRatingChange}
                      disabled={!todayMeta?.id || updateRating.isPending}
                      showPointsMultiplier
                      todaySessionMinutes={todaySessionMinutes}
                    />
                    {/* Perfect Day Badge */}
                    {todayMeta?.avaliacao_diaria === 5 && getTodayProgressPercentage() >= 100 && (
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                        <Award className="h-4 w-4" />
                        <span className="text-sm font-semibold">Dia Perfeito! +2x pontos</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Next Subject Card */}
              <div className="bg-muted/50 border border-border rounded-2xl p-5 flex flex-col justify-center animate-slide-up transition-all duration-250 hover:bg-muted" style={{ animationDelay: '0.3s' }}>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Amanhã</h3>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center shadow-sm shrink-0">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-base line-clamp-2">{typeof tomorrowSubject === 'string' ? tomorrowSubject : (tomorrowSubject?.nome || 'Revisão')}</p>
                    <SubjectBadge subject={tomorrowSubject} size="sm" className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Revision Queue Widget — only shown when there are pending reviews */}
              {revisaoPendente > 0 && (
                <div className="md:col-span-3 bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-center gap-5 animate-slide-up" style={{ animationDelay: '0.35s' }}>
                  <div className="shrink-0 p-3 rounded-xl bg-primary/10">
                    <Brain className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base">
                      {revisaoPendente} {revisaoPendente === 1 ? 'questão' : 'questões'} para revisar hoje
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Repetição espaçada — revise para não esquecer o que aprendeu.
                    </p>
                  </div>
                  <Button asChild size="sm" className="shrink-0">
                    <Link to="/revisao">
                      Revisar Agora <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}

              {/* Daily Missions Widget */}
              <div className="md:col-span-3 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <MissoesWidget />
              </div>

              {/* Monthly Stats Section */}
              <div className="md:col-span-3 mt-2 animate-slide-up">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold">Estatísticas do Mês</h3>
                  <Button variant="ghost" size="sm" asChild className="text-primary hover:bg-primary/10">
                    <Link to="/analise">
                      Ver Análise <ArrowRight className="ml-2 h-4 w-4" />
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
