'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { Skeleton } from '@/components/states/Skeleton';
import { CreatePeriodForm } from '@/features/periods/components/CreatePeriodForm';
import { useDeletePeriod } from '@/features/periods/hooks/useDeletePeriod';
import { usePeriods } from '@/features/periods/hooks/usePeriods';
import { bffFetch } from '@/lib/api/browser-client';
import { ApiError } from '@/lib/api/errors';
import { buildQueryString } from '@/lib/api/query-string';
import { todayInTimeZone } from '@/lib/domain/dates';
import { selectClosablePeriod } from '@/lib/domain/periods';
import { errorMessageFor } from '@/lib/i18n/errors';
import { es } from '@/lib/i18n/es';
import { useTimezone } from '@/providers/TimezoneProvider';
import type { CursorPage, Period, Transaction } from '@/types/api';

async function periodHasTransactions(period: Period): Promise<boolean> {
  const page = await bffFetch<CursorPage<Transaction>>({
    path: `/transactions${buildQueryString({ from: period.startsOn, to: period.endsOn, limit: 1 })}`,
  });
  return page.data.length > 0;
}

function PeriodRow({ period, canOfferClose }: { period: Period; canOfferClose: boolean }) {
  const deletePeriod = useDeletePeriod();
  const [confirm, setConfirm] = useState<{ hasTransactions: boolean } | null>(null);
  const [checkingTransactions, setCheckingTransactions] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <div className="flex items-center justify-between rounded-md border border-border p-3">
      <Link
        href={`/movimientos?from=${period.startsOn}&to=${period.endsOn}`}
        className="flex items-center justify-between gap-3 min-w-0 flex-1 active:scale-95 transition-transform pr-2"
      >
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-foreground font-medium truncate">
            {period.startsOn} – {period.endsOn}
          </span>
          <div>
            <Badge tone={period.status === 'open' ? 'neutral' : 'success'}>{es.periodStatus[period.status]}</Badge>
          </div>
          {deleteError ? (
            <p role="alert" className="text-sm text-danger">
              {errorMessageFor(deleteError)}
            </p>
          ) : null}
        </div>
        <span aria-hidden="true" className="text-muted shrink-0">
          ›
        </span>
      </Link>
      <div className="flex items-center gap-2">
        {canOfferClose ? (
          <Link href={`/periodos/${period.id}/cerrar`}>
            <Button type="button" size="sm">
              Cerrar
            </Button>
          </Link>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          loading={checkingTransactions}
          onClick={async () => {
            setDeleteError(null);
            setCheckingTransactions(true);
            const hasTransactions = await periodHasTransactions(period);
            setCheckingTransactions(false);
            setConfirm({ hasTransactions });
          }}
        >
          Borrar
        </Button>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title="Borrar periodo"
        message={
          confirm?.hasTransactions
            ? 'Este periodo tiene movimientos capturados. Si la borras, esos movimientos van a aparecer como sin periodo.'
            : '¿Borrar este periodo?'
        }
        confirmLabel="Borrar"
        danger
        loading={deletePeriod.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          deletePeriod.mutate(period.id, {
            onSuccess: () => setConfirm(null),
            onError: (error) => {
              setDeleteError(error instanceof ApiError ? error.code : 'INTERNAL_ERROR');
              setConfirm(null);
            },
          });
        }}
      />
    </div>
  );
}

export function PeriodsView() {
  const timezone = useTimezone();
  const { data, isLoading, error, refetch } = usePeriods();
  const [creating, setCreating] = useState(false);

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
          title="Aún no creas ningún periodo"
          description="Un periodo es el rango donde vive tu presupuesto. Puedes usar 1–15 y 16–fin, o el rango que te acomode."
          action={
            <Button type="button" onClick={() => setCreating(true)}>
              Crear el primero
            </Button>
          }
        />
        <CreatePeriodForm open={creating} onClose={() => setCreating(false)} />
      </div>
    );
  }

  const today = todayInTimeZone(timezone);
  const closable = selectClosablePeriod(data.data, today);
  const overdue = data.data
    .filter((period) => period.status === 'open' && period.endsOn < today)
    .sort((a, b) => (a.endsOn < b.endsOn ? -1 : a.endsOn > b.endsOn ? 1 : 0));
  const overdueIds = new Set(overdue.map((period) => period.id));
  const rest = data.data
    .filter((period) => !overdueIds.has(period.id))
    .sort((a, b) => (a.startsOn < b.startsOn ? 1 : a.startsOn > b.startsOn ? -1 : 0));

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-2">
        {overdue.length === 0 ? (
          <EmptyState tone="exito" title="Todo al día" description="No tienes periodos vencidos sin cerrar." />
        ) : (
          overdue.map((period) => (
            <PeriodRow key={period.id} period={period} canOfferClose={period.id === closable?.id} />
          ))
        )}
      </div>

      <Button type="button" variant="secondary" onClick={() => setCreating(true)}>
        Nuevo periodo
      </Button>

      {rest.length > 0 ? (
        <div className="flex flex-col gap-2">
          {rest.map((period) => (
            <PeriodRow key={period.id} period={period} canOfferClose={false} />
          ))}
        </div>
      ) : null}

      <CreatePeriodForm open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
