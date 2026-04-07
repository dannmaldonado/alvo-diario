/**
 * MateriasInput Component
 * Dynamic multi-value input for managing study subjects (materias).
 * Supports add/remove with Enter key and button interaction.
 */

import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

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

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((materia, index) => (
            <Badge
              key={`${materia}-${index}`}
              variant="secondary"
              className="gap-1 pr-1 text-sm"
            >
              {materia}
              <button
                type="button"
                onClick={() => removeMateria(index)}
                disabled={disabled}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                aria-label={`Remover ${materia}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
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
