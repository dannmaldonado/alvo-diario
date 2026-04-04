import React from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Trash2, Plus, Sparkles, Target, BookOpen, ChevronLeft, ChevronRight, AlertTriangle, Pencil, Check, X } from 'lucide-react';

import SubjectBadge from '@/components/SubjectBadge';
import { FormInput } from '@/components/FormInput';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useCronogramaManager, EDITAL_SUBJECTS } from '@/hooks/useCronogramaManager';

const CronogramaPage: React.FC = () => {
  const { state, actions, cycleHelpers } = useCronogramaManager();

  const {
    loading, saving, deleting, showDeleteConfirm,
    cronograma, edital, dataAlvo, dataInicio, materias,
    viewCycleOffset, editingDates, errors,
  } = state;

  const {
    setEdital, setDataAlvo, setDataInicio, setEditingDates,
    setShowDeleteConfirm, setViewCycleOffset,
    generateSchedule, addMateria, removeMateria, updateMateria,
    saveCronograma, deleteCronograma, saveDates,
  } = actions;

  if (loading) {
    return (
      <>
        <Helmet><title>Cronograma - Alvo Diario</title></Helmet>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <LoadingSpinner text="Carregando seu cronograma..." size="lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Cronograma - Alvo Diario</title>
        <meta name="description" content="Gerencie seu cronograma de estudos em ciclos" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold md:text-4xl tracking-tight">Cronograma de Ciclos</h1>
            <p className="text-lg text-muted-foreground">
              Estude de forma inteligente alternando materias em ciclos continuos.
            </p>
          </div>

          {cronograma ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Overview & Edit */}
              <div className="space-y-6 lg:col-span-1">
                <OverviewCard
                  cronograma={cronograma}
                  editingDates={editingDates}
                  dataInicio={dataInicio}
                  dataAlvo={dataAlvo}
                  saving={saving}
                  materias={materias}
                  onSetEditingDates={setEditingDates}
                  onSetDataInicio={setDataInicio}
                  onSetDataAlvo={setDataAlvo}
                  onSaveDates={saveDates}
                  onShowDeleteConfirm={() => setShowDeleteConfirm(true)}
                />

                <EditMateriasCard
                  materias={materias}
                  saving={saving}
                  onUpdateMateria={updateMateria}
                  onRemoveMateria={removeMateria}
                  onAddMateria={addMateria}
                  onSave={saveCronograma}
                />
              </div>

              {/* Right Column: Cycle View */}
              <div className="lg:col-span-2">
                <CycleGrid
                  cronograma={cronograma}
                  viewCycleOffset={viewCycleOffset}
                  onSetViewCycleOffset={setViewCycleOffset}
                  getCycleInfo={cycleHelpers.getCycleInfo}
                  getSubjectForDay={cycleHelpers.getSubjectForDay}
                />
              </div>
            </div>
          ) : (
            <CreateScheduleForm
              edital={edital}
              dataInicio={dataInicio}
              dataAlvo={dataAlvo}
              materias={materias}
              saving={saving}
              errors={errors}
              onSetEdital={setEdital}
              onSetDataInicio={setDataInicio}
              onSetDataAlvo={setDataAlvo}
              onGenerateSchedule={generateSchedule}
              onSave={saveCronograma}
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <DeleteConfirmDialog
          deleting={deleting}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={deleteCronograma}
        />
      )}
    </>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface OverviewCardProps {
  cronograma: NonNullable<ReturnType<typeof useCronogramaManager>['state']['cronograma']>;
  editingDates: boolean;
  dataInicio: string;
  dataAlvo: string;
  saving: boolean;
  materias: { nome: string }[];
  onSetEditingDates: (v: boolean) => void;
  onSetDataInicio: (v: string) => void;
  onSetDataAlvo: (v: string) => void;
  onSaveDates: () => void;
  onShowDeleteConfirm: () => void;
}

const OverviewCard: React.FC<OverviewCardProps> = ({
  cronograma, editingDates, dataInicio, dataAlvo, saving, materias,
  onSetEditingDates, onSetDataInicio, onSetDataAlvo, onSaveDates, onShowDeleteConfirm,
}) => (
  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-slide-up transition-all duration-250 hover:shadow-lg">
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-xl">
          <Target className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold">{cronograma.edital}</h2>
      </div>
      {!editingDates && (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onSetEditingDates(true)}>
          <Pencil className="h-4 w-4" />
        </Button>
      )}
    </div>

    {editingDates ? (
      <div className="space-y-4 mb-5">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Inicio dos Estudos
          </Label>
          <Input type="date" value={dataInicio} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSetDataInicio(e.target.value)} className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Data da Prova <span className="text-destructive">*</span>
          </Label>
          <Input type="date" value={dataAlvo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSetDataAlvo(e.target.value)} className="h-9" />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onSaveDates} disabled={saving} className="flex-1">
            <Check className="h-4 w-4 mr-1" /> {saving ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onSetEditingDates(false)} disabled={saving}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    ) : (
      <div className="space-y-2 mb-5">
        <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
          <span className="text-muted-foreground flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" /> Inicio dos Estudos
          </span>
          <span className="font-medium text-sm">
            {cronograma.data_inicio
              ? new Date(cronograma.data_inicio).toLocaleDateString('pt-BR')
              : <span className="text-muted-foreground italic text-xs">Nao definido</span>}
          </span>
        </div>
        <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
          <span className="text-muted-foreground flex items-center gap-2 text-sm">
            <Target className="h-4 w-4" /> Data da Prova
          </span>
          <span className="font-medium text-sm">
            {cronograma.data_alvo
              ? new Date(cronograma.data_alvo).toLocaleDateString('pt-BR')
              : 'Nao definida'}
          </span>
        </div>
        <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
          <span className="text-muted-foreground flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4" /> Materias no Ciclo
          </span>
          <span className="font-bold">{materias.length}</span>
        </div>
      </div>
    )}

    <Button
      variant="outline"
      className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={onShowDeleteConfirm}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      Excluir Cronograma
    </Button>
  </div>
);

