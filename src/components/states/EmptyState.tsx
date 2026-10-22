import type { ReactNode } from 'react';
import { cx } from '@/lib/ui/cx';

export type EmptyStateTone = 'pendiente' | 'exito' | 'neutral';

const TONE_CLASSES: Record<EmptyStateTone, string> = {
  pendiente: 'border-state-no-budget/40 bg-state-no-budget/10',
  exito: 'border-success/40 bg-success/10',
  neutral: 'border-border bg-muted-background',
};

export interface EmptyStateProps {
  tone: EmptyStateTone;
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Un vacío de éxito no se ve como una carencia (TASK-front.md U13) — los tres tonos
 * pintan distinto a propósito, no son la misma caja con texto diferente.
 */
export function EmptyState({ tone, title, description, action }: EmptyStateProps) {
  return (
    <div className={cx('flex flex-col items-center gap-2 rounded-lg border p-6 text-center', TONE_CLASSES[tone])}>
      <p className="font-medium text-foreground">{title}</p>
      {description ? <p className="text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
