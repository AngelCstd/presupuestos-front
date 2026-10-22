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
import type { RecurringTemplate } from '@/types/api';

function TemplateRow({ template }: { template: RecurringTemplate }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center justify-between rounded-md border border-border p-3">
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-2 text-foreground">
          {template.name}
          {template.isDue ? <Badge tone="pending">Pendiente</Badge> : null}
        </span>
        <span className="text-sm text-muted">
          {template.categoryName}
          {template.accountName ? ` · ${template.accountName}` : ''} · {template.nextDueOn}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Money cents={template.amountCents} />
        <Button type="button" size="sm" onClick={() => setConfirming(true)}>
          Confirmar
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
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
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
      <div className="flex flex-col gap-4 p-4">
        <EmptyState
          tone="pendiente"
          title="No tienes recordatorios"
          description="Sirven para lo que pagas cada mes: renta, wifi, suscripciones."
          action={
            <Link href="/recordatorios/nuevo">
              <Button type="button">Crear recordatorio</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const templates = [...data.data].sort((a, b) => Number(b.isDue) - Number(a.isDue));
  const anyDue = templates.some((template) => template.isDue);

  return (
    <div className="flex flex-col gap-6 p-4">
      {anyDue ? null : <EmptyState tone="exito" title="Nada por confirmar" />}

      <div className="flex flex-col gap-2">
        {templates.map((template) => (
          <TemplateRow key={template.id} template={template} />
        ))}
      </div>

      <Link href="/recordatorios/nuevo">
        <Button type="button" variant="secondary">
          Nuevo recordatorio
        </Button>
      </Link>
    </div>
  );
}
