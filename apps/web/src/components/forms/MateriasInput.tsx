/**
 * MateriasInput Component
 * Dynamic multi-value input for managing study subjects (materias).
 * Supports add/remove with Enter key, and ↑↓ reorder buttons.
 * The array order determines cycle order.
 */

import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X, ChevronUp, ChevronDown } from 'lucide-react';

interface MateriasInputProps {
  value: string[];
  onChange: (materias: string[]) => void;
  error?: string;
  disabled?: boolean;
}

const MateriasInput: React.FC<MateriasInputProps> = ({
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');

  const addMateria = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setInputValue('');
      return;
    }
    onChange([...value, trimmed]);
    setInputValue('');
  }, [inputValue, value, onChange]);

  const removeMateria = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange]
  );

  const moveMateria = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const newList = [...value];
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= newList.length) return;
      [newList[index], newList[targetIdx]] = [newList[targetIdx], newList[index]];
      onChange(newList);
    },
    [value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addMateria();
      }
    },
    [addMateria]
  );

  return (
    <div className="space-y-3">
      {/* Add input */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setInputValue(e.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder="Digite o nome da materia e pressione Enter"
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addMateria}
          disabled={disabled || !inputValue.trim()}
          aria-label="Adicionar materia"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Ordered list with reorder controls */}
      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((materia, index) => (
            <li
              key={`${materia}-${index}`}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
            >
              {/* Position indicator */}
              <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground">
                {index + 1}
              </span>

              {/* Subject name */}
              <span className="flex-1 truncate font-medium">{materia}</span>

              {/* Reorder buttons */}
              <div className="flex shrink-0 gap-0.5">
                <button
                  type="button"
                  onClick={() => moveMateria(index, 'up')}
                  disabled={disabled || index === 0}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label={`Mover ${materia} para cima`}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveMateria(index, 'down')}
                  disabled={disabled || index === value.length - 1}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label={`Mover ${materia} para baixo`}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeMateria(index)}
                disabled={disabled}
                className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label={`Remover ${materia}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {value.length === 0 && !error && (
        <p className="text-xs text-muted-foreground">
          Nenhuma materia adicionada ainda
        </p>
      )}

      {error && (
        <p className="text-xs font-medium text-destructive animate-slide-down">
          {error}
        </p>
      )}
    </div>
  );
};

export default MateriasInput;
