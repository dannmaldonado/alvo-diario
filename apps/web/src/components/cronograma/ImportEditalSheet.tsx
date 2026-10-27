/**
 * ImportEditalSheet — Drawer for creating/updating an edital via CSV/XLS upload or manual entry.
 * Uses @e965/xlsx (SheetJS community fork) for browser-side parsing.
 */

import React, { useRef, useState, useCallback } from 'react';
import * as XLSX from '@e965/xlsx';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, PenLine, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useImportEdital } from '@/hooks/queries/useTopicoProgresso';
import { cn } from '@/lib/utils';
import type { Edital } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

interface ParsedTopico {
  nome: string;
  ordem: number;
  questoes_prova?: number;
  horas_sugeridas?: number;
}

interface ParsedMateria {
  nome: string;
  prioridade?: number;
  questoes?: number;
  topicos: ParsedTopico[];
}

interface ParsedEdital {
  materias: ParsedMateria[];
  rowCount: number;
}

interface ImportEditalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (edital: Edital) => void;
}

// ============================================================================
// CSV/XLS PARSER
// ============================================================================

function parseSheetData(rows: Record<string, unknown>[]): ParsedEdital {
  const normalise = (key: string) => key.trim().toLowerCase().replace(/\s+/g, '_');
  const materialMap: Map<string, { topicos: Map<string, ParsedTopico> }> = new Map();

  for (const row of rows) {
    const normRow: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) normRow[normalise(k)] = v;

    const materiaNome = String(normRow['materia'] ?? normRow['matéria'] ?? '').trim();
    const topicoNome = String(normRow['topico'] ?? normRow['tópico'] ?? '').trim();
    if (!materiaNome || !topicoNome) continue;

    const importancia = Number(normRow['importancia'] ?? normRow['importância'] ?? normRow['ordem'] ?? 0);
    const questoes_prova = normRow['questoes_prova'] != null ? Number(normRow['questoes_prova']) : undefined;
    const horas_sugeridas = normRow['horas_sugeridas'] != null ? Number(normRow['horas_sugeridas']) : undefined;

    if (!materialMap.has(materiaNome)) materialMap.set(materiaNome, { topicos: new Map() });
    const mat = materialMap.get(materiaNome)!;
    if (!mat.topicos.has(topicoNome)) {
      mat.topicos.set(topicoNome, { nome: topicoNome, ordem: importancia, questoes_prova, horas_sugeridas });
    }
  }

  const materias: ParsedMateria[] = [];
  for (const [nome, mat] of materialMap.entries()) {
    const topicos = Array.from(mat.topicos.values()).sort((a, b) => a.ordem - b.ordem);
    materias.push({ nome, topicos });
  }
  return { materias, rowCount: rows.length };
}

function parseFile(file: File): Promise<ParsedEdital> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
        resolve(parseSheetData(rows));
      } catch {
        reject(new Error('Não foi possível ler o arquivo. Verifique o formato.'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo.'));
    reader.readAsBinaryString(file);
  });
}

// ============================================================================
// MANUAL ENTRY — inner state types
// ============================================================================

interface ManualTopico {
  id: string; // local key
  nome: string;
  questoes_prova: string;
  horas_sugeridas: string;
}

interface ManualMateria {
  id: string;
  nome: string;
  topicos: ManualTopico[];
}

function emptyTopico(): ManualTopico {
  return { id: crypto.randomUUID(), nome: '', questoes_prova: '', horas_sugeridas: '' };
}

function emptyMateria(): ManualMateria {
  return { id: crypto.randomUUID(), nome: '', topicos: [emptyTopico()] };
}

function manualToEditalMaterias(materias: ManualMateria[]): ParsedMateria[] {
  return materias.map((m) => ({
    nome: m.nome.trim(),
    topicos: m.topicos
      .filter((t) => t.nome.trim())
      .map((t, i) => ({
        nome: t.nome.trim(),
        ordem: i + 1,
        questoes_prova: t.questoes_prova ? Number(t.questoes_prova) : undefined,
        horas_sugeridas: t.horas_sugeridas ? Number(t.horas_sugeridas) : undefined,
      })),
  })).filter((m) => m.nome && m.topicos.length > 0);
}

// ============================================================================
// MANUAL ENTRY FORM
// ============================================================================

