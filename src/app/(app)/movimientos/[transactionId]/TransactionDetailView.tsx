'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Money } from '@/components/money/Money';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/states/ErrorState';
import { Skeleton } from '@/components/states/Skeleton';
import { useDraft } from '@/features/capture/hooks/useDraft';
import { MovementLine } from '@/features/transactions/components/MovementLine';
import { useReverseTransaction } from '@/features/transactions/hooks/useReverseTransaction';
import { useTransaction } from '@/features/transactions/hooks/useTransaction';
import { useUpdateTransactionDescription } from '@/features/transactions/hooks/useUpdateTransactionDescription';
import { ApiError } from '@/lib/api/errors';
import { errorMessageFor } from '@/lib/i18n/errors';

export function TransactionDetailView({ transactionId }: { transactionId: string }) {
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

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold text-foreground">{transaction.description}</h1>
        {isReversed ? <Badge tone="neutral">Corregida</Badge> : null}
        {isReversal ? <Badge tone="neutral">Corrección</Badge> : null}
      </div>

      <div className="flex items-center justify-between text-sm text-muted">
        <span>{transaction.bookedAt}</span>
        <Money cents={transaction.totalCents} />
      </div>

      <ul className="flex flex-col gap-2 rounded-md border border-border p-3">
        {transaction.movements.map((movement, index) => (
          <MovementLine key={`${movement.accountId}-${index}`} movement={movement} />
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
            <div className="flex flex-col gap-2 rounded-md border border-danger/40 bg-danger/5 p-3">
              <p className="text-sm text-foreground">¿Corregir este movimiento? La original queda visible, tachada.</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="danger"
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
                  Sí, corregir
                </Button>
                <Button type="button" variant="secondary" onClick={() => setConfirming(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="danger" onClick={() => setConfirming(true)}>
              Corregir
            </Button>
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
