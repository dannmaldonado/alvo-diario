/**
 * PomodoroTimer — display-only component for the circular timer.
 * Receives display props and callbacks only; no hook logic inside.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Play, Pause, RotateCcw, ChevronRight, Flag,
} from 'lucide-react';
import type { PhaseConfig } from '@/hooks/useStudySession';

interface PomodoroTimerProps {
  currentPhase: PhaseConfig;
  phaseIcon: React.ReactNode;
  timeLeft: number;
  isActive: boolean;
  isFullDuration: boolean;
  progress: number;
  isLastPhase: boolean;
  formatTime: (seconds: number) => string;
  onToggle: () => void;
  onReset: () => void;
  onNextPhase: () => void;
  onFinalize: () => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  currentPhase,
  phaseIcon,
  timeLeft,
  isActive,
  isFullDuration,
  progress,
  isLastPhase,
  formatTime,
  onToggle,
  onReset,
  onNextPhase,
  onFinalize,
}) => {
  // Map text colors to stroke colors
  const strokeColor =
    currentPhase.id === 'revisao' ? 'stroke-blue-500'
    : currentPhase.id === 'questoes' ? 'stroke-amber-500'
    : currentPhase.id.includes('intervalo') ? 'stroke-green-500'
    : 'stroke-primary';

  // Map phase IDs to button colors
  const buttonColor =
    currentPhase.id === 'revisao' ? 'bg-blue-500 hover:bg-blue-600'
    : currentPhase.id === 'questoes' ? 'bg-amber-500 hover:bg-amber-600 text-white'
    : currentPhase.id.includes('intervalo') ? 'bg-green-500 hover:bg-green-600'
    : '';

  return (
    <div className="flex flex-col items-center">
      {/* Phase indicator */}
      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6 ${currentPhase.bgColor} ${currentPhase.color}`}>
        {phaseIcon}
        {currentPhase.label}
      </div>

      <p className="text-sm text-muted-foreground text-center mb-8 max-w-xs">
        {currentPhase.description}
      </p>

      {/* Circular progress */}
      <div className="relative flex items-center justify-center mb-10">
        <svg className="w-56 h-56 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" className="stroke-muted fill-none" strokeWidth="3" />
          <circle
            cx="50" cy="50" r="46"
            className={`fill-none transition-all duration-1000 ease-linear ${strokeColor}`}
            strokeWidth="3"
            strokeDasharray="289.03"
            strokeDashoffset={289.03 - (289.03 * progress) / 100}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute text-center">
          <div className="text-5xl font-bold tabular-nums tracking-tighter">
            {formatTime(timeLeft)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {Math.round(progress)}% concluido
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <Button
          size="lg"
          variant="outline"
          className="h-12 w-12 rounded-full p-0"
          onClick={onReset}
          disabled={isFullDuration && !isActive}
        >
          <RotateCcw className="h-5 w-5" />
        </Button>

        <Button
          size="lg"
          className={`h-14 px-10 rounded-full text-base shadow-lg active:scale-95 transition-transform ${buttonColor}`}
          onClick={onToggle}
        >
          {isActive
            ? <><Pause className="mr-2 h-5 w-5 fill-current" /> Pausar</>
            : <><Play className="mr-2 h-5 w-5 fill-current" /> {isFullDuration ? 'Iniciar' : 'Continuar'}</>
          }
        </Button>

        {!isLastPhase && (
          <Button
            size="lg"
            variant="outline"
            className="h-12 w-12 rounded-full p-0"
            onClick={onNextPhase}
            title="Avancar para proxima fase"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}

        <Button
          size="lg"
          variant="destructive"
          className="h-14 px-8 rounded-full text-base shadow-lg"
          onClick={onFinalize}
          title="Finalizar sessao agora"
        >
          <Flag className="mr-2 h-5 w-5" />
          Finalizar
        </Button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
