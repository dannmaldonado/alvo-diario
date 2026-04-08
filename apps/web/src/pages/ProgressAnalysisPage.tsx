import React from 'react';
import { Helmet } from 'react-helmet';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, Legend, type TooltipProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import { Clock, Calendar as CalendarIcon, TrendingUp, ArrowUpDown, BookOpen, Trophy, CheckCircle2, XCircle, PieChart as PieChartIcon, Flame, Star, Timer, Hash, AlertCircle } from 'lucide-react';
import { Card, StatsCard } from '@/components/Card';
import { RatingDistributionChart } from '@/components/analytics/RatingDistributionChart';
import { ActiveDaysChart } from '@/components/analytics/ActiveDaysChart';
import { PointsByRatingChart } from '@/components/analytics/PointsByRatingChart';
import {
  useProgressAnalytics,
  EXAM_QUESTIONS_META,
  type Period,
  type TableRowData,
} from '@/hooks/useProgressAnalytics';

// ============================================================================
// CUSTOM TOOLTIP (shared across charts)
// ============================================================================

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-lg">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color || (entry.fill as string | undefined) }}>
            {entry.name === 'hours' ? 'Horas' : String(entry.name)}: <span className="font-bold">{entry.value}h</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ============================================================================
// PERIOD FILTER OPTIONS
// ============================================================================

const PERIOD_OPTIONS: { id: Period; label: string }[] = [
  { id: '7days', label: 'Ultimos 7 Dias' },
  { id: 'week', label: 'Esta Semana' },
  { id: 'month', label: 'Este Mes' },
  { id: 'all', label: 'Todo Periodo' },
];

// ============================================================================
// MAIN PAGE
// ============================================================================