interface EditMateriasCardProps {
  materias: { nome: string }[];
  saving: boolean;
  onUpdateMateria: (index: number, value: string) => void;
  onRemoveMateria: (index: number) => void;
  onAddMateria: () => void;
  onSave: () => void;
}

const EditMateriasCard: React.FC<EditMateriasCardProps> = ({
  materias, saving, onUpdateMateria, onRemoveMateria, onAddMateria, onSave,
}) => (
  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-slide-up transition-all duration-250 hover:shadow-lg" style={{ animationDelay: '0.1s' }}>
    <h3 className="font-semibold text-lg mb-4">Editar Materias do Ciclo</h3>
    <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto pr-2">
      {materias.map((materia, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              value={materia.nome}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateMateria(index, e.target.value)}
              placeholder="Nome da materia"
              className="h-9"
            />
          </div>
          <Button variant="ghost" size="icon" onClick={() => onRemoveMateria(index)} className="h-9 w-9 text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
    <div className="flex flex-col gap-3">
      <Button variant="outline" onClick={onAddMateria} className="w-full border-dashed">
        <Plus className="mr-2 h-4 w-4" /> Adicionar Materia
      </Button>
      <Button onClick={onSave} disabled={saving} className="w-full">
        {saving ? 'Salvando...' : 'Salvar Alteracoes'}
      </Button>
    </div>
  </div>
);

interface CycleGridProps {
  cronograma: NonNullable<ReturnType<typeof useCronogramaManager>['state']['cronograma']>;
  viewCycleOffset: number;
  onSetViewCycleOffset: (value: number | ((prev: number) => number)) => void;
  getCycleInfo: ReturnType<typeof useCronogramaManager>['cycleHelpers']['getCycleInfo'];
  getSubjectForDay: ReturnType<typeof useCronogramaManager>['cycleHelpers']['getSubjectForDay'];
}

const CycleGrid: React.FC<CycleGridProps> = ({
  cronograma, viewCycleOffset, onSetViewCycleOffset, getCycleInfo, getSubjectForDay,
}) => {
  if (!cronograma.materias || cronograma.materias.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { cycleNumber: currentCycleNum, totalDaysInCycle } = getCycleInfo(cronograma, today);
  const targetCycleNum = Math.max(1, currentCycleNum + viewCycleOffset);

  const cycleStartDate = new Date(cronograma.data_inicio || cronograma.created);
  cycleStartDate.setHours(0, 0, 0, 0);
  cycleStartDate.setDate(cycleStartDate.getDate() + ((targetCycleNum - 1) * totalDaysInCycle));

  const days = Array.from({ length: totalDaysInCycle }, (_, i) => {
    const date = new Date(cycleStartDate);
    date.setDate(date.getDate() + i);
    const isToday = date.getTime() === today.getTime();
    const isPast = date.getTime() < today.getTime();
    const subject = getSubjectForDay(cronograma, i);
    return { dayNum: i + 1, date, isToday, isPast, subject };
  });

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <Button variant="outline" size="icon" onClick={() => onSetViewCycleOffset(prev => prev - 1)} disabled={targetCycleNum <= 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h3 className="font-semibold text-lg">Ciclo {targetCycleNum}</h3>
          <p className="text-sm text-muted-foreground">
            {cycleStartDate.toLocaleDateString('pt-BR')} - {days[days.length - 1].date.toLocaleDateString('pt-BR')}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={() => onSetViewCycleOffset(prev => prev + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="divide-y divide-border">
        {days.map((day) => (
          <div
            key={day.dayNum}
            className={`p-4 flex items-center gap-4 transition-colors ${
              day.isToday ? 'bg-primary/5 border-l-4 border-l-primary' :
              day.isPast ? 'opacity-60 bg-muted/20' : 'hover:bg-muted/50'
            }`}
          >
            <div className="flex flex-col items-center justify-center min-w-[60px]">
              <span className="text-xs font-medium text-muted-foreground uppercase">Dia</span>
              <span className={`text-2xl font-bold ${day.isToday ? 'text-primary' : ''}`}>{day.dayNum}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-muted-foreground">
                  {day.date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                </span>
                {day.isToday && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Hoje
                  </span>
                )}
              </div>
              <SubjectBadge subject={day.subject} size="lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface CreateScheduleFormProps {
  edital: string;
  dataInicio: string;
  dataAlvo: string;
  materias: { nome: string }[];
  saving: boolean;
  errors: { edital?: string; dataAlvo?: string };
  onSetEdital: (v: string) => void;
  onSetDataInicio: (v: string) => void;
  onSetDataAlvo: (v: string) => void;
  onGenerateSchedule: () => void;
  onSave: () => void;
}

const CreateScheduleForm: React.FC<CreateScheduleFormProps> = ({
  edital, dataInicio, dataAlvo, materias, saving, errors,
  onSetEdital, onSetDataInicio, onSetDataAlvo, onGenerateSchedule, onSave,
}) => (
  <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl p-8 shadow-sm animate-scale-in transition-all duration-250">
    <div className="text-center mb-8">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold">Criar Novo Cronograma</h2>
      <p className="text-muted-foreground mt-2">Configure seu edital e data da prova para gerar seu ciclo de estudos.</p>
    </div>

    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="edital">Edital Foco</Label>
        <Select value={edital} onValueChange={onSetEdital}>
          <SelectTrigger id="edital" className="w-full">
            <SelectValue placeholder="Selecione um edital" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(EDITAL_SUBJECTS).map(key => (
              <SelectItem key={key} value={key}>{key === 'PC' ? 'Policia Civil (PC)' : key === 'PRF' ? 'Policia Rodoviaria Federal (PRF)' : 'Policia Federal (PF)'}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.edital && <p className="text-sm text-destructive">{errors.edital}</p>}
        <p className="text-xs text-muted-foreground">Selecione o edital para gerar as materias recomendadas</p>
      </div>

      <FormInput
        label="Data de Inicio dos Estudos"
        type="date"
        value={dataInicio}
        onChange={(e) => onSetDataInicio(e.target.value)}
        hint="Quando voce vai comecar a estudar (usado para calcular o progresso)"
      />

      <FormInput
        label="Data Prevista da Prova"
        type="date"
        value={dataAlvo}
        onChange={(e) => onSetDataAlvo(e.target.value)}
        error={errors.dataAlvo}
        hint="Sua data alvo de preparacao"
        required
      />

      {materias.length === 0 ? (
        <Button onClick={onGenerateSchedule} className="w-full h-12 text-lg" disabled={!edital || !dataAlvo}>
          Gerar Ciclo Base
        </Button>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="p-4 bg-muted rounded-xl">
            <p className="font-medium mb-2">Materias do Ciclo ({materias.length}):</p>
            <div className="flex flex-wrap gap-2">
              {materias.map((m, i) => (
                <SubjectBadge key={i} subject={m} size="sm" />
              ))}
            </div>
          </div>
          <Button onClick={onSave} disabled={saving} className="w-full h-12 text-lg">
            {saving ? 'Salvando...' : 'Confirmar e Criar Cronograma'}
          </Button>
        </div>
      )}
    </div>
  </div>
);

interface DeleteConfirmDialogProps {
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({ deleting, onCancel, onConfirm }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
    onClick={onCancel}
  >
    <div
      className="bg-card border border-border shadow-2xl rounded-2xl p-6 max-w-sm w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <h2 className="text-lg font-bold">Excluir Cronograma</h2>
      </div>
      <p className="text-muted-foreground mb-6">
        Tem certeza que deseja excluir seu cronograma? Esta acao nao pode ser desfeita e todas as suas materias serao perdidas.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={deleting}>
          Cancelar
        </Button>
        <Button variant="destructive" className="flex-1" onClick={onConfirm} disabled={deleting}>
          {deleting ? 'Excluindo...' : 'Sim, excluir'}
        </Button>
      </div>
    </div>
  </div>
);

export default CronogramaPage;
