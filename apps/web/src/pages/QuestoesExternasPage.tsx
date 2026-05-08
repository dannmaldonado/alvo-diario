/**
 * QuestoesExternasPage — Log and track questions done on external platforms
 * (Gran Concurso, Tec Concurso, simulados, etc.)
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PlusCircle, Trash2, ClipboardList, TrendingUp, Target, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useQuestoesExternas, useCreateQuestaoExterna, useDeleteQuestaoExterna } from '@/hooks/queries/useQuestoesExternas';
import type { QuestaoExterna } from '@/types';
import { cn } from '@/lib/utils';

// ============================================================================
// CONSTANTS
// ============================================================================

const FONTES = ['Gran Concurso', 'Tec Concurso', 'QConcursos', 'Estratégia Concursos', 'Simulado', 'Outro'];

const formSchema = z.object({
  data: z.string().min(1, 'Informe a data'),
  fonte: z.string().min(1, 'Selecione a fonte'),
  materia: z.string().min(1, 'Informe a matéria').max(200),
  total_questoes: z.coerce.number().int().min(1, 'Mínimo 1 questão').max(500),
  acertos: z.coerce.number().int().min(0).max(500),
}).refine(d => d.acertos <= d.total_questoes, {
  message: 'Acertos não pode ser maior que o total',
  path: ['acertos'],
});

type FormValues = z.infer<typeof formSchema>;

// ============================================================================
// STAT CARD
// ============================================================================

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className={cn('text-2xl font-bold', color)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

// ============================================================================
// ROW
// ============================================================================

function QuestaoExternaRow({ q, onDelete }: { q: QuestaoExterna; onDelete: (id: string) => void }) {
  const pct = Math.round((q.acertos / q.total_questoes) * 100);
  const isGood = pct >= 70;

  return (
    <div className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors group">
      {/* Date */}
      <div className="w-20 shrink-0 text-center">
        <p className="text-xs font-semibold text-muted-foreground">
          {new Date(q.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </p>
      </div>

      {/* Source badge */}
      <div className="w-32 shrink-0">
        <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium truncate block text-center">
          {q.fonte}
        </span>
      </div>

      {/* Subject */}
      <p className="flex-1 text-sm font-medium truncate">{q.materia}</p>

      {/* Score */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1 text-sm">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{q.acertos}</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <XCircle className="h-3.5 w-3.5 text-destructive" />
          <span className="font-semibold text-destructive">{q.erros}</span>
        </div>
        <div className={cn(
          'text-xs font-bold px-2 py-0.5 rounded-full min-w-[44px] text-center',
          isGood ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
        )}>
          {pct}%
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(q.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-destructive"
        aria-label="Excluir"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ============================================================================
// PAGE
// ============================================================================

const QuestoesExternasPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const query = useQuestoesExternas();
  const createMutation = useCreateQuestaoExterna();
  const deleteMutation = useDeleteQuestaoExterna();

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      data: new Date().toISOString().split('T')[0],
      fonte: '',
      materia: '',
      total_questoes: 10,
      acertos: 0,
    },
  });

  const registros = query.data ?? [];

  // Aggregate stats
  const totalQuestoes = registros.reduce((s, r) => s + r.total_questoes, 0);
  const totalAcertos = registros.reduce((s, r) => s + r.acertos, 0);
  const taxaGeral = totalQuestoes > 0 ? Math.round((totalAcertos / totalQuestoes) * 100) : 0;
  const sessoes = registros.length;

  const onSubmit = async (data: FormValues) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Registro salvo!');
      reset({ data: new Date().toISOString().split('T')[0], fonte: '', materia: '', total_questoes: 10, acertos: 0 });
      setShowForm(false);
    } catch {
      toast.error('Erro ao salvar. Tente novamente.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Registro excluído.');
    } catch {
      toast.error('Erro ao excluir.');
    }
  };

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner text="Carregando registros..." size="lg" />
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Questões Externas — Alvo Diário</title></Helmet>

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl tracking-tight flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-primary" />
              Questões Externas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Registre questões feitas fora da plataforma — Gran, Tec Concurso, simulados e mais.
            </p>
          </div>
          <Button onClick={() => setShowForm(v => !v)} className="shrink-0">
            <PlusCircle className="h-4 w-4 mr-2" />
            Registrar
          </Button>
        </div>

        {/* Stats */}
        {sessoes > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="Sessões" value={sessoes} />
            <StatCard label="Questões" value={totalQuestoes} />
            <StatCard label="Acertos" value={totalAcertos} color="text-emerald-500" />
            <StatCard
              label="Taxa geral"
              value={`${taxaGeral}%`}
              color={taxaGeral >= 70 ? 'text-emerald-500' : 'text-amber-500'}
              sub={taxaGeral >= 70 ? 'Ótimo desempenho!' : 'Continue praticando'}
            />
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-sm">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Novo Registro
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Data */}
                <div className="space-y-1">
                  <Label>Data</Label>
                  <Input type="date" {...register('data')} />
                  {errors.data && <p className="text-xs text-destructive">{errors.data.message}</p>}
                </div>

                {/* Fonte */}
                <div className="space-y-1">
                  <Label>Fonte</Label>
                  <Select onValueChange={v => setValue('fonte', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {FONTES.map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.fonte && <p className="text-xs text-destructive">{errors.fonte.message}</p>}
                </div>

                {/* Total */}
                <div className="space-y-1">
                  <Label>Total de questões</Label>
                  <Input type="number" min={1} max={500} {...register('total_questoes')} />
                  {errors.total_questoes && <p className="text-xs text-destructive">{errors.total_questoes.message}</p>}
                </div>

                {/* Acertos */}
                <div className="space-y-1">
                  <Label>Acertos</Label>
                  <Input type="number" min={0} max={500} {...register('acertos')} />
                  {errors.acertos && <p className="text-xs text-destructive">{errors.acertos.message}</p>}
                </div>
              </div>

              {/* Matéria — full width */}
              <div className="space-y-1">
                <Label>Matéria / Tema</Label>
                <Input placeholder="Ex: Direito Constitucional, Português..." {...register('materia')} />
                {errors.materia && <p className="text-xs text-destructive">{errors.materia.message}</p>}
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        {registros.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl flex flex-col items-center justify-center py-16 text-center shadow-sm">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <TrendingUp className="h-10 w-10 text-primary" />
            </div>
            <p className="font-semibold text-lg mb-1">Nenhum registro ainda</p>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Fez questões no Gran Concurso, Tec Concurso ou um simulado? Registre aqui para acompanhar sua evolução.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Adicionar primeiro registro
            </Button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            {/* Column headers */}
            <div className="flex items-center gap-3 px-4 py-2 bg-muted/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <span className="w-20 shrink-0 text-center">Data</span>
              <span className="w-32 shrink-0 text-center">Fonte</span>
              <span className="flex-1">Matéria</span>
              <span className="shrink-0 w-36 text-center">Resultado</span>
              <span className="w-5 shrink-0" />
            </div>
            <div className="divide-y divide-border">
              {registros.map(r => (
                <QuestaoExternaRow key={r.id} q={r} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default QuestoesExternasPage;