const ProgressAnalysisPage: React.FC = () => {
  const {
    stats, subjectData, evolutionData, tableData, examStats, ratingStats, allMetas, examesCount,
    period, setPeriod, handleSort,
    isLoading, error,
  } = useProgressAnalytics();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-[400px] rounded-2xl" />
            <Skeleton className="h-[400px] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erro ao carregar dados</h2>
            <p className="text-muted-foreground mb-4">
              Nao foi possivel carregar os dados de analise. Tente novamente mais tarde.
            </p>
            <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
          </Card>
        </div>
      </div>
    );
  }

  const periodLabel = period === 'all' ? 'Sempre' : 'Periodo';

  return (
    <>
      <Helmet>
        <title>Analise de Progresso - Alvo Diario</title>
        <meta name="description" content="Estatisticas detalhadas dos seus estudos" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-7xl">

          {/* Header with period filter */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold md:text-4xl tracking-tight mb-2">Analise de Progresso</h1>
              <p className="text-muted-foreground text-lg">Acompanhe sua evolucao e distribuicao de tempo.</p>
            </div>
            <div className="flex flex-wrap gap-2 bg-muted/50 p-1.5 rounded-xl border border-border">
              {PERIOD_OPTIONS.map(p => (
                <Button
                  key={p.id}
                  variant={period === p.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPeriod(p.id)}
                  className={`rounded-lg ${period === p.id ? 'shadow-sm' : 'hover:bg-background'}`}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard label="Total (Sempre)" value={`${stats.totalHoursAll}h`} icon={<Clock className="h-5 w-5" />} description={`${stats.totalSessions} sessoes`} />
            <StatsCard label="Este Mes" value={`${stats.totalHoursMonth}h`} icon={<CalendarIcon className="h-5 w-5" />} />
            <StatsCard label="Streak Atual" value={`${stats.streak} dias`} icon={<Flame className="h-5 w-5" />} description="Dias consecutivos com rating 3+" />
            <StatsCard label="Pontos Totais" value={stats.points} icon={<Star className="h-5 w-5" />} />
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard label="Esta Semana" value={`${stats.totalHoursWeek}h`} icon={<CalendarIcon className="h-5 w-5" />} />
            <StatsCard label="Media Diaria" value={`${stats.avgHoursPerDay}h`} icon={<TrendingUp className="h-5 w-5" />} />
            <StatsCard label="Maior Sessao" value={`${stats.longestSessionMinutes}min`} icon={<Timer className="h-5 w-5" />} />
            <StatsCard label="Total de Sessoes" value={stats.totalSessions} icon={<Hash className="h-5 w-5" />} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Bar Chart */}
            <Card className="flex flex-col animate-fade-in">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                Horas por Materia ({periodLabel})
              </h3>
              <div className="flex-1 min-h-[350px]">
                {subjectData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.4)' }} />
                      <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                        {subjectData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">Nenhum dado no periodo.</div>
                )}
              </div>
            </Card>

            {/* Line Chart */}
            <Card className="flex flex-col animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                Evolucao Acumulada ({periodLabel})
              </h3>
              <div className="flex-1 min-h-[350px]">
                {evolutionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolutionData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dy={10} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="hours"
                        name="Horas Acumuladas"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ r: 4, fill: 'hsl(var(--background))', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">Nenhum dado no periodo.</div>
                )}
              </div>
            </Card>

            {/* Pie Chart */}
            <Card className="flex flex-col lg:col-span-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-muted-foreground" />
                Distribuicao de Tempo ({periodLabel})
              </h3>
              <div className="flex-1 min-h-[400px] flex items-center justify-center">
                {subjectData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={subjectData}
                        cx="50%"
                        cy="50%"
                        innerRadius={100}
                        outerRadius={140}
                        paddingAngle={2}
                        dataKey="hours"
                        stroke="none"
                      >
                        {subjectData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span className="text-foreground font-medium ml-1">{value}</span>}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-muted-foreground">Nenhum dado no periodo.</div>
                )}
              </div>
            </Card>
          </div>

          {/* Daily Rating Distribution */}
          {ratingStats.totalRated > 0 && (
            <Card className="mb-8 animate-fade-in" style={{ animationDelay: '0.25s' }}>
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Avaliacao Diaria de Dedicacao
              </h3>
              <RatingDistributionChart
                distribution={ratingStats.ratingDistribution}
                avgRating={ratingStats.avgDailyRating}
                totalRated={ratingStats.totalRated}
              />

              {/* Active vs Inactive Days Summary */}
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Dias Ativos vs Inativos
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col items-center p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <span className="text-2xl font-bold text-emerald-500">{ratingStats.activeDays}</span>
                    <span className="text-sm text-muted-foreground">Dias Ativos</span>
                    <span className="text-xs text-muted-foreground mt-1">(rating 3+)</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                    <span className="text-2xl font-bold text-red-500">{ratingStats.inactiveDays}</span>
                    <span className="text-sm text-muted-foreground">Dias Inativos</span>
                    <span className="text-xs text-muted-foreground mt-1">(rating 1-2)</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-primary/10 rounded-xl border border-primary/20">
                    <span className="text-2xl font-bold text-primary">{ratingStats.activePercentage}%</span>
                    <span className="text-sm text-muted-foreground">Taxa de Dedicacao</span>
                    <span className="text-xs text-muted-foreground mt-1">Dias ativos / total</span>
                  </div>
                </div>

                {/* Active days progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Inativos ({ratingStats.inactiveDays})</span>
                    <span>Ativos ({ratingStats.activeDays})</span>
                  </div>
                  <div className="h-3 w-full bg-red-500/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${ratingStats.activePercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Active Days Weekly Chart */}
          {ratingStats.totalRated > 0 && (
            <Card className="mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Flame className="h-5 w-5 text-secondary" />
                Dias Ativos por Semana
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Dias com avaliacao 3+ estrelas contam como ativos para a ofensiva.
              </p>
              <ActiveDaysChart metas={allMetas} />
            </Card>
          )}

          {/* Points by Rating Chart */}
          {ratingStats.totalRated > 0 && (
            <Card className="mb-8 animate-fade-in" style={{ animationDelay: '0.35s' }}>
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Pontos por Avaliacao
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Correlacao entre sua avaliacao diaria e os pontos ganhos. Avaliacoes mais altas multiplicam seus pontos.
              </p>
              <PointsByRatingChart
                pointsByRating={ratingStats.pointsByRating}
                basePointsEarned={ratingStats.basePointsEarned}
                bonusPointsFromRating={ratingStats.bonusPointsFromRating}
              />
            </Card>
          )}

          {/* Detailed Table */}
          <DetailedTable tableData={tableData} onSort={handleSort} />

          {/* Exam Stats */}
          {examStats && (
            <ExamStatsSection examStats={examStats} examesCount={examesCount} />
          )}
        </main>
      </div>
    </>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface DetailedTableProps {
  tableData: TableRowData[];
  onSort: (key: keyof TableRowData) => void;
}

const DetailedTable: React.FC<DetailedTableProps> = ({ tableData, onSort }) => (
  <Card className="overflow-hidden animate-fade-in" style={{ animationDelay: '0.3s' }}>
    <div className="p-6 border-b border-border">
      <h3 className="text-lg font-semibold">Detalhamento por Materia</h3>
      <p className="text-sm text-muted-foreground">Visao geral de horas estudadas em diferentes periodos.</p>
    </div>
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[300px]">
              <Button variant="ghost" onClick={() => onSort('name')} className="font-semibold hover:bg-transparent px-0">
                Materia <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button variant="ghost" onClick={() => onSort('totalHours')} className="font-semibold hover:bg-transparent px-0">
                Total (h) <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button variant="ghost" onClick={() => onSort('monthHours')} className="font-semibold hover:bg-transparent px-0">
                Este Mes (h) <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button variant="ghost" onClick={() => onSort('weekHours')} className="font-semibold hover:bg-transparent px-0">
                Esta Semana (h) <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button variant="ghost" onClick={() => onSort('percentage')} className="font-semibold hover:bg-transparent px-0">
                % do Periodo <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableData.length > 0 ? (
            tableData.map((row) => (
              <TableRow key={row.name} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-right font-variant-numeric-tabular">{row.totalHours}</TableCell>
                <TableCell className="text-right font-variant-numeric-tabular">{row.monthHours}</TableCell>
                <TableCell className="text-right font-variant-numeric-tabular">{row.weekHours}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="font-variant-numeric-tabular w-12">{row.percentage}%</span>
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${row.percentage}%` }} />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                Nenhuma materia registrada ainda.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  </Card>
);

interface ExamStatsSectionProps {
  examStats: NonNullable<ReturnType<typeof useProgressAnalytics>['examStats']>;
  examesCount: number;
}

const ExamStatsSection: React.FC<ExamStatsSectionProps> = ({ examStats, examesCount }) => (
  <Card className="mt-8">
    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
      <Trophy className="h-5 w-5 text-primary" />
      Exame Diario - Metricas de Consistencia
    </h3>

    {/* Last 7 days consistency */}
    <div className="mb-6">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Ultimos 7 Dias</p>
      <div className="flex gap-2">
        {examStats.last7.map(date => {
          const feito = examStats.examDates.has(date);
          const label = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full h-10 rounded-lg flex items-center justify-center ${feito ? 'bg-green-500/20 border border-green-500/40' : 'bg-muted border border-border'}`}>
                {feito
                  ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                  : <XCircle className="w-5 h-5 text-muted-foreground/40" />}
              </div>
              <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
            </div>
          );
        })}
      </div>
    </div>

    {/* Average score */}
    <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/20 rounded-xl mb-6">
      <div className="text-center min-w-[80px]">
        <p className="text-3xl font-bold text-primary">{examStats.avgScore.toFixed(1)}</p>
        <p className="text-xs text-muted-foreground">de {examStats.totalQuestions}</p>
      </div>
      <div>
        <p className="font-semibold">Media de criterios cumpridos</p>
        <p className="text-sm text-muted-foreground">Baseado nos ultimos {Math.min(examesCount, 30)} exames respondidos</p>
      </div>
    </div>

    {/* Per question */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {(['Disciplina', 'Aprendizado', 'Pratica', 'Progresso'] as const).map(cat => (
        <div key={cat}>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">{cat}</p>
          <div className="space-y-2">
            {examStats.byQuestion.filter(q => q.categoria === cat).map(q => (
              <div key={q.id} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground flex-1 truncate">{q.label}</span>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${q.pct >= 70 ? 'bg-green-500' : q.pct >= 40 ? 'bg-amber-500' : 'bg-destructive'}`}
                    style={{ width: `${q.pct}%` }}
                  />
                </div>
                <span className={`text-xs font-bold w-8 text-right ${q.pct >= 70 ? 'text-green-500' : q.pct >= 40 ? 'text-amber-500' : 'text-destructive'}`}>
                  {q.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </Card>
);

export default ProgressAnalysisPage;
