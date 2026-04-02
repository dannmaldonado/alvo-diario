
import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { SessoesService } from '@/services/sessoes.service';
import { Sessao } from '@/types';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { Clock, Calendar as CalendarIcon, TrendingUp, ArrowUpDown, BookOpen, Trophy, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, StatsCard } from '@/components/Card';
import { apiClient } from '@/services/api';

interface SubjectData {
  name: string;
  hours: number;
  fill: string;
}

interface EvolutionData {
  date: string;
  hours: number;
  dailyHours: number;
}

interface TableRow {
  name: string;
  totalHours: number;
  monthHours: number;
  weekHours: number;
  percentage: number;
}

interface Stats {
  totalHoursAll: string;
  totalHoursMonth: string;
  totalHoursWeek: string;
  avgHoursPerDay: string;
}

interface SortConfig {
  key: keyof TableRow;
  direction: 'asc' | 'desc';
}

const EXAM_QUESTIONS_META = [
  { id: 'horarios',   categoria: 'Disciplina',  label: 'Cumpriu horários' },
  { id: 'distracao',  categoria: 'Disciplina',  label: 'Evitou distrações' },
  { id: 'retencao',   categoria: 'Aprendizado', label: 'Reteve conteúdo' },
  { id: 'explicar',   categoria: 'Aprendizado', label: 'Conseguiu explicar' },
  { id: 'questoes',   categoria: 'Prática',     label: 'Resolveu questões' },
  { id: 'erros',      categoria: 'Prática',     label: 'Revisou erros' },
  { id: 'plano',      categoria: 'Progresso',   label: 'Cumpriu o plano' },
  { id: 'evolucao',   categoria: 'Progresso',   label: 'Sentiu evolução' },
];

interface ExameDiario {
  data: string;
  respostas: Record<string, boolean>;
  pontuacao: number;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
  'hsl(var(--chart-7))',
  'hsl(var(--chart-8))',
];

const ProgressAnalysisPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allSessions, setAllSessions] = useState<Sessao[]>([]);
  const [exames, setExames] = useState<ExameDiario[]>([]);
  const [period, setPeriod] = useState<'all' | 'month' | 'week' | '7days'>('month');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'totalHours', direction: 'desc' });

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        if (!currentUser) {
          toast.error('Usuário não autenticado');
          return;
        }
        const sessions = await SessoesService.getByUser(currentUser.id) as Sessao[];
        setAllSessions(sessions);
        try {
          const examesData = await apiClient.get<ExameDiario[]>('/api/exames');
          setExames(examesData || []);
        } catch {
          // exames opcionais — não bloqueia a página
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
        toast.error('Erro ao carregar dados de análise.');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [currentUser]);

  // Helper to get date boundaries
  const getDateBoundaries = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const startOfWeek = new Date(today);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek); // Sunday as start
    
    const startOf7Days = new Date(today);
    startOf7Days.setDate(startOf7Days.getDate() - 6);

    return { today, startOfMonth, startOfWeek, startOf7Days };
  };

  // Filter sessions based on selected period
  const filteredSessions = useMemo(() => {
    if (period === 'all') return allSessions;

    const { startOfMonth, startOfWeek, startOf7Days } = getDateBoundaries();

    return allSessions.filter((session: Sessao) => {
      const sessionDate = new Date(session.data_sessao);
      // Normalize session date to midnight for fair comparison
      sessionDate.setHours(0, 0, 0, 0);

      switch (period) {
        case 'month': return sessionDate >= startOfMonth;
        case 'week': return sessionDate >= startOfWeek;
        case '7days': return sessionDate >= startOf7Days;
        default: return true;
      }
    });
  }, [allSessions, period]);

  // Calculate Key Statistics
  const stats = useMemo<Stats>(() => {
    const { startOfMonth, startOfWeek } = getDateBoundaries();

    let totalMinutesAll = 0;
    let totalMinutesMonth = 0;
    let totalMinutesWeek = 0;

    // For average calculation
    const uniqueDays = new Set<string>();

    allSessions.forEach(session => {
      const mins = session.duracao_minutos || 0;
      const sessionDate = new Date(session.data_sessao);
      sessionDate.setHours(0, 0, 0, 0);

      totalMinutesAll += mins;
      uniqueDays.add(session.data_sessao);

      if (sessionDate >= startOfMonth) totalMinutesMonth += mins;
      if (sessionDate >= startOfWeek) totalMinutesWeek += mins;
    });

    const daysCount = uniqueDays.size || 1; // avoid div by zero
    const avgMinutesPerDay = totalMinutesAll / daysCount;

    return {
      totalHoursAll: Number((totalMinutesAll / 60).toFixed(1)).toString(),
      totalHoursMonth: Number((totalMinutesMonth / 60).toFixed(1)).toString(),
      totalHoursWeek: Number((totalMinutesWeek / 60).toFixed(1)).toString(),
      avgHoursPerDay: Number((avgMinutesPerDay / 60).toFixed(1)).toString()
    };
  }, [allSessions]);

  // Data for Subject Bar Chart & Pie Chart
  const subjectData = useMemo<SubjectData[]>(() => {
    const subjectMap: Record<string, number> = {};

    filteredSessions.forEach((session: Sessao) => {
      const name = session.materia || 'Desconhecida';
      if (!subjectMap[name]) subjectMap[name] = 0;
      subjectMap[name] += session.duracao_minutos;
    });

    return Object.entries(subjectMap)
      .map(([name, minutes], index) => ({
        name,
        hours: Number((minutes / 60).toFixed(2)),
        fill: CHART_COLORS[index % CHART_COLORS.length]
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [filteredSessions]);

  // Data for Cumulative Line Chart
  const evolutionData = useMemo<EvolutionData[]>(() => {
    if (filteredSessions.length === 0) return [];

    // Sort ascending for timeline
    const sorted = [...filteredSessions].sort((a, b) => {
      const aDate = new Date(a.data_sessao);
      const bDate = new Date(b.data_sessao);
      return aDate.getTime() - bDate.getTime();
    });

    const dailyMap: Record<string, number> = {};
    sorted.forEach((session: Sessao) => {
      const dateStr = session.data_sessao.split('T')[0];
      if (!dailyMap[dateStr]) dailyMap[dateStr] = 0;
      dailyMap[dateStr] += session.duracao_minutos;
    });

    let cumulativeMinutes = 0;
    return Object.entries(dailyMap).map(([date, minutes]) => {
      cumulativeMinutes += minutes;
      return {
        date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        hours: Number((cumulativeMinutes / 60).toFixed(2)),
        dailyHours: Number((minutes / 60).toFixed(2))
      };
    });
  }, [filteredSessions]);

  // Data for Detailed Table
  const tableData = useMemo<TableRow[]>(() => {
    const { startOfMonth, startOfWeek } = getDateBoundaries();
    const subjectMap: Record<string, { name: string; totalAll: number; totalMonth: number; totalWeek: number; periodMinutes: number }> = {};
    let totalPeriodMinutes = 0;

    // Initialize map with all subjects ever studied to show 0s if needed,
    // or just subjects in current filter. Let's show all subjects ever studied.
    allSessions.forEach((session: Sessao) => {
      const name = session.materia || 'Desconhecida';
      if (!subjectMap[name]) {
        subjectMap[name] = { name, totalAll: 0, totalMonth: 0, totalWeek: 0, periodMinutes: 0 };
      }

      const mins = session.duracao_minutos;
      const sessionDate = new Date(session.data_sessao);
      sessionDate.setHours(0, 0, 0, 0);

      subjectMap[name].totalAll += mins;
      if (sessionDate >= startOfMonth) subjectMap[name].totalMonth += mins;
      if (sessionDate >= startOfWeek) subjectMap[name].totalWeek += mins;

      // Check if it falls in current selected period for percentage calculation
      let inPeriod = false;
      if (period === 'all') inPeriod = true;
      else if (period === 'month' && sessionDate >= startOfMonth) inPeriod = true;
      else if (period === 'week' && sessionDate >= startOfWeek) inPeriod = true;
      else {
        const startOf7Days = new Date();
        startOf7Days.setDate(startOf7Days.getDate() - 6);
        startOf7Days.setHours(0, 0, 0, 0);
        if (period === '7days' && sessionDate >= startOf7Days) inPeriod = true;
      }

      if (inPeriod) {
        subjectMap[name].periodMinutes += mins;
        totalPeriodMinutes += mins;
      }
    });

    const data = Object.values(subjectMap).map(item => ({
      name: item.name,
      totalHours: Number((item.totalAll / 60).toFixed(1)),
      monthHours: Number((item.totalMonth / 60).toFixed(1)),
      weekHours: Number((item.totalWeek / 60).toFixed(1)),
      percentage: totalPeriodMinutes > 0 ? Number((((item.periodMinutes / totalPeriodMinutes) * 100).toFixed(1))) : 0
    }));

    // Apply sorting
    return data.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [allSessions, period, sortConfig]);

  // Métricas dos Exames Diários
  const examStats = useMemo(() => {
    if (exames.length === 0) return null;

    const last30 = exames.slice(0, 30);
    const avgScore = last30.reduce((acc, e) => acc + (e.pontuacao ?? 0), 0) / last30.length;
    const totalQuestions = EXAM_QUESTIONS_META.length;

    const byQuestion = EXAM_QUESTIONS_META.map(q => {
      const respondidas = last30.filter(e => e.respostas && e.respostas[q.id] !== undefined);
      const positivas = respondidas.filter(e => e.respostas[q.id] === true).length;
      return {
        ...q,
        pct: respondidas.length > 0 ? Math.round((positivas / respondidas.length) * 100) : 0,
        total: respondidas.length,
      };
    });

    // Últimos 7 dias: quais dias tiveram exame
    const today = new Date();
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    const examDates = new Set(exames.map(e => e.data?.split('T')[0]));

    return { avgScore, totalQuestions, byQuestion, last7, examDates };
  }, [exames]);

  const handleSort = (key: keyof TableRow) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-lg">
          <p className="font-medium mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color || entry.fill }}>
              {entry.name === 'hours' ? 'Horas' : entry.name}: <span className="font-bold">{entry.value}h</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-[400px] rounded-2xl" />
            <Skeleton className="h-[400px] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Análise de Progresso - Alvo Diário</title>
        <meta name="description" content="Estatísticas detalhadas dos seus estudos" />
      </Helmet>

      <div className="min-h-screen bg-background">


        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold md:text-4xl tracking-tight mb-2">Análise de Progresso</h1>
              <p className="text-muted-foreground text-lg">Acompanhe sua evolução e distribuição de tempo.</p>
            </div>

            <div className="flex flex-wrap gap-2 bg-muted/50 p-1.5 rounded-xl border border-border">
              {[
                { id: '7days' as const, label: 'Últimos 7 Dias' },
                { id: 'week' as const, label: 'Esta Semana' },
                { id: 'month' as const, label: 'Este Mês' },
                { id: 'all' as const, label: 'Todo Período' }
              ].map(p => (
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

          {/* Key Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              label="Total (Sempre)"
              value={stats.totalHoursAll}
              icon={<Clock className="h-5 w-5" />}
            />

            <StatsCard
              label="Este Mês"
              value={stats.totalHoursMonth}
              icon={<CalendarIcon className="h-5 w-5" />}
            />

            <StatsCard
              label="Esta Semana"
              value={stats.totalHoursWeek}
              icon={<CalendarIcon className="h-5 w-5" />}
            />

            <StatsCard
              label="Média Diária"
              value={stats.avgHoursPerDay}
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

            {/* Bar Chart: Hours per Subject */}
            <Card className="flex flex-col animate-fade-in">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                Horas por Matéria ({period === 'all' ? 'Sempre' : 'Período'})
              </h3>
              <div className="flex-1 min-h-[350px]">
                {subjectData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
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
                  <div className="h-full flex items-center justify-center text-muted-foreground">Nenhum dado no período.</div>
                )}
              </div>
            </Card>

            {/* Line Chart: Evolution */}
            <Card className="flex flex-col animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                Evolução Acumulada ({period === 'all' ? 'Sempre' : 'Período'})
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
                  <div className="h-full flex items-center justify-center text-muted-foreground">Nenhum dado no período.</div>
                )}
              </div>
            </Card>

            {/* Pie Chart: Distribution */}
            <Card className="flex flex-col lg:col-span-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-muted-foreground" />
                Distribuição de Tempo ({period === 'all' ? 'Sempre' : 'Período'})
              </h3>
              <div className="flex-1 min-h-[400px] flex items-center justify-center">
                {subjectData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
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
                        formatter={(value, entry) => <span className="text-foreground font-medium ml-1">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-muted-foreground">Nenhum dado no período.</div>
                )}
              </div>
            </Card>

          </div>

          {/* Detailed Table */}
          <Card className="overflow-hidden animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold">Detalhamento por Matéria</h3>
              <p className="text-sm text-muted-foreground">Visão geral de horas estudadas em diferentes períodos.</p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[300px]">
                      <Button variant="ghost" onClick={() => handleSort('name')} className="font-semibold hover:bg-transparent px-0">
                        Matéria <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" onClick={() => handleSort('totalHours')} className="font-semibold hover:bg-transparent px-0">
                        Total (h) <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" onClick={() => handleSort('monthHours')} className="font-semibold hover:bg-transparent px-0">
                        Este Mês (h) <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" onClick={() => handleSort('weekHours')} className="font-semibold hover:bg-transparent px-0">
                        Esta Semana (h) <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" onClick={() => handleSort('percentage')} className="font-semibold hover:bg-transparent px-0">
                        % do Período <ArrowUpDown className="ml-2 h-4 w-4" />
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
                              <div 
                                className="h-full bg-primary rounded-full" 
                                style={{ width: `${row.percentage}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhuma matéria registrada ainda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Exame Diário */}
          {examStats && (
            <Card className="mt-8">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Exame Diário — Métricas de Consistência
              </h3>

              {/* Consistência dos últimos 7 dias */}
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Últimos 7 Dias</p>
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

              {/* Média geral */}
              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/20 rounded-xl mb-6">
                <div className="text-center min-w-[80px]">
                  <p className="text-3xl font-bold text-primary">{examStats.avgScore.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">de {examStats.totalQuestions}</p>
                </div>
                <div>
                  <p className="font-semibold">Média de critérios cumpridos</p>
                  <p className="text-sm text-muted-foreground">Baseado nos últimos {Math.min(exames.length, 30)} exames respondidos</p>
                </div>
              </div>

              {/* Por critério */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(['Disciplina', 'Aprendizado', 'Prática', 'Progresso'] as const).map(cat => (
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
          )}

        </main>
      </div>
    </>
  );
};

export default ProgressAnalysisPage;
