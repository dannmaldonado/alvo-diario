/**
 * EditalUpload — PDF edital upload + subject extraction via Claude AI
 * After a successful parse, optionally generates an Edital Verticalizado
 * (subjects ranked by historical banca incidence).
 *
 * All buttons MUST have type="button" to avoid submitting the parent form.
 */

import React, { useRef, useState } from 'react';
import { Upload, Loader2, CheckCircle2, AlertCircle, X, Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditalService } from '@/services/edital.service';
import { EditalVerticalizadoView } from '@/components/cronograma/EditalVerticalizadoView';
import type { EditalParseResult, EditalMateria, EditalVerticalizado } from '@/types';

interface EditalUploadProps {
  /** Called when user confirms the extracted subjects to import */
  onImport: (materias: string[], banca?: string | null, verticalizacao?: EditalVerticalizado | null) => void;
}

type UploadState = 'idle' | 'loading' | 'success' | 'verticalizing' | 'error';

export function EditalUpload({ onImport }: EditalUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>('idle');
  const [result, setResult] = useState<EditalParseResult | null>(null);
  const [verticalizacao, setVerticalizacao] = useState<EditalVerticalizado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setState('loading');
    setResult(null);
    setVerticalizacao(null);
    setError(null);
    setSelected(new Set());

    try {
      const data = await EditalService.parse(file);
      setResult(data);
      setSelected(new Set(data.materias.map(m => m.nome)));
      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar o edital.');
      setState('error');
    }

    // Reset so same file can be re-selected
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
    const toImport = result.materias.filter(m => selected.has(m.nome)).map(m => m.nome);
    onImport(toImport, result.banca, verticalizacao);
    handleReset();
  };

  const handleVerticalizar = async () => {
    if (!result) return;
    setState('verticalizing');
    try {
      const v = await EditalService.verticalizar({
        banca: result.banca,
        concurso: result.concurso,
        // Only send selected materias with their topics
        materias: result.materias.filter(m => selected.has(m.nome)),
      });
      setVerticalizacao(v);
      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao verticalizar o edital.');
      setState('success'); // stay in success so user can still import without verticalizacao
    }
  };

  const handleReset = () => {
    setState('idle');
    setResult(null);
    setVerticalizacao(null);
    setError(null);
    setSelected(new Set());
  };

  // ---- Idle / Error state ----
  if (state === 'idle' || state === 'error') {
    return (
      <div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
        >
          <Upload className="h-5 w-5" />
          <span className="text-sm font-medium">Clique para selecionar o PDF do edital</span>
          <span className="text-xs">Máximo 10MB · Recomendado até 50 páginas · Claude extrai as matérias automaticamente</span>
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
    );
  }

  // ---- Loading state (PDF parse) ----
  if (state === 'loading') {
    return (
      <div className="border rounded-xl p-6 flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
        <p className="text-sm font-medium">Analisando edital com IA...</p>
        <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos</p>
      </div>
    );
  }

  // ---- Verticalizing state ----
  if (state === 'verticalizing') {
    return (
      <div className="border rounded-xl p-6 flex flex-col items-center gap-3 text-center">
        <TrendingUp className="h-6 w-6 text-primary animate-pulse" />
        <p className="text-sm font-medium">Verticalizando edital com IA...</p>
        <p className="text-xs text-muted-foreground">
          Analisando histórico de provas{result?.banca ? ` da banca ${result.banca}` : ''}...
        </p>
      </div>
    );
  }

  // ---- Success state ----
  return (
    <div className="border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-3 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">
              {result?.materias.length} matéria{result?.materias.length !== 1 ? 's' : ''} encontrada{result?.materias.length !== 1 ? 's' : ''}
            </p>
            {result?.concurso && (
              <p className="text-xs text-muted-foreground mt-0.5">{result.concurso}</p>
            )}
            {result?.banca && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Banca detectada: {result.banca}</p>
            )}
          </div>
        </div>
        {/* type="button" prevents form submission */}
        <button type="button" onClick={handleReset} className="text-muted-foreground hover:text-foreground flex-shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Subject list */}
      <div className="max-h-52 overflow-y-auto divide-y divide-border">
        {result?.materias.map((m: EditalMateria) => (
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
              {selected.has(m.nome) && (
                <svg className="h-2.5 w-2.5 text-primary-foreground" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
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

      {/* Error banner (only for verticalizar errors — stays in success state) */}
      {error && state === 'success' && (
        <div className="px-4 py-2 bg-destructive/5 border-t border-destructive/20 flex items-start gap-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Edital Verticalizado — shown after generation */}
      {verticalizacao && (
        <div className="border-t border-border px-4 py-3">
          <EditalVerticalizadoView data={verticalizacao} compact />
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t bg-muted/30 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{selected.size} selecionada{selected.size !== 1 ? 's' : ''}</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleReset}>
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleImport}
              disabled={selected.size === 0}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Importar {selected.size > 0 ? selected.size : ''} matéria{selected.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>

        {/* Verticalizar button — only when banca is detected and not yet done */}
        {result?.banca && !verticalizacao && (
          <button
            type="button"
            onClick={handleVerticalizar}
            disabled={selected.size === 0}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors py-1"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Gerar Edital Verticalizado com IA (banca {result.banca})
          </button>
        )}
      </div>
    </div>
  );
}

export default EditalUpload;
