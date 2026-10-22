'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ErrorState } from '@/components/states/ErrorState';
import { Skeleton } from '@/components/states/Skeleton';
import { Money } from '@/components/money/Money';
import { CreatePeriodForm } from '@/features/periods/components/CreatePeriodForm';
import { useClosePeriod } from '@/features/periods/hooks/useClosePeriod';
import { useClosePreview } from '@/features/periods/hooks/useClosePreview';
import { useAllocations } from '@/features/envelopes/hooks/useAllocations';
import { useDeleteAllocation } from '@/features/envelopes/hooks/useDeleteAllocation';
import { ApiError } from '@/lib/api/errors';
import { extractTransactionIdFromNote, isLateCaptureNote } from '@/lib/domain/late-capture';
import { errorMessageFor } from '@/lib/i18n/errors';
import { es } from '@/lib/i18n/es';
import { qk } from '@/lib/query-keys';
import type { Allocation } from '@/types/api';

export function ClosePeriodView({ periodId }: { periodId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: preview, isLoading: loadingPreview, error, refetch } = useClosePreview(periodId);
  const { data: allocations, isLoading: loadingAllocations } = useAllocations(periodId);
  const closePeriod = useClosePeriod(periodId);
  const deleteAllocation = useDeleteAllocation(periodId);

  const [closeError, setCloseError] = useState<string | null>(null);
  const [creatingNext, setCreatingNext] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Allocation | null>(null);

  if (loadingPreview || loadingAllocations || !preview || !allocations) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-32 w-full" />
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

  const needsNextPeriod = preview.blockers.includes('NEXT_PERIOD_REQUIRED');
  const pendingIsLateCapture = pendingDelete !== null && isLateCaptureNote(pendingDelete.note);
  const pendingOriginTransactionId = pendingDelete ? extractTransactionIdFromNote(pendingDelete.note) : null;

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-xl font-semibold text-foreground">
        {preview.startsOn} – {preview.endsOn}
      </h1>

      <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm font-medium text-danger">
        Al cerrar, las asignaciones de este periodo quedan congeladas para siempre. Es el último momento para
        editarlas.
      </p>

      <ul className="flex flex-col gap-2">
        {preview.categories.map((category) => (
          <li
            key={category.categoryId}
            className="flex items-center justify-between rounded-md border border-border p-3"
          >
            <span className="text-foreground">{category.categoryName}</span>
            <span className="text-sm text-muted">
              {es.closeAction[category.action].before}
              {category.action !== 'none' ? <Money cents={category.carryCents} /> : null}
              {es.closeAction[category.action].after}
            </span>
          </li>
        ))}
      </ul>

      {!preview.canClose ? (
        <div className="flex flex-col gap-2 rounded-md border border-state-no-budget/40 bg-state-no-budget/10 p-3">
          {preview.blockers.map((code) => (
            <p key={code} className="text-sm text-foreground">
              {errorMessageFor(code)}
            </p>
          ))}
          {needsNextPeriod ? (
            <Button type="button" variant="secondary" size="sm" onClick={() => setCreatingNext(true)}>
              Crear el siguiente periodo
            </Button>
          ) : null}
        </div>
      ) : null}

      <div>
        <Button
          type="button"
          disabled={!preview.canClose}
          loading={closePeriod.isPending}
          onClick={() => {
            setCloseError(null);
            closePeriod.mutate(undefined, {
              onSuccess: () => router.push('/periodos'),
              onError: (mutationError) => {
                setCloseError(mutationError instanceof ApiError ? mutationError.code : 'INTERNAL_ERROR');
              },
            });
          }}
        >
          Cerrar periodo
        </Button>
        {closeError ? (
          <p role="alert" className="mt-2 text-sm text-danger">
            {errorMessageFor(closeError)}
          </p>
        ) : null}
      </div>

      <CreatePeriodForm
        open={creatingNext}
        onClose={() => setCreatingNext(false)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: qk.closePreview(periodId) });
        }}
      />

      {allocations.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Asignaciones</p>
          {allocations.map((allocation) => (
            <div
              key={allocation.id}
              className="flex items-center justify-between rounded-md border border-border p-3"
            >
              <span className="text-foreground">{allocation.categoryName}</span>
              <div className="flex items-center gap-2">
                <Money cents={allocation.amountCents} />
                <Button type="button" size="sm" variant="ghost" onClick={() => setPendingDelete(allocation)}>
                  Borrar
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Borrar asignación"
        message={
          pendingIsLateCapture ? (
            <span className="flex flex-col gap-2">
              <span>
                Este ajuste cubre un gasto de un periodo ya cerrado. Si lo borras, ese gasto queda sin cubrir.
              </span>
              {pendingOriginTransactionId ? (
                <Link
                  href={`/movimientos/${pendingOriginTransactionId}`}
                  className="text-sm font-medium text-primary underline"
                >
                  Ver el movimiento de origen
                </Link>
              ) : null}
            </span>
          ) : (
            '¿Borrar esta asignación?'
          )
        }
        confirmLabel="Borrar"
        danger
        loading={deleteAllocation.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteAllocation.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) });
        }}
      />
    </div>
  );
}
