/**
 * EditaisPage — List of user's editais + create new via PDF upload
 *
 * Flow:
 * 1. User uploads PDF edital
 * 2. Claude parses subjects + detects banca
 * 3. "Verticalizar" — AI ranks subjects by historical banca incidence
 * 4. Saved as Edital entity → redirects to EditalDetailPage
 */

import React, { useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Upload, Loader2, TrendingUp, CheckCircle2, AlertCircle, X, Calendar, Target, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EditalService } from '@/services/edital.service';
import { EditaisService } from '@/services/editais.service';
import { useEditaisList, useDeleteEdital } from '@/hooks/queries/useEditais';
import type { Edital, EditalParseResult, EditalMateriaItem } from '@/types';
import { toast } from 'sonner';

// ============================================================================
// PROGRESS HELPERS
// ============================================================================

function calcProgress(edital: Edital) {
  let total = 0;
  let done = 0;
  edital.materias.forEach(m => {
    m.topicos.forEach(t => {
      total++;
      if (t.estudado) done++;
    });
  });
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

// ============================================================================
// EDITAL CARD
// ============================================================================

interface EditalCardProps {
  edital: Edital;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const EditalCard: React.FC<EditalCardProps> = ({ edital, onDelete, isDeleting }) => {
  const navigate = useNavigate();
  const progress = calcProgress(edital);
  const totalTopicos = edital.materias.reduce((acc, m) => acc + m.topicos.length, 0);
  const doneTopicos = edital.materias.reduce(
    (acc, m) => acc + m.topicos.filter(t => t.estudado).length, 0
  );

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm leading-snug truncate">{edital.titulo}</h3>
            {edital.cargo && (
              <p className="text-xs text-muted-foreground mt-0.5">{edital.cargo}</p>
            )}
            {edital.banca && (
              <span className="inline-block text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-md mt-1">
                {edital.banca}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDelete(edital.id)}
          disabled={isDeleting}
          className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        {edital.total_questoes && (
          <span className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            {edital.total_questoes} questões
          </span>
        )}
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          {doneTopicos}/{totalTopicos} tópicos
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Progresso</span>
          <span className="text-xs font-semibold text-primary">{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => navigate(`/editais/${edital.id}`)}
        >
          Ver Edital
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={() => navigate(`/cronograma?edital_id=${edital.id}`)}
        >
          <Calendar className="h-3.5 w-3.5 mr-1" />
          Cronograma
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// CREATE FLOW (inline panel)
// ============================================================================

type CreateStep = 'idle' | 'parsing' | 'parsed' | 'verticalizing' | 'saving' | 'error';

interface ParsedState {
  result: EditalParseResult;
}

const CreateEditalPanel: React.FC<{ onCreated: (id: string) => void; onCancel: () => void }> = ({
  onCreated,
  onCancel,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<CreateStep>('idle');
  const [parsed, setParsed] = useState<ParsedState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    setStep('parsing');
    setError(null);
    setParsed(null);

    try {
      const result = await EditalService.parse(file);
      if (!result.materias || result.materias.length === 0) {
        throw new Error('Nenhuma matéria encontrada no edital. Verifique se o PDF contém o conteúdo programático.');
      }
      setParsed({ result });
      setStep('parsed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar o edital.');
      setStep('error');
    }
  };

  const handleVerticalizar = async () => {
    if (!parsed) return;
    setStep('verticalizing');
    setError(null);

    try {
      const verticalizado = await EditalService.verticalizar({
        banca: parsed.result.banca,
        concurso: parsed.result.concurso,
        materias: parsed.result.materias,
      });

      setStep('saving');

      // Build titulo from available data
      const titulo = [verticalizado.concurso || parsed.result.concurso, verticalizado.banca || parsed.result.banca]
        .filter(Boolean)
        .join(' — ') || 'Edital';

      // Convert AI output to Edital entity
      const materias: EditalMateriaItem[] = (verticalizado.materias || []).map(m => ({
        nome: m.nome,
        questoes: m.questoes || 0,
        prioridade: m.prioridade || 'media',
        topicos: (m.topicos || []).map((t: any, idx: number) => ({
          nome: t.nome,
          ordem: t.ordem ?? idx + 1,
          estudado: false,
        })),
      }));

      const edital = await EditaisService.create({
        titulo,
        banca: verticalizado.banca || parsed.result.banca,
        cargo: verticalizado.cargo,
        concurso: verticalizado.concurso || parsed.result.concurso,
        total_questoes: verticalizado.total_questoes || null,
        materias,
      });

      onCreated(edital.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar edital verticalizado.');
      setStep('parsed'); // allow retry
    }
  };

  // ---- idle / error ----
  if (step === 'idle' || step === 'error') {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
        >
          <Upload className="h-6 w-6" />
          <span className="text-sm font-medium">Clique para selecionar o PDF do edital</span>
          <span className="text-xs">Máximo 10MB · Recomendado até 50 páginas</span>
        </button>
        <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFile} />
        {step === 'error' && error && (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} className="flex-1">Cancelar</Button>
        </div>
      </div>
    );
  }

  // ---- parsing ----
  if (step === 'parsing') {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
        <p className="text-sm font-medium">Analisando edital com IA...</p>
        <p className="text-xs text-muted-foreground">Extraindo matérias e detectando banca</p>
      </div>
    );
  }

  // ---- verticalizing ----
  if (step === 'verticalizing') {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <TrendingUp className="h-6 w-6 text-primary animate-pulse" />
        <p className="text-sm font-medium">Verticalizando edital...</p>
        <p className="text-xs text-muted-foreground">
          Ordenando matérias por incidência histórica{parsed?.result.banca ? ` da banca ${parsed.result.banca}` : ''}
        </p>
      </div>
    );
  }

  // ---- saving ----
  if (step === 'saving') {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
        <p className="text-sm font-medium">Salvando edital...</p>
      </div>
    );
  }

  // ---- parsed — ready to verticalizar ----
  return (
    <div className="space-y-4">
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">
              {parsed?.result.materias.length} matéria{parsed?.result.materias.length !== 1 ? 's' : ''} encontrada{parsed?.result.materias.length !== 1 ? 's' : ''}
            </p>
            {parsed?.result.concurso && (
              <p className="text-xs text-muted-foreground mt-0.5">{parsed.result.concurso}</p>
            )}
            {parsed?.result.banca && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                Banca: {parsed.result.banca}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Button onClick={handleVerticalizar} className="w-full" size="sm">
          <TrendingUp className="h-4 w-4 mr-2" />
          Gerar Edital Verticalizado com IA
          {parsed?.result.banca ? ` (${parsed.result.banca})` : ''}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          A IA irá ordenar os tópicos por incidência histórica em provas da banca
        </p>
        <Button variant="ghost" size="sm" className="w-full" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE
// ============================================================================

const EditaisPage: React.FC = () => {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const { data: editais, isLoading } = useEditaisList();
  const deleteMutation = useDeleteEdital();

  const handleCreated = (id: string) => {
    toast.success('Edital verticalizado criado!');
    navigate(`/editais/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este edital? Esta ação não pode ser desfeita.')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Edital excluído.');
    } catch {
      toast.error('Erro ao excluir edital.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Editais — Alvo Diário</title>
      </Helmet>

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl tracking-tight mb-1">Meus Editais</h1>
            <p className="text-base text-muted-foreground">
              Edital verticalizado com checklist de estudos ordenado por incidência histórica.
            </p>
          </div>
          {!showCreate && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Edital
            </Button>
          )}
        </div>

        {/* Create panel */}
        {showCreate && (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Novo Edital Verticalizado</h2>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <CreateEditalPanel
              onCreated={handleCreated}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner text="Carregando editais..." />
          </div>
        ) : !editais || editais.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Nenhum edital ainda</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Faça upload do PDF do seu edital e a IA vai criar um checklist verticalizado com os tópicos ordenados por incidência histórica.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Criar meu primeiro edital
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {editais.map(edital => (
              <EditalCard
                key={edital.id}
                edital={edital}
                onDelete={handleDelete}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default EditaisPage;
