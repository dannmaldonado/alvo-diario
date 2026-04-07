/**
 * TodaySessionsList — displays sessions saved for the current day.
 * Compact list below the timer: subject, duration, time saved.
 */

import React from 'react';
import { Card } from '@/components/Card';
import { BookOpen, Clock, FileText } from 'lucide-react';
import { Sessao } from '@/types';

interface TodaySessionsListProps {
  sessions: Sessao[];
  isLoading: boolean;
}

const TodaySessionsList: React.FC<TodaySessionsListProps> = ({ sessions, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="mt-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          Sessoes de Hoje
        </h3>
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </Card>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card className="mt-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          Sessoes de Hoje
        </h3>
        <p className="text-sm text-muted-foreground">
          Nenhuma sessao registrada hoje. Comece sua primeira sessao de estudo!
        </p>
      </Card>
    );
  }

  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duracao_minutos || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;

  return (
    <Card className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          Sessoes de Hoje ({sessions.length})
        </h3>
        <span className="text-xs text-muted-foreground font-medium">
          Total: {totalHours > 0 ? `${totalHours}h` : ''}{remainingMins > 0 ? `${remainingMins}min` : totalHours > 0 ? '' : '0min'}
        </span>
      </div>

      <div className="space-y-2">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between p-3 rounded-xl bg-muted/50 gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session.materia}</p>
              {session.notas && (
                <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                  <FileText className="w-3 h-3 shrink-0" />
                  {session.notas}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-medium">
                {session.duracao_minutos >= 60
                  ? `${Math.floor(session.duracao_minutos / 60)}h${session.duracao_minutos % 60 > 0 ? `${session.duracao_minutos % 60}min` : ''}`
                  : `${session.duracao_minutos}min`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default TodaySessionsList;
