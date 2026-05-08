/**
 * EditalUpload — PDF edital upload + subject extraction via Claude AI
 * Used inside CronogramaForm to auto-populate subjects from an edital PDF.
 */

import React, { useRef, useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditalService } from '@/services/edital.service';
import type { EditalParseResult, EditalMateria } from '@/types';

interface EditalUploadProps {
  /** Called when user confirms the extracted subjects to import */
  onImport: (materias: string[], banca?: string | null) => void;
}

type UploadState = 'idle' | 'loading' | 'success' | 'error';

export function EditalUpload({ onImport }: EditalUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>('idle');
  const [result, setResult] = useState<EditalParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset
    setState('loading');
    setResult(null);
    setError(null);
    setSelected(new Set());

    try {
      const data = await EditalService.parse(file);
      setResult(data);
      // Pre-select all extracted subjects
      setSelected(new Set(data.materias.map(m => m.nome)));
      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar o edital.');
      setState('error');
    }

    // Reset file input so same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleMateria = (nome: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(nome)) next.delete(nome);
      else next.add(nome);
      return next;
    });
  };

  const handleImport = () => {
    if (!result) return;
    const materiasToImport = result.materias
      .filter(m => selected.has(m.nome))
      .map(m => m.nome);
    onImport(materiasToImport, result.banca);
    setResult(null);
    setState('idle');
    setSelected(new Set());
  };

  const handleReset = () => {
    setState('idle');
    setResult(null);
    setError(null);
    setSelected(new Set());
  };

  return (
    <div className="space-y-3">
      {/* Upload trigger */}
      {state === 'idle' || state === 'error' ? (
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Upload className="h-5 w-5" />
            <span className="text-sm font-medium">Importar Edital (PDF)</span>
            <span className="text-xs">Clique para selecionar • Máx. 10MB</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          {state === 'error' && error && (
            <div className="mt-2 flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : null}

      {/* Loading */}
      {state === 'loading' && (
        <div className="border rounded-xl p-6 flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
          <p className="text-sm font-medium">Analisando edital com IA...</p>
          <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos</p>
        </div>
      )}

      {/* Results */}
      {state === 'success' && result && (
        <div className="border rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-3 flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">
                  {result.materias.length} matéria{result.materias.length !== 1 ? 's' : ''} encontrada{result.materias.length !== 1 ? 's' : ''}
                </p>
                {result.concurso && (
                  <p className="text-xs text-muted-foreground mt-0.5">{result.concurso}</p>
                )}
                {result.banca && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Banca: {result.banca}</p>
                )}
              </div>
            </div>
            <button onClick={handleReset} className="text-muted-foreground hover:text-foreground flex-shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Subject list */}
          <div className="max-h-60 overflow-y-auto divide-y divide-border">
            {result.materias.map((m: EditalMateria) => (
              <button
                key={m.nome}
                type="button"
                onClick={() => toggleMateria(m.nome)}
                className={`w-full text-left px-4 py-2.5 flex items-start gap-2 transition-colors ${
                  selected.has(m.nome) ? 'bg-primary/5' : 'hover:bg-muted/50'
                }`}
              >
                <div className={`mt-0.5 h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                  selected.has(m.nome) ? 'bg-primary border-primary' : 'border-border'
                }`}>
                  {selected.has(m.nome) && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                </div>
                <div>
                  <p className="text-sm font-medium leading-snug">{m.nome}</p>
                  {m.topicos?.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {m.topicos.slice(0, 3).join(', ')}{m.topicos.length > 3 ? '...' : ''}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Footer actions */}
          <div className="px-4 py-3 border-t bg-muted/30 flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{selected.size} selecionada{selected.size !== 1 ? 's' : ''}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>Cancelar</Button>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={selected.size === 0}
                className="gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Importar {selected.size > 0 ? selected.size : ''} matéria{selected.size !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditalUpload;
