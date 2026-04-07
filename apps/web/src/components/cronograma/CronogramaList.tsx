/**
 * CronogramaList Component
 * Displays all user's cronogramas in a card grid.
 * Active cronograma is visually highlighted with a border/badge.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cronograma } from '@/types';
import {
  Target,
  Calendar,
  BookOpen,
  Pencil,
  Trash2,
  Plus,
} from 'lucide-react';
import SubjectBadge from '@/components/SubjectBadge';

interface CronogramaListProps {
  cronogramas: Cronograma[];
  activeCronogramaId: string | null;
  onEdit: (cronograma: Cronograma) => void;
  onDelete: (cronograma: Cronograma) => void;
  onCreate: () => void;
  onSelect: (cronograma: Cronograma) => void;
}

const CronogramaList: React.FC<CronogramaListProps> = ({
  cronogramas,
  activeCronogramaId,
  onEdit,
  onDelete,
  onCreate,
  onSelect,
}) => {
  if (cronogramas.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">
          Nenhum cronograma encontrado
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Crie seu primeiro cronograma de estudos para comecar a organizar suas
          materias em ciclos.
        </p>
        <Button onClick={onCreate} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Criar Cronograma
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Seus Cronogramas ({cronogramas.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            Clique em um cronograma para visualizar o ciclo
          </p>
        </div>
        <Button onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cronograma
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cronogramas.map((cronograma) => {
          const isActive = cronograma.id === activeCronogramaId;
          return (
            <div
              key={cronograma.id}
              className={`bg-card border rounded-2xl p-5 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer ${
                isActive
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/40'
              }`}
              onClick={() => onSelect(cronograma)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(cronograma);
                }
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">
                      {cronograma.edital}
                    </h3>
                    {isActive && (
                      <Badge variant="default" className="mt-1 text-[10px]">
                        Ativo
                      </Badge>
                    )}
                    {cronograma.status === 'pausado' && (
                      <Badge variant="secondary" className="mt-1 text-[10px]">
                        Pausado
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onEdit(cronograma);
                    }}
                    aria-label="Editar cronograma"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onDelete(cronograma);
                    }}
                    aria-label="Excluir cronograma"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 mb-3">
                {cronograma.data_alvo && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      Prova:{' '}
                      {new Date(cronograma.data_alvo).toLocaleDateString(
                        'pt-BR'
                      )}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>
                    {cronograma.materias?.length || 0} materias no ciclo
                  </span>
                </div>
              </div>

              {/* Materias preview */}
              {cronograma.materias && cronograma.materias.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {cronograma.materias.slice(0, 4).map((materia, i) => (
                    <SubjectBadge key={i} subject={materia} size="sm" />
                  ))}
                  {cronograma.materias.length > 4 && (
                    <span className="text-xs text-muted-foreground self-center ml-1">
                      +{cronograma.materias.length - 4} mais
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CronogramaList;