interface ManualFormProps {
  materias: ManualMateria[];
  onChange: (materias: ManualMateria[]) => void;
}

function ManualForm({ materias, onChange }: ManualFormProps) {
  const updateMateria = (id: string, field: keyof ManualMateria, value: string) => {
    onChange(materias.map((m) => m.id === id ? { ...m, [field]: value } : m));
  };

  const addMateria = () => onChange([...materias, emptyMateria()]);

  const removeMateria = (id: string) => {
    if (materias.length === 1) return;
    onChange(materias.filter((m) => m.id !== id));
  };

  const updateTopico = (materiaId: string, topicoId: string, field: keyof ManualTopico, value: string) => {
    onChange(materias.map((m) => m.id !== materiaId ? m : {
      ...m,
      topicos: m.topicos.map((t) => t.id === topicoId ? { ...t, [field]: value } : t),
    }));
  };

  const addTopico = (materiaId: string) => {
    onChange(materias.map((m) => m.id !== materiaId ? m : {
      ...m, topicos: [...m.topicos, emptyTopico()],
    }));
  };

  const removeTopico = (materiaId: string, topicoId: string) => {
    onChange(materias.map((m) => m.id !== materiaId ? m : {
      ...m, topicos: m.topicos.filter((t) => t.id !== topicoId),
    }));
  };

  return (
    <div className="space-y-4">
      {materias.map((materia, mIdx) => (
        <div key={materia.id} className="border rounded-xl overflow-hidden">
          {/* Matéria header */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/40 border-b">
            <span className="text-xs font-semibold text-muted-foreground w-5 shrink-0 text-center">{mIdx + 1}</span>
            <input
              type="text"
              placeholder="Nome da matéria"
              value={materia.nome}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateMateria(materia.id, 'nome', e.target.value)}
              className="flex-1 bg-transparent text-sm font-semibold placeholder:text-muted-foreground/50 focus:outline-none"
            />
            {materias.length > 1 && (
              <button
                type="button"
                onClick={() => removeMateria(materia.id)}
                className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Tópicos */}
          <div className="px-3 py-2 space-y-1.5">
            {materia.topicos.map((topico, tIdx) => (
              <div key={topico.id} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-5 text-center shrink-0">{tIdx + 1}</span>
                <input
                  type="text"
                  placeholder="Nome do tópico"
                  value={topico.nome}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateTopico(materia.id, topico.id, 'nome', e.target.value)}
                  className="flex-1 min-w-0 rounded-md border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="number"
                  placeholder="Qtd"
                  title="Questões na prova"
                  value={topico.questoes_prova}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateTopico(materia.id, topico.id, 'questoes_prova', e.target.value)}
                  className="w-14 rounded-md border bg-background px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {materia.topicos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTopico(materia.id, topico.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addTopico(materia.id)}
              className="flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors mt-1 pl-7"
            >
              <Plus className="h-3 w-3" />
              Adicionar tópico
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addMateria}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/20 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus className="h-4 w-4" />
        Adicionar matéria
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

type Tab = 'import' | 'manual';

export function ImportEditalSheet({ open, onOpenChange, onSuccess }: ImportEditalSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportEdital();

  const [tab, setTab] = useState<Tab>('import');
  const [titulo, setTitulo] = useState('');
  const [banca, setBanca] = useState('');
  const [cargo, setCargo] = useState('');

  // Import tab state
  const [parsed, setParsed] = useState<ParsedEdital | null>(null);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Manual tab state
  const [manualMaterias, setManualMaterias] = useState<ManualMateria[]>([emptyMateria()]);

  const reset = () => {
    setParsed(null);
    setFileName('');
    setParseError('');
    setTitulo('');
    setBanca('');
    setCargo('');
    setManualMaterias([emptyMateria()]);
    setTab('import');
  };

  const handleFile = useCallback(async (file: File) => {
    setParseError('');
    setParsed(null);
    setFileName(file.name);
    if (!titulo) setTitulo(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
    try {
      const result = await parseFile(file);
      if (result.materias.length === 0) {
        setParseError('Nenhuma linha válida. Verifique as colunas: Materia, Topico, Importancia.');
        return;
      }
      setParsed(result);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Erro ao processar arquivo.');
    }
  }, [titulo]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const getMateriasToPersist = (): ParsedMateria[] | null => {
    if (tab === 'import') return parsed?.materias ?? null;
    const materias = manualToEditalMaterias(manualMaterias);
    return materias.length > 0 ? materias : null;
  };

  const canSubmit = !!titulo.trim() && !!getMateriasToPersist();

  const handleImport = async () => {
    const materias = getMateriasToPersist();
    if (!materias || !titulo.trim()) return;
    try {
      const edital = await importMutation.mutateAsync({
        titulo: titulo.trim(),
        banca: banca.trim() || undefined,
        cargo: cargo.trim() || undefined,
        materias,
      });
      onSuccess?.(edital as Edital);
      onOpenChange(false);
      reset();
    } catch {
      // Error surfaced via importMutation.error
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="px-5 py-4 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            Edital de Estudos
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Metadata */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="titulo-import">Título *</Label>
              <Input
                id="titulo-import"
                placeholder="Ex: Edital PC-SP 2026"
                value={titulo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitulo(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="banca-import">Banca</Label>
                <Input
                  id="banca-import"
                  placeholder="Ex: VUNESP"
                  value={banca}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBanca(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cargo-import">Cargo</Label>
                <Input
                  id="cargo-import"
                  placeholder="Ex: Investigador"
                  value={cargo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCargo(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-lg bg-muted">
            <button
              type="button"
              onClick={() => setTab('import')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                tab === 'import'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Upload className="h-3.5 w-3.5" />
              Importar arquivo
            </button>
            <button
              type="button"
              onClick={() => setTab('manual')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                tab === 'manual'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <PenLine className="h-3.5 w-3.5" />
              Inserir manual
            </button>
          </div>

          {/* ---- IMPORT TAB ---- */}
          {tab === 'import' && (
            <div className="space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  className="hidden"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                <Upload className="h-7 w-7 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">{fileName || 'Arraste ou clique para selecionar'}</p>
                <p className="text-xs text-muted-foreground mt-1">CSV, XLS ou XLSX</p>
              </div>

              {/* Format hint */}
              <div className="rounded-lg bg-muted/40 px-3.5 py-3 text-xs space-y-1">
                <p className="font-semibold text-foreground/80">Colunas esperadas</p>
                <p className="text-muted-foreground">
                  <span className="text-foreground font-medium">Obrigatórias:</span> Materia · Topico · Importancia
                </p>
                <p className="text-muted-foreground">
                  <span className="text-foreground font-medium">Opcionais:</span> Questoes_Prova · Horas_Sugeridas
                </p>
              </div>

              {/* Parse error */}
              {parseError && (
                <div className="flex items-start gap-2.5 rounded-lg bg-destructive/10 border border-destructive/20 px-3.5 py-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Preview */}
              {parsed && !parseError && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">
                      {parsed.rowCount} linhas · {parsed.materias.length} matérias · {parsed.materias.reduce((s, m) => s + m.topicos.length, 0)} tópicos
                    </span>
                  </div>
                  <div className="max-h-44 overflow-y-auto space-y-1.5 rounded-lg border bg-muted/20 p-2">
                    {parsed.materias.map((m) => (
                      <div key={m.nome} className="text-xs">
                        <p className="font-semibold text-foreground/80">{m.nome}</p>
                        <p className="text-muted-foreground pl-2">
                          {m.topicos.slice(0, 3).map((t) => t.nome).join(' · ')}
                          {m.topicos.length > 3 && ` · +${m.topicos.length - 3} mais`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---- MANUAL TAB ---- */}
          {tab === 'manual' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Adicione matérias e tópicos em ordem de importância. O campo <strong>Qtd</strong> é o número de questões da matéria na prova (opcional).
              </p>
              <ManualForm materias={manualMaterias} onChange={setManualMaterias} />
            </div>
          )}

          {/* Import error */}
          {importMutation.error && (
            <div className="flex items-start gap-2.5 rounded-lg bg-destructive/10 border border-destructive/20 px-3.5 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{importMutation.error.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-4 flex gap-3 shrink-0">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => { onOpenChange(false); reset(); }}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1"
            disabled={!canSubmit || importMutation.isPending}
            onClick={handleImport}
          >
            {importMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {importMutation.isPending ? 'Salvando...' : 'Salvar edital'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
