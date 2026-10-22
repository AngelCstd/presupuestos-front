import type { ReactNode } from 'react';
import { cx } from '@/lib/ui/cx';

export type BadgeTone = 'neutral' | 'success' | 'danger' | 'pending';

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-muted-background text-foreground',
  success: 'bg-success text-success-foreground',
  danger: 'bg-danger text-danger-foreground',
  pending: 'bg-state-no-budget text-foreground',
};

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', TONE_CLASSES[tone])}>
      {children}
    </span>
  );
}
