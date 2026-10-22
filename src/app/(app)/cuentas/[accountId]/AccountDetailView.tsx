'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Balance } from '@/components/money/Balance';
import { Money } from '@/components/money/Money';
import { AmountInput } from '@/components/money/AmountInput';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { Skeleton } from '@/components/states/Skeleton';
import { useAccount } from '@/features/accounts/hooks/useAccount';
import { useAccountLedger } from '@/features/accounts/hooks/useAccountLedger';
import { useArchiveAccount } from '@/features/accounts/hooks/useArchiveAccount';
import { useCaptureOpeningBalance } from '@/features/accounts/hooks/useCaptureOpeningBalance';
import { useUpdateAccount } from '@/features/accounts/hooks/useUpdateAccount';
import { useDraft } from '@/features/capture/hooks/useDraft';
import { ApiError } from '@/lib/api/errors';
import { todayInTimeZone } from '@/lib/domain/dates';
import { errorMessageFor } from '@/lib/i18n/errors';
import { useTimezone } from '@/providers/TimezoneProvider';
import type { CalendarDate } from '@/types/api';

interface OpeningBalanceDraft {
  balanceCents: string;
}

export function AccountDetailView({ accountId }: { accountId: string }) {
  const router = useRouter();
  const timezone = useTimezone();
  const { data: account, isLoading: loadingAccount, error, refetch } = useAccount(accountId);
  const { data: ledger, isLoading: loadingLedger } = useAccountLedger(accountId);

  const updateAccount = useUpdateAccount(accountId);
  const archiveAccount = useArchiveAccount(accountId);
  const captureOpeningBalance = useCaptureOpeningBalance(accountId);

  const [name, setName] = useState('');
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const { draft, update, clear } = useDraft<OpeningBalanceDraft>(`opening-balance:${accountId}`, {
    balanceCents: '0',
  });
  const [openingBalanceCents, setOpeningBalanceCents] = useState('0');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (draft && !hydrated) {
      setOpeningBalanceCents(draft.values.balanceCents);
      setHydrated(true);
    }
  }, [draft, hydrated]);

  if (loadingAccount || loadingLedger || !account || !ledger) {
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

  // La condición incluye el ledger, no solo el monto (TASK-front.md U20): una cuenta
  // nueva sin saldo y una con saldo cero real se ven idénticas por el número.
  const isNewWithoutBalance = account.balanceCents === '0' && ledger.data.length === 0;

  return (
    <div className="flex flex-col gap-6 p-4">
      <Link href="/cuentas" className="text-sm font-medium text-primary underline">
        Volver a cuentas
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">{account.name}</h1>
        {!isNewWithoutBalance ? <Balance cents={account.balanceCents} kind={account.kind} /> : null}
      </div>

      {isNewWithoutBalance ? (
        <EmptyState
          tone="pendiente"
          title="Sin saldo inicial"
          description="¿Cuánto hay en esta cuenta hoy?"
          action={
            !draft ? null : (
              <form
                className="flex flex-col gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  captureOpeningBalance.mutate(
                    {
                      bookedAt: todayInTimeZone(timezone) as CalendarDate,
                      balanceCents: openingBalanceCents,
                      idempotencyKey: draft.idempotencyKey,
                    },
                    { onSuccess: () => clear() },
                  );
                }}
              >
                <AmountInput
                  value={openingBalanceCents}
                  onChange={(cents) => {
                    setOpeningBalanceCents(cents);
                    update({ balanceCents: cents });
                  }}
                />
                <Button type="submit" loading={captureOpeningBalance.isPending} disabled={!hydrated}>
                  Capturar saldo inicial
                </Button>
              </form>
            )
          }
        />
      ) : null}

      <Field label="Nombre">
        <div className="flex gap-2">
          <Input value={name || account.name} onChange={(event) => setName(event.target.value)} />
          <Button
            type="button"
            variant="secondary"
            loading={updateAccount.isPending}
            onClick={() => updateAccount.mutate({ name: name || account.name })}
          >
            Guardar
          </Button>
        </div>
      </Field>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">Movimientos</p>
        {ledger.data.length === 0 ? (
          <p className="text-sm text-muted">Sin movimientos todavía.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {ledger.data.map((entry) => (
              <li
                key={entry.transactionId}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <span className="text-foreground">{entry.description}</span>
                <Money cents={entry.amountCents} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <Button
          type="button"
          variant="danger"
          loading={archiveAccount.isPending}
          onClick={() => {
            setArchiveError(null);
            archiveAccount.mutate(true, {
              onSuccess: () => router.refresh(),
              onError: (mutationError) => {
                setArchiveError(mutationError instanceof ApiError ? mutationError.code : 'INTERNAL_ERROR');
              },
            });
          }}
        >
          Archivar
        </Button>
        {archiveError ? (
          <p role="alert" className="mt-2 text-sm text-danger">
            {errorMessageFor(archiveError)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
