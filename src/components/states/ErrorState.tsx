import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { errorMessageFor } from '@/lib/i18n/errors';

export interface ErrorStateProps {
  /**
   * Solo el `code` — nunca el `message` del servidor (API-CONTRACT.md §7.1,
   * TASK-front.md U6). No hay una prop `message` a propósito: aceptarla invitaría a
   * pintar texto del servidor sin pasar por `errorMessageFor`.
   */
  code: string;
  onRetry?: () => void;
  retryLabel?: string;
  action?: ReactNode;
}

export function ErrorState({ code, onRetry, retryLabel = 'Reintentar', action }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-danger/40 bg-danger/5 p-6 text-center">
      <p className="text-foreground">{errorMessageFor(code)}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
      {action}
    </div>
  );
}
