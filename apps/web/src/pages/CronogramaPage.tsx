
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { CronogramaService } from '@/services/cronograma.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Trash2, Plus, Sparkles, Target, BookOpen, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Cronograma, Materia } from '@/types';

import SubjectBadge from '@/components/SubjectBadge';
import { useScheduleCalculator } from '@/hooks';
import { FormInput } from '@/components/FormInput';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface PageState {
  loading: boolean;
  saving: boolean;
  deleting: boolean;
  showDeleteConfirm: boolean;
  cronograma: Cronograma | null;
  edital: string;
  dataAlvo: string;
  materias: Materia[];
  viewCycleOffset: number;
  errors: {
    edital?: string;
    dataAlvo?: string;
  };
}

const EDITAL_SUBJECTS = {
  PC: [
    'Direito Constitucional', 'Direito Administrativo', 'Direito Penal', 
    'Direito Processual Penal', 'Criminologia', 'Legislação Especial', 
    'Português', 'Raciocínio Lógico', 'Informática'
  ],
  PRF: [
    'Direito Constitucional', 'Direito Administrativo', 'Direito Penal', 
    'Direito Processual Penal', 'Legislação de Trânsito', 'Física', 
    'Português', 'Raciocínio Lógico', 'Informática', 'Ética e Cidadania'
  ],
  PF: [
    'Direito Constitucional', 'Direito Administrativo', 'Direito Penal', 
    'Direito Processual Penal', 'Legislação Especial', 'Contabilidade', 
    'Português', 'Raciocínio Lógico', 'Informática', 'Atualidades'
  ]
};

const CronogramaPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { getCycleInfo, getSubjectForDay } = useScheduleCalculator();

  const [pageState, setPageState] = useState<PageState>({
    loading: true,
    saving: false,
    deleting: false,
    showDeleteConfirm: false,
    cronograma: null,
    edital: '',
    dataAlvo: '',
    materias: [],
    viewCycleOffset: 0,
    errors: {}
  });

  // Destructure for easier access
  const { loading, saving, deleting, showDeleteConfirm, cronograma, edital, dataAlvo, materias, viewCycleOffset } = pageState;

  // Helper functions to update individual state fields
  const setLoading = (value: boolean) => setPageState(prev => ({ ...prev, loading: value }));
  const setSaving = (value: boolean) => setPageState(prev => ({ ...prev, saving: value }));
  const setDeleting = (value: boolean) => setPageState(prev => ({ ...prev, deleting: value }));
  const setShowDeleteConfirm = (value: boolean) => setPageState(prev => ({ ...prev, showDeleteConfirm: value }));
  const setCronograma = (value: Cronograma | null) => setPageState(prev => ({ ...prev, cronograma: value }));
  const setEdital = (value: string) => setPageState(prev => ({ ...prev, edital: value }));
  const setDataAlvo = (value: string) => setPageState(prev => ({ ...prev, dataAlvo: value }));
  const setMaterias = (value: Materia[]) => setPageState(prev => ({ ...prev, materias: value }));
  const setViewCycleOffset = (value: number | ((prev: number) => number)) => {
    setPageState(prev => ({
      ...prev,
      viewCycleOffset: typeof value === 'function' ? value(prev.viewCycleOffset) : value
    }));
  };

  useEffect(() => {
    loadCronograma();
  }, []);

  const loadCronograma = async () => {
    try {
      setLoading(true);
      if (!currentUser) {
        toast.error('Usuário não autenticado');
        return;
      }
      const c = await CronogramaService.getActive(currentUser.id) as Cronograma;

      if (c) {
        setCronograma(c);
        setEdital(c.edital);
        setDataAlvo(c.data_alvo);
        setMaterias(c.materias);
      }
    } catch (error) {
      console.error('Error loading cronograma:', error);
      toast.error('Erro ao carregar cronograma');
    } finally {
      setLoading(false);
    }
  };

  const generateSchedule = () => {
    if (!edital || !dataAlvo) {
      toast.error('Selecione o edital e a data alvo');
      return;
    }

    const subjects = EDITAL_SUBJECTS[edital as keyof typeof EDITAL_SUBJECTS];
    const scheduledMaterias: Materia[] = subjects.map((subject) => ({
      nome: subject,
      status: 'pendente'
    }));

    setMaterias(scheduledMaterias);
    toast.success(`Ciclo gerado com ${subjects.length} matérias`);
  };

  const addMateria = () => {
    setMaterias([...materias, { nome: '', status: 'pendente' }]);
  };

  const removeMateria = (index: number) => {
    setMaterias(materias.filter((_, i) => i !== index));
  };

  const updateMateria = (index: number, value: string) => {
    const updated = [...materias];
    updated[index].nome = value;
    setMaterias(updated);
  };

  const saveCronograma = async () => {
    if (!edital || !dataAlvo || materias.length === 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (materias.some(m => !m.nome)) {
      toast.error('Todas as matérias devem ter um nome');
      return;
    }

    try {
      setSaving(true);
      if (!currentUser) {
        toast.error('Usuário não autenticado');
        return;
      }
      const data = {
        user_id: currentUser.id,
        edital,
        data_alvo: dataAlvo,
        materias
      };

      if (cronograma) {
        await CronogramaService.update(cronograma.id, data);
        toast.success('Cronograma atualizado');
      } else {
        const newCronograma = await CronogramaService.create(data);
        setCronograma(newCronograma);
        toast.success('Cronograma criado');
      }
      await loadCronograma();
    } catch (error) {
      console.error('Error saving cronograma:', error);
      toast.error('Erro ao salvar cronograma');
    } finally {
      setSaving(false);
    }
  };

  const deleteCronograma = async () => {
    if (!cronograma) return;
    try {
      setDeleting(true);
      await CronogramaService.delete(cronograma.id);
      setPageState(prev => ({
        ...prev,
        cronograma: null,
        edital: '',
        dataAlvo: '',
        materias: [],
        showDeleteConfirm: false,
        deleting: false,
      }));
      toast.success('Cronograma excluído com sucesso');
    } catch (error) {
      console.error('Error deleting cronograma:', error);
      toast.error('Erro ao excluir cronograma');
      setDeleting(false);
    }
  };

  // Render Helpers for Cycle View
  const renderCycleGrid = () => {
    if (!cronograma || !cronograma.materias || cronograma.materias.length === 0) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { cycleNumber: currentCycleNum, totalDaysInCycle } = getCycleInfo(cronograma, today);
    const targetCycleNum = Math.max(1, currentCycleNum + viewCycleOffset);
    
    const cycleStartDate = new Date(cronograma.created);
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
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewCycleOffset(prev => prev - 1)}
            disabled={targetCycleNum <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <h3 className="font-semibold text-lg">Ciclo {targetCycleNum}</h3>
            <p className="text-sm text-muted-foreground">
              {cycleStartDate.toLocaleDateString('pt-BR')} - {days[days.length-1].date.toLocaleDateString('pt-BR')}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewCycleOffset(prev => prev + 1)}
          >
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
                <span className={`text-2xl font-bold ${day.isToday ? 'text-primary' : ''}`}>
                  {day.dayNum}
                </span>
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

  if (loading) {
    return (
      <>
        <Helmet><title>Cronograma - Alvo Diário</title></Helmet>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <LoadingSpinner text="Carregando seu cronograma..." size="lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Cronograma - Alvo Diário</title>
        <meta name="description" content="Gerencie seu cronograma de estudos em ciclos" />
      </Helmet>

      <div className="min-h-screen bg-background">


        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold md:text-4xl tracking-tight">Cronograma de Ciclos</h1>
            <p className="text-lg text-muted-foreground">
              Estude de forma inteligente alternando matérias em ciclos contínuos.
            </p>
          </div>

          {cronograma ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Overview & Edit */}
              <div className="space-y-6 lg:col-span-1">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-slide-up transition-all duration-250 hover:shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-primary/10 p-3 rounded-xl">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{cronograma.edital}</h2>
                      <p className="text-sm text-muted-foreground">
                        Prova: {cronograma.data_alvo ? new Date(cronograma.data_alvo).toLocaleDateString('pt-BR') : 'Não definida'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <BookOpen className="h-4 w-4" /> Matérias no Ciclo
                      </span>
                      <span className="font-bold text-lg">{materias.length}</span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir Cronograma
                    </Button>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-slide-up transition-all duration-250 hover:shadow-lg" style={{ animationDelay: '0.1s' }}>
                  <h3 className="font-semibold text-lg mb-4">Editar Matérias do Ciclo</h3>
                  <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto pr-2">
                    {materias.map((materia, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-1">
                          <Input
                            value={materia.nome}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateMateria(index, e.target.value)}
                            placeholder="Nome da matéria"
                            className="h-9"
                          />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeMateria(index)} className="h-9 w-9 text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button variant="outline" onClick={addMateria} className="w-full border-dashed">
                      <Plus className="mr-2 h-4 w-4" /> Adicionar Matéria
                    </Button>
                    <Button onClick={saveCronograma} disabled={saving} className="w-full">
                      {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Column: Cycle View */}
              <div className="lg:col-span-2">
                {renderCycleGrid()}
              </div>
            </div>
          ) : (
            /* Create Schedule State */
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
                  <Select value={edital} onValueChange={setEdital}>
                    <SelectTrigger id="edital" className="w-full">
                      <SelectValue placeholder="Selecione um edital" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PC">Polícia Civil (PC)</SelectItem>
                      <SelectItem value="PRF">Polícia Rodoviária Federal (PRF)</SelectItem>
                      <SelectItem value="PF">Polícia Federal (PF)</SelectItem>
                    </SelectContent>
                  </Select>
                  {pageState.errors.edital && <p className="text-sm text-destructive">{pageState.errors.edital}</p>}
                  <p className="text-xs text-muted-foreground">Selecione o edital para gerar as matérias recomendadas</p>
                </div>

                <FormInput
                  label="Data Prevista da Prova"
                  type="date"
                  value={dataAlvo}
                  onChange={(e) => setDataAlvo(e.target.value)}
                  error={pageState.errors.dataAlvo}
                  hint="Sua data alvo de preparação"
                  required
                />

                {materias.length === 0 ? (
                  <>
                    <Button onClick={generateSchedule} className="w-full h-12 text-lg" disabled={!edital || !dataAlvo}>
                      Gerar Ciclo Base
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="p-4 bg-muted rounded-xl">
                      <p className="font-medium mb-2">Matérias do Ciclo ({materias.length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {materias.map((m, i) => (
                          <SubjectBadge key={i} subject={m} size="sm" />
                        ))}
                      </div>
                    </div>
                    <Button onClick={saveCronograma} disabled={saving} className="w-full h-12 text-lg">
                      {saving ? 'Salvando...' : 'Confirmar e Criar Cronograma'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setShowDeleteConfirm(false)}
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
              Tem certeza que deseja excluir seu cronograma? Esta ação não pode ser desfeita e todas as suas matérias serão perdidas.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={deleteCronograma}
                disabled={deleting}
              >
                {deleting ? 'Excluindo...' : 'Sim, excluir'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CronogramaPage;
