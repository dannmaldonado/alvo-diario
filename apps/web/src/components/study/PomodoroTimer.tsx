/**
 * PomodoroTimer — display-only component for the circular timer.
 *
 * Normal state: circular timer + play/pause/reset/skip controls.
 *
 * phaseCompleted state (after intervalo or questões ends):
 *   Shows a decision screen with two choices:
 *   - Repeat: go back to the study block (e.g. "Mais Revisão")
 *   - Advance: move to the next study block or finish (e.g. "Ir para Estudo")
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Play, Pause, RotateCcw, ChevronRight, Flag, RefreshCw, CheckCircle2,
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
  phaseCompleted: boolean;
  repeatLabel: string;
  advanceLabel: string;
  nextPhaseLabel: string;
  formatTime: (seconds: number) => string;
  onToggle: () => void;
  onReset: () => void;
  onNextPhase: () => void;
  onRepeat: () => void;
  onAdvance: () => void;
  onFinalize: () => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  currentPhase,
  phaseIcon,
  timeLeft,
  isActive,
  isFullDuration,
  progress,
  phaseCompleted,
  repeatLabel,
  advanceLabel,
  formatTime,
  onToggle,
  onReset,
  onNextPhase,
  onRepeat,
  onAdvance,
  onFinalize,
}) => {
  const strokeColor =
    phaseCompleted ? 'stroke-green-500'
    : currentPhase.id === 'revisao' ? 'stroke-blue-500'
    : currentPhase.id === 'questoes' ? 'stroke-amber-500'
    : currentPhase.id.includes('intervalo') ? 'stroke-green-500'
    : 'stroke-primary';

  const buttonColor =
    currentPhase.id === 'revisao' ? 'bg-blue-500 hover:bg-blue-600'
    : currentPhase.id === 'questoes' ? 'bg-amber-500 hover:bg-amber-600 text-white'
    : currentPhase.id.includes('intervalo') ? 'bg-green-500 hover:bg-green-600'
    : '';

  const displayProgress = phaseCompleted ? 100 : progress;

  return (
    <div className="flex flex-col items-center">
      {/* Phase badge */}
      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6 ${currentPhase.bgColor} ${currentPhase.color}`}>
        {phaseIcon}
        {currentPhase.label}
      </div>

      <p className="text-sm text-muted-foreground text-center mb-8 max-w-xs">
        {phaseCompleted
          ? 'Bloco concluído! O que deseja fazer agora?'
          : currentPhase.description}
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
            strokeDashoffset={289.03 - (289.03 * displayProgress) / 100}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute text-center">
          {phaseCompleted ? (
            <div className="flex flex-col items-center gap-1">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <span className="text-xs text-muted-foreground font-medium">Concluído</span>
            </div>
          ) : (
            <>
              <div className="text-5xl font-bold tabular-nums tracking-tighter">
                {formatTime(timeLeft)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {Math.round(progress)}% concluído
              </div>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      {phaseCompleted ? (
        /* Decision screen: shown after intervalo or questões ends */
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          <Button
            size="lg"
            variant="outline"
            className="w-full h-12 gap-2 border-2"
            onClick={onRepeat}
          >
            <RefreshCw className="h-4 w-4" />
            {repeatLabel}
          </Button>
          <Button
            size="lg"
            className={`w-full h-12 gap-2 ${buttonColor}`}
            onClick={onAdvance}
          >
            <ChevronRight className="h-4 w-4" />
            {advanceLabel}
          </Button>
        </div>
      ) : (
        /* Normal timer controls */
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

          <Button
            size="lg"
            variant="outline"
            className="h-12 w-12 rounded-full p-0"
            onClick={onNextPhase}
            title="Pular para próxima fase"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          <Button
            size="lg"
            variant="destructive"
            className="h-14 px-8 rounded-full text-base shadow-lg"
            onClick={onFinalize}
            title="Finalizar sessão agora"
          >
            <Flag className="mr-2 h-5 w-5" />
            Finalizar
          </Button>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;
