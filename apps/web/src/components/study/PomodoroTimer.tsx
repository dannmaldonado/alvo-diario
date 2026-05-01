/**
 * PomodoroTimer — Supports Pomodoro (25-min countdown) and Tempo Livre (stopwatch)
 *
 * Pomodoro: countdown from 25 min; at 0 shows "continue / finish" decision screen.
 * Tempo Livre: counts up from 0; "Finalizar" button always visible.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Play, Pause, RotateCcw, ChevronRight, Flag, CheckCircle2,
} from 'lucide-react';
import type { TimerMode } from '@/hooks/useStudySession';

interface PomodoroTimerProps {
  timerMode: TimerMode;
  timeLeft: number;
  isActive: boolean;
  progress: number; // 0-100 (only used in pomodoro mode)
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
  timerMode,
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
  const isPomodoro = timerMode === 'pomodoro';
  const isTimerComplete = isPomodoro && timeLeft === 0;
  const displayProgress = isTimerComplete ? 100 : progress;

  return (
    <div className="flex flex-col items-center w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-primary mb-2">
          {isPomodoro ? 'Pomodoro — 25 min' : 'Tempo Livre'}
        </h2>
        <p className="text-sm text-muted-foreground">
          Hoje: <strong>{totalStudyMinutesToday}</strong> min / <strong>240</strong> min
        </p>
      </div>

      {/* Break Reminder (pomodoro only, non-blocking) */}
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

      {/* Timer display */}
      <div className="relative flex items-center justify-center mb-12">
        {isPomodoro ? (
          /* Circular progress ring — only in pomodoro mode */
          <>
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
          </>
        ) : (
          /* Libre mode: simple large stopwatch display, no ring */
          <div className="text-center py-6">
            <div className="text-7xl font-bold tabular-nums tracking-tighter text-primary">
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-muted-foreground mt-3">
              {isActive ? 'Cronômetro rodando…' : timeLeft === 0 ? 'Pressione Iniciar' : 'Pausado'}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {isTimerComplete && !sessionEnded && isPomodoro ? (
        /* Pomodoro decision screen after countdown reaches 0 */
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
        /* Normal controls — same for both modes; in Livre, Finalizar always visible */
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Button
            size="lg"
            variant="outline"
            className="h-12 w-12 rounded-full p-0"
            onClick={onReset}
            disabled={isPomodoro
              ? (timeLeft === 25 * 60 && !isActive)
              : (timeLeft === 0 && !isActive)}
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
                {(isPomodoro ? timeLeft === 25 * 60 : timeLeft === 0) ? 'Iniciar' : 'Continuar'}
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
