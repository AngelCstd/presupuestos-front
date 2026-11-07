'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Money } from '@/components/money/Money';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { BackLink } from '@/components/layout/BackLink';
import { ErrorState } from '@/components/states/ErrorState';
import { Skeleton } from '@/components/states/Skeleton';
import { useDraft } from '@/features/capture/hooks/useDraft';
import { MovementLine } from '@/features/transactions/components/MovementLine';
import {
  getTransactionDirection,
  isOpeningBalanceTransaction,
} from '@/features/transactions/components/TransactionRow';
import { useReverseTransaction } from '@/features/transactions/hooks/useReverseTransaction';
import { useTransaction } from '@/features/transactions/hooks/useTransaction';
import { useUpdateTransactionDescription } from '@/features/transactions/hooks/useUpdateTransactionDescription';
import { ApiError } from '@/lib/api/errors';
import { errorMessageFor } from '@/lib/i18n/errors';
import { formatCalendarDate, formatInstant } from '@/lib/domain/dates';
import { cx } from '@/lib/ui/cx';
import { es } from '@/lib/i18n/es';
import { useTimezone } from '@/providers/TimezoneProvider';

export function TransactionDetailView({ transactionId }: { transactionId: string }) {
  const timezone = useTimezone();
  const { data: transaction, isLoading, error, refetch } = useTransaction(transactionId);
  const updateDescription = useUpdateTransactionDescription(transactionId);
  const reverseTransaction = useReverseTransaction(transactionId);
  // Una llave estable a través de reintentos, igual que cualquier otro formulario
  // (TASK-front.md U12) — aunque no haya campos que llenar, sigue siendo una
  // intención del usuario que puede fallar por red y hay que reintentar con la misma.
  const { draft: reversalDraft, clear: clearReversalDraft } = useDraft<Record<string, never>>(
    `reversal:${transactionId}`,
    {},
  );

  const [description, setDescription] = useState('');
  const [reversalError, setReversalError] = useState<string | null>(null);
  const [reversed, setReversed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (isLoading || !transaction) {
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

  const isReversed = transaction.reversedByTransactionId !== null;
  const isReversal = transaction.reversesTransactionId !== null;
  const isOpening = isOpeningBalanceTransaction(transaction);
  const direction = getTransactionDirection(transaction);
  const isOutflow = !isOpening && direction === 'outflow';
  const isInflow = !isOpening && direction === 'inflow';

  const cleanCents = transaction.totalCents.replace('-', '');
  const centsToFormat = isOutflow ? `-${cleanCents}` : cleanCents;

  return (
    <div className="flex flex-col gap-6 p-4">
      <BackLink href="/movimientos" label={es.nav.movimientos} />

      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold text-foreground">{transaction.description}</h1>
        {isReversed ? (
          transaction.reversedByTransactionId ? (
            <Link
              href={`/movimientos/${transaction.reversedByTransactionId}`}
              className="inline-flex items-center active:scale-95 transition-transform"
            >
              <Badge tone="neutral">Corregida ↗</Badge>
            </Link>
          ) : (
            <Badge tone="neutral">Corregida</Badge>
          )
        ) : null}
        {isReversal ? (
          transaction.reversesTransactionId ? (
            <Link
              href={`/movimientos/${transaction.reversesTransactionId}`}
              className="inline-flex items-center active:scale-95 transition-transform"
            >
              <Badge tone="neutral">Corrección ↗</Badge>
            </Link>
          ) : (
            <Badge tone="neutral">Corrección</Badge>
          )
        ) : null}
      </div>

      {isReversed && transaction.reversedByTransactionId ? (
        <div className="rounded-xl border border-border/80 bg-muted-background/40 p-3 text-xs flex items-center justify-between gap-2">
          <span className="text-muted">Este movimiento fue anulado por una corrección posterior.</span>
          <Link
            href={`/movimientos/${transaction.reversedByTransactionId}`}
            className="text-xs font-semibold text-primary underline active:scale-95 shrink-0"
          >
            Ver corrección ↗
          </Link>
        </div>
      ) : null}

      {isReversal && transaction.reversesTransactionId ? (
        <div className="rounded-xl border border-border/80 bg-muted-background/40 p-3 text-xs flex items-center justify-between gap-2">
          <span className="text-muted">Este movimiento anula el movimiento original que corrigió.</span>
          <Link
            href={`/movimientos/${transaction.reversesTransactionId}`}
            className="text-xs font-semibold text-primary underline active:scale-95 shrink-0"
          >
            Ver original ↗
          </Link>
        </div>
      ) : null}

      <div className="flex items-start justify-between text-sm">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-foreground">{formatCalendarDate(transaction.bookedAt)}</span>
          {transaction.createdAt ? (
            <span className="text-2xs text-muted">
              Registrado: {formatInstant(transaction.createdAt, timezone)}
            </span>
          ) : null}
        </div>
        <span
          className={cx(
            'text-lg font-bold inline-flex items-center',
            isInflow ? 'text-primary' : 'text-foreground',
          )}
        >
          {isInflow ? '+' : ''}
          <Money cents={centsToFormat} />
        </span>
      </div>

      <ul className="flex flex-col gap-2 rounded-xl border border-border/80 bg-background p-3.5 shadow-sm">
        {transaction.movements
          .filter((m) => m.accountKind !== 'system')
          .map((movement, index) => (
            <MovementLine
              key={`${movement.accountId}-${index}`}
              movement={movement}
              isOpening={isOpening}
            />
          ))}
      </ul>

      <Field label="Descripción">
        <div className="flex gap-2">
          <Input
            value={description || transaction.description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            loading={updateDescription.isPending}
            onClick={() => updateDescription.mutate(description || transaction.description)}
          >
            Guardar
          </Button>
        </div>
      </Field>

      {!isReversed && !isReversal && !reversed ? (
        <div className="flex flex-col gap-2">
          {confirming ? (
            <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-muted-background/40 p-3.5">
              <p className="text-xs text-foreground">¿Corregir este movimiento? La versión original quedará visible, tachada en el historial.</p>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="secondary" size="sm" onClick={() => setConfirming(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={reverseTransaction.isPending}
                  onClick={() => {
                    if (!reversalDraft) return;
                    setReversalError(null);
                    reverseTransaction.mutate(
                      { idempotencyKey: reversalDraft.idempotencyKey },
                      {
                        onSuccess: () => {
                          clearReversalDraft();
                          setReversed(true);
                          setConfirming(false);
                        },
                        onError: (mutationError) => {
                          setReversalError(
                            mutationError instanceof ApiError ? mutationError.code : 'INTERNAL_ERROR',
                          );
                        },
                      },
                    );
                  }}
                >
                  Confirmar corrección
                </Button>
              </div>
            </div>
          ) : (
            <div className="pt-1">
              <Button type="button" variant="secondary" size="sm" onClick={() => setConfirming(true)}>
                Corregir movimiento
              </Button>
            </div>
          )}
          {reversalError ? (
            <p role="alert" className="text-sm text-danger">
              {errorMessageFor(reversalError)}
            </p>
          ) : null}
        </div>
      ) : null}

      {reversed ? (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-muted-background p-3">
          <p className="text-sm text-foreground">Corregido. Ambos movimientos quedan visibles en el historial.</p>
          <Link href="/capturar/gasto" className="text-sm font-medium text-primary underline">
            Capturar la versión correcta
          </Link>
        </div>
      ) : null}
    </div>
  );
}
