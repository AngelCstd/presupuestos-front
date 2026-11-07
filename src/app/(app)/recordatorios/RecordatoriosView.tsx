'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Money } from '@/components/money/Money';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { Skeleton } from '@/components/states/Skeleton';
import { ConfirmRecurringForm } from '@/features/recurring/components/ConfirmRecurringForm';
import { useRecurringTemplates } from '@/features/recurring/hooks/useRecurringTemplates';
import { ApiError } from '@/lib/api/errors';
import { formatCalendarDate } from '@/lib/domain/dates';
import { es } from '@/lib/i18n/es';
import type { RecurringTemplate } from '@/types/api';

function TemplateRow({ template }: { template: RecurringTemplate }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-background p-3.5 transition-colors hover:border-border hover:bg-muted-background/30 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">{template.name}</span>
            {template.isDue ? <Badge tone="pending">{es.recordatoriosView.dueBadge}</Badge> : null}
          </div>
          <span className="text-xs text-muted truncate">
            {template.categoryName}{template.accountName ? ` · ${template.accountName}` : ''}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span className="text-sm font-bold text-foreground">
            <Money cents={template.amountCents} />
          </span>
          <span className="text-2xs font-medium text-muted">
            {formatCalendarDate(template.nextDueOn)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1.5 border-t border-border/30">
        <span className="text-2xs text-muted">
          {template.isDue ? es.recordatoriosView.readyToConfirm : es.recordatoriosView.scheduled}
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setConfirming(true)}
          className="text-xs shrink-0 py-1 px-3"
        >
          {es.recordatoriosView.confirmAction}
        </Button>
      </div>

      <ConfirmRecurringForm template={template} open={confirming} onClose={() => setConfirming(false)} />
    </div>
  );
}

export function RecordatoriosView() {
  const { data, isLoading, error, refetch } = useRecurringTemplates();

  if (isLoading || !data) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-5 p-4 pb-36 min-w-0">
        <header className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-2xl font-bold text-foreground">{es.recordatoriosView.title}</h1>
            <p className="text-xs text-muted">{es.recordatoriosView.subtitle}</p>
          </div>
        </header>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorState code={error instanceof ApiError ? error.code : 'INTERNAL_ERROR'} onRetry={() => refetch()} />
      </div>
    );
  }

  if (data.data.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-5 p-4 pb-36 min-w-0">
        <header className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-2xl font-bold text-foreground">{es.recordatoriosView.title}</h1>
            <p className="text-xs text-muted">{es.recordatoriosView.subtitle}</p>
          </div>
        </header>
        <div id="last-element">
          <EmptyState
            tone="pendiente"
            title={es.recordatoriosView.emptyTitle}
            description={es.recordatoriosView.emptyDescription}
            action={
              <Link href="/recordatorios/nuevo">
                <Button type="button">{es.recordatoriosView.emptyAction}</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const templates = [...data.data].sort(
    (a, b) =>
      Number(b.isDue) - Number(a.isDue) ||
      a.nextDueOn.localeCompare(b.nextDueOn) ||
      a.name.localeCompare(b.name, 'es'),
  );
  const anyDue = templates.some((template) => template.isDue);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 p-4 pb-36 min-w-0">
      <header className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-foreground">{es.recordatoriosView.title}</h1>
          <p className="text-xs text-muted">{es.recordatoriosView.subtitle}</p>
        </div>
        <Link href="/recordatorios/nuevo" className="shrink-0">
          <Button type="button" variant="secondary" size="sm" className="text-xs whitespace-nowrap shrink-0">
            {es.recordatoriosView.newReminderButton}
          </Button>
        </Link>
      </header>

      {anyDue ? null : (
        <div className="rounded-xl border border-border/80 bg-muted-background/40 p-3.5 text-center shadow-sm">
          <p className="text-sm font-medium text-foreground">{es.recordatoriosView.allConfirmedTitle}</p>
          <p className="text-xs text-muted mt-0.5">{es.recordatoriosView.allConfirmedSubtitle}</p>
        </div>
      )}

      <div className="flex flex-col gap-2.5" id="last-element">
        {templates.map((template) => (
          <TemplateRow key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}
