/**
 * PomodoroTimer — Simplified single 25-minute timer
 *
 * Shows countdown timer with play/pause/reset controls.
 * When timer completes (0:00), displays decision screen:
 *   - "Continuar Estudando" → add +25 min, reset timer
 *   - "Finalizar Sessão" → go to exam modal
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Play, Pause, RotateCcw, ChevronRight, Flag, CheckCircle2,
} from 'lucide-react';

interface PomodoroTimerProps {
  timeLeft: number;
  isActive: boolean;
  progress: number; // 0-100
  totalStudyMinutesToday: number;
  sessionEnded: boolean;
  showBreakReminder: boolean;
  formatTime: (seconds: number) => string;
  onToggle: () => void;
  onReset: () => void;
  onContinueStudying: () => void;
  onSkipBreakReminder: () => void;
  onFinalize: () => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  timeLeft,
  isActive,
  progress,
  totalStudyMinutesToday,
  sessionEnded,
  showBreakReminder,
  formatTime,
  onToggle,
  onReset,
  onContinueStudying,
  onSkipBreakReminder,
  onFinalize,
}) => {
  const isTimerComplete = timeLeft === 0;
  const displayProgress = isTimerComplete ? 100 : progress;

  return (
    <div className="flex flex-col items-center w-full">
      {/* Header: session info */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-primary mb-2">Pomodoro — 25 min</h2>
        <p className="text-sm text-muted-foreground">
          Hoje: <strong>{totalStudyMinutesToday}</strong> min / <strong>240</strong> min
        </p>
      </div>

      {/* Break Reminder (optional, non-blocking) */}
      {showBreakReminder && !sessionEnded && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg max-w-xs text-center">
          <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
            💚 Dica: Descanse 5 minutos!
          </p>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={onSkipBreakReminder}
          >
            Próxima sessão
          </Button>
        </div>
      )}

      {/* Circular progress / timer display */}
      <div className="relative flex items-center justify-center mb-12">
        <svg className="w-56 h-56 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" className="stroke-muted fill-none" strokeWidth="3" />
          <circle
            cx="50"
            cy="50"
            r="46"
            className="fill-none transition-all duration-1000 ease-linear stroke-primary"
            strokeWidth="3"
            strokeDasharray="289.03"
            strokeDashoffset={289.03 - (289.03 * displayProgress) / 100}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute text-center">
          {isTimerComplete ? (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="w-14 h-14 text-green-500" />
              <span className="text-sm font-medium text-muted-foreground">25 min concluído!</span>
            </div>
          ) : (
            <>
              <div className="text-6xl font-bold tabular-nums tracking-tighter">
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
      {isTimerComplete && !sessionEnded ? (
        /* Decision screen after timer completes */
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">
              Total hoje: <strong className="text-base">{totalStudyMinutesToday + 25} min</strong>
            </p>
          </div>

          <Button
            size="lg"
            className="w-full h-12 gap-2 bg-blue-500 hover:bg-blue-600 text-white"
            onClick={onContinueStudying}
          >
            <ChevronRight className="h-4 w-4" />
            Continuar Estudando +25 min
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full h-12 gap-2 border-2"
            onClick={onFinalize}
          >
            <Flag className="h-4 w-4" />
            Finalizar Sessão
          </Button>
        </div>
      ) : (
        /* Normal timer controls */
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Button
            size="lg"
            variant="outline"
            className="h-12 w-12 rounded-full p-0"
            onClick={onReset}
            disabled={timeLeft === 25 * 60 && !isActive}
            title="Resetar timer"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>

          <Button
            size="lg"
            className="h-14 px-10 rounded-full text-base shadow-lg active:scale-95 transition-transform bg-primary hover:bg-primary/90"
            onClick={onToggle}
          >
            {isActive ? (
              <>
                <Pause className="mr-2 h-5 w-5 fill-current" />
                Pausar
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5 fill-current" />
                {timeLeft === 25 * 60 ? 'Iniciar' : 'Continuar'}
              </>
            )}
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
