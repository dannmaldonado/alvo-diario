/**
 * MateriaisPage
 * CRUD management for study materials (books, online courses, etc.)
 * that can be linked to study sessions for tracking.
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { BookOpen, Monitor, FileText, Package, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMateriais, useCreateMaterial, useUpdateMaterial, useDeleteMaterial } from '@/hooks/queries/useMateriais';
import { Material, MaterialTipo, CreateMaterialInput } from '@/types';

// ============================================================================
// CONSTANTS
// ============================================================================

const TIPO_LABELS: Record<MaterialTipo, string> = {
  curso_online: 'Curso Online',
  livro: 'Livro',
  apostila: 'Apostila',
  outro: 'Outro',
};

const TIPO_ICONS: Record<MaterialTipo, React.ReactNode> = {
  curso_online: <Monitor className="h-4 w-4" />,
  livro: <BookOpen className="h-4 w-4" />,
  apostila: <FileText className="h-4 w-4" />,
  outro: <Package className="h-4 w-4" />,
};

const TIPO_COLORS: Record<MaterialTipo, string> = {
  curso_online: 'text-blue-500 bg-blue-500/10',
  livro: 'text-emerald-500 bg-emerald-500/10',
  apostila: 'text-amber-500 bg-amber-500/10',
  outro: 'text-muted-foreground bg-muted',
};

// ============================================================================
// ADD / EDIT FORM
// ============================================================================

interface MaterialFormState {
  nome: string;
  tipo: MaterialTipo;
  descricao: string;
}

const emptyForm = (): MaterialFormState => ({ nome: '', tipo: 'outro', descricao: '' });

interface MaterialFormProps {
  initial?: MaterialFormState;
  onSave: (data: CreateMaterialInput) => void;
  onCancel: () => void;
  isSaving: boolean;
}

const MaterialForm: React.FC<MaterialFormProps> = ({ initial, onSave, onCancel, isSaving }) => {
  const [form, setForm] = useState<MaterialFormState>(initial ?? emptyForm());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return;
    onSave({
      nome: form.nome.trim(),
      tipo: form.tipo,
      descricao: form.descricao.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 border border-primary/30 rounded-xl bg-primary/5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Nome *</Label>
          <Input
            value={form.nome}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, nome: e.target.value }))}
            placeholder="Ex: Estratégia Concursos - Direito Constitucional"
            maxLength={200}
            disabled={isSaving}
            autoFocus
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Tipo</Label>
          <select
            value={form.tipo}
            onChange={e => setForm(p => ({ ...p, tipo: e.target.value as MaterialTipo }))}
            disabled={isSaving}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {(Object.keys(TIPO_LABELS) as MaterialTipo[]).map(t => (
              <option key={t} value={t}>{TIPO_LABELS[t]}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <Label className="text-xs mb-1 block">Descrição (opcional)</Label>
        <Input
          value={form.descricao}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, descricao: e.target.value }))}
          placeholder="Ex: Módulo 3 — Princípios Constitucionais"
          maxLength={500}
          disabled={isSaving}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isSaving || !form.nome.trim()}>
          {isSaving ? 'Salvando...' : (
            <><Check className="h-4 w-4 mr-1" />Salvar</>
          )}
        </Button>
      </div>
    </form>
  );
};

// ============================================================================
// MATERIAL CARD
// ============================================================================

interface MaterialCardProps {
  material: Material;
  onEdit: (material: Material) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const MaterialCard: React.FC<MaterialCardProps> = ({ material, onEdit, onDelete, isDeleting }) => (
  <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors">
    <div className={`shrink-0 p-2 rounded-lg ${TIPO_COLORS[material.tipo as MaterialTipo] || TIPO_COLORS.outro}`}>
      {TIPO_ICONS[material.tipo as MaterialTipo] || TIPO_ICONS.outro}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-sm truncate">{material.nome}</p>
      <p className="text-xs text-muted-foreground">
        {TIPO_LABELS[material.tipo as MaterialTipo] || material.tipo}
        {material.descricao && ` · ${material.descricao}`}
      </p>
    </div>
    <div className="flex items-center gap-1 shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => onEdit(material)}
        title="Editar"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 hover:text-destructive"
        onClick={() => onDelete(material.id)}
        disabled={isDeleting}
        title="Remover"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  </div>
);

// ============================================================================
// PAGE
// ============================================================================

const MateriaisPage: React.FC = () => {
  const { currentUser } = useAuth();
  const materiaisQuery = useMateriais(currentUser?.id);
  const createMutation = useCreateMaterial();
  const updateMutation = useUpdateMaterial();
  const deleteMutation = useDeleteMaterial();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const materiais = materiaisQuery.data ?? [];

  const handleAdd = async (data: CreateMaterialInput) => {
    await createMutation.mutateAsync(data);
    setShowAddForm(false);
  };

  const handleEdit = async (data: CreateMaterialInput) => {
    if (!editingMaterial) return;
    await updateMutation.mutateAsync({ id: editingMaterial.id, data });
    setEditingMaterial(null);
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  return (
    <>
      <Helmet>
        <title>Materiais de Estudo - Alvo Diário</title>
        <meta name="description" content="Gerencie seus materiais de estudo" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-2xl">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold mb-1">Materiais de Estudo</h1>
              <p className="text-sm text-muted-foreground">
                Cadastre seus cursos, livros e apostilas para vincular às sessões.
              </p>
            </div>
            <Button
              onClick={() => { setShowAddForm(true); setEditingMaterial(null); }}
              disabled={showAddForm}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="mb-6">
              <MaterialForm
                onSave={handleAdd}
                onCancel={() => setShowAddForm(false)}
                isSaving={createMutation.isPending}
              />
            </div>
          )}

          {/* Loading */}
          {materiaisQuery.isLoading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner text="Carregando materiais..." />
            </div>
          )}

          {/* Empty state */}
          {!materiaisQuery.isLoading && materiais.length === 0 && !showAddForm && (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-4" />
              <p className="font-semibold mb-1">Nenhum material cadastrado</p>
              <p className="text-sm text-muted-foreground mb-4">
                Adicione cursos, livros ou apostilas que você usa nos estudos.
              </p>
              <Button size="sm" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar primeiro material
              </Button>
            </Card>
          )}

          {/* List */}
          {materiais.length > 0 && (
            <Card className="p-0 overflow-hidden">
              <div className="divide-y divide-border">
                {materiais.map(material => (
                  editingMaterial?.id === material.id ? (
                    <div key={material.id} className="p-4">
                      <MaterialForm
                        initial={{
                          nome: material.nome,
                          tipo: material.tipo as MaterialTipo,
                          descricao: material.descricao ?? '',
                        }}
                        onSave={handleEdit}
                        onCancel={() => setEditingMaterial(null)}
                        isSaving={updateMutation.isPending}
                      />
                    </div>
                  ) : (
                    <div key={material.id} className="px-4 py-2">
                      <MaterialCard
                        material={material}
                        onEdit={setEditingMaterial}
                        onDelete={handleDelete}
                        isDeleting={deleteMutation.isPending}
                      />
                    </div>
                  )
                ))}
              </div>
              <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
                {materiais.length} {materiais.length === 1 ? 'material' : 'materiais'} cadastrados
              </div>
            </Card>
          )}
        </main>
      </div>
    </>
  );
};

export default MateriaisPage;
