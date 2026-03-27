
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { CronogramaService } from '@/services/cronograma.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Trash2, Plus, Sparkles, Target, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import SubjectBadge from '@/components/SubjectBadge';
import { useScheduleCalculator } from '@/hooks';

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
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cronograma, setCronograma] = useState(null);
  
  // Form State
  const [edital, setEdital] = useState('');
  const [dataAlvo, setDataAlvo] = useState('');
  const [materias, setMaterias] = useState([]);
  
  // View State
  const [viewCycleOffset, setViewCycleOffset] = useState(0);

  useEffect(() => {
    loadCronograma();
  }, []);

  const loadCronograma = async () => {
    try {
      setLoading(true);
      const cronogramas = await CronogramaService.getAll(currentUser.id);

      if (cronogramas.length > 0) {
        const c = cronogramas[0] as any;
        setCronograma(c);
        setEdital(c.edital);
        setDataAlvo(c.data_alvo || c.data_fim);
        setMaterias(c.materias || []);
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

    const subjects = EDITAL_SUBJECTS[edital];
    const scheduledMaterias = subjects.map((subject) => ({
      name: subject,
      status: 'pendente'
    }));

    setMaterias(scheduledMaterias);
    toast.success(`Ciclo gerado com ${subjects.length} matérias`);
  };

  const addMateria = () => {
    setMaterias([...materias, { name: '', status: 'pendente' }]);
  };

  const removeMateria = (index) => {
    setMaterias(materias.filter((_, i) => i !== index));
  };

  const updateMateria = (index, field, value) => {
    const updated = [...materias];
    updated[index][field] = value;
    setMaterias(updated);
  };

  const saveCronograma = async () => {
    if (!edital || !dataAlvo || materias.length === 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (materias.some(m => !m.name)) {
      toast.error('Todas as matérias devem ter um nome');
      return;
    }

    try {
      setSaving(true);
      const data: any = {
        user_id: currentUser.id,
        edital,
        data_fim: dataAlvo,
        data_inicio: dataAlvo,
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
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Cronograma - PoliceStudy</title>
        <meta name="description" content="Gerencie seu cronograma de estudos em ciclos" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

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
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-primary/10 p-3 rounded-xl">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{cronograma.edital}</h2>
                      <p className="text-sm text-muted-foreground">
                        Prova: {new Date(cronograma.data_alvo).toLocaleDateString('pt-BR')}
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
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="font-semibold text-lg mb-4">Editar Matérias do Ciclo</h3>
                  <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto pr-2">
                    {materias.map((materia, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-1">
                          <Input
                            value={materia.name}
                            onChange={(e: any) => updateMateria(index, 'name', e.target.value)}
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
            <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl p-8 shadow-sm">
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
                    <SelectTrigger id="edital" className="h-12">
                      <SelectValue placeholder="Selecione o edital" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PC">Polícia Civil (PC)</SelectItem>
                      <SelectItem value="PRF">Polícia Rodoviária Federal (PRF)</SelectItem>
                      <SelectItem value="PF">Polícia Federal (PF)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataAlvo">Data Prevista da Prova</Label>
                  <Input
                    id="dataAlvo"
                    type="date"
                    value={dataAlvo}
                    onChange={(e: any) => setDataAlvo(e.target.value)}
                    className="h-12"
                  />
                </div>

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
    </>
  );
};

export default CronogramaPage;
