'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Balance } from '@/components/money/Balance';
import { Money } from '@/components/money/Money';
import { AmountInput } from '@/components/money/AmountInput';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BackLink } from '@/components/layout/BackLink';
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
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import { useDraft } from '@/features/capture/hooks/useDraft';
import { ApiError } from '@/lib/api/errors';
import { todayInTimeZone, formatCalendarDate } from '@/lib/domain/dates';
import { cx } from '@/lib/ui/cx';
import { errorMessageFor } from '@/lib/i18n/errors';
import { es } from '@/lib/i18n/es';
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
  const { data: txPage } = useTransactions({ accountId });

  const updateAccount = useUpdateAccount(accountId);
  const archiveAccount = useArchiveAccount(accountId);
  const captureOpeningBalance = useCaptureOpeningBalance(accountId);

  const transactionsById = new Map((txPage?.pages.flatMap((p) => p.data) ?? []).map((t) => [t.id, t]));
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
      <BackLink href="/cuentas" label={es.nav.cuentas} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{account.name}</h1>
          <p className="text-xs text-muted font-medium">
            {es.accountsView.accountKindDetail[account.kind as 'cash' | 'credit' | 'receivable'] ?? es.kind[account.kind]}
          </p>
        </div>
        {!isNewWithoutBalance ? (
          <Balance
            cents={account.balanceCents}
            kind={account.kind}
            className={account.kind === 'cash' && BigInt(account.balanceCents) < 0n ? 'text-state-overspent font-bold' : ''}
          />
        ) : null}
      </div>

      {account.kind === 'cash' && BigInt(account.balanceCents) < 0n ? (
        <div className="rounded-xl border border-state-overspent/30 bg-state-overspent/10 p-3.5 text-xs text-state-overspent">
          <p className="font-semibold">{es.accountsView.negativeCashBadge}</p>
          <p className="mt-0.5 text-foreground/80 leading-relaxed">{es.accountsView.negativeCashAlert}</p>
        </div>
      ) : null}

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
            {ledger.data.map((entry) => {
              const tx = transactionsById.get(entry.transactionId);
              const isReversed = tx ? tx.reversedByTransactionId !== null : false;
              const isReversal = tx ? tx.reversesTransactionId !== null : false;
              const amount = BigInt(entry.amountCents);
              const isInflow = amount > 0n;

              return (
                <li
                  key={entry.transactionId}
                  className={cx(
                    'relative flex items-center justify-between rounded-xl border border-border/80 bg-background p-3.5 transition-transform active:scale-[0.99] hover:border-border',
                    isReversed && 'line-through opacity-60',
                  )}
                >
                  <Link
                    href={`/movimientos/${entry.transactionId}`}
                    className="absolute inset-0 z-0 rounded-xl"
                    aria-label={entry.description}
                  />
                  <div className="relative z-10 pointer-events-none flex flex-col gap-1 min-w-0 flex-1">
                    <span className="text-sm font-medium text-foreground leading-snug break-words line-clamp-2">
                      {entry.description}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted">
                      <span>{formatCalendarDate(entry.bookedAt)}</span>
                      {isReversed ? (
                        <Badge tone="neutral">{es.transactionsHistory.correctedBadge}</Badge>
                      ) : null}
                      {isReversal ? (
                        <Badge tone="neutral">{es.transactionsHistory.correctionBadge}</Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="relative z-10 pointer-events-none flex items-center shrink-0">
                    <span
                      className={cx(
                        'text-sm font-semibold inline-flex items-center',
                        isInflow ? 'text-primary' : 'text-foreground',
                      )}
                    >
                      {isInflow ? '+' : ''}
                      <Money cents={entry.amountCents} />
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="pt-2 border-t border-border/40 flex flex-col gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="self-start text-danger border-border hover:bg-danger/10"
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
          {es.accountsView.archiveAction}
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
