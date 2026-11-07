'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Money } from '@/components/money/Money';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { Skeleton } from '@/components/states/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { BackLink } from '@/components/layout/BackLink';
import { EnvelopeStatusBadge } from '@/features/envelopes/components/EnvelopeStatusBadge';
import { useArchiveCategory } from '@/features/envelopes/hooks/useArchiveCategory';
import { useCategories } from '@/features/envelopes/hooks/useCategories';
import { useCategoryLedger } from '@/features/envelopes/hooks/useCategoryLedger';
import { useUpdateCategory } from '@/features/envelopes/hooks/useUpdateCategory';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import { ApiError } from '@/lib/api/errors';
import { formatCalendarDate } from '@/lib/domain/dates';
import { cx } from '@/lib/ui/cx';
import { es } from '@/lib/i18n/es';
import type { RolloverType } from '@/types/api';

export function CategoryDetailView({ categoryId, periodId }: { categoryId: string; periodId: string | null }) {
  const { data: categories, isLoading: loadingCategories } = useCategories(periodId);
  const { data: ledger, isLoading: loadingLedger } = useCategoryLedger(categoryId);
  const { data: txPage } = useTransactions({ categoryId });

  const updateCategory = useUpdateCategory(categoryId);
  const archiveCategory = useArchiveCategory(categoryId);

  const transactionsById = new Map((txPage?.pages.flatMap((p) => p.data) ?? []).map((t) => [t.id, t]));
  const category = categories?.data.find((c) => c.id === categoryId) ?? null;
  const [name, setName] = useState(category?.name ?? '');
  const [archiveError, setArchiveError] = useState<string | null>(null);

  if (loadingCategories || loadingLedger || !categories || !ledger) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!category) {
    return <ErrorState code="CATEGORY_NOT_FOUND" />;
  }

  const hasBudget = category.period?.hasBudget ?? false;
  const ledgerEmpty = ledger.data.length === 0;

  return (
    <div className="flex flex-col gap-6 p-4">
      <BackLink href="/sobres" label={es.nav.sobres} />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">{category.name}</h1>
        {category.period && category.period.status !== 'available' ? (
          <EnvelopeStatusBadge status={category.period.status} />
        ) : null}
      </div>

      {category.period && category.period.status !== 'no_budget' ? (
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="text-muted">{es.field.assignedCents}</dt>
            <dd>
              <Money cents={category.period.assignedCents} />
            </dd>
          </div>
          <div>
            <dt className="text-muted">{es.field.spentInPeriod}</dt>
            <dd>
              <Money cents={category.period.spentCents} />
            </dd>
          </div>
          <div>
            <dt className="text-muted">{es.field.availableCents}</dt>
            <dd>
              <Money cents={category.period.availableCents} />
            </dd>
          </div>
        </dl>
      ) : null}

      <p className="text-sm text-muted">
        {es.field.totalLifetimeSpent}: <Money cents={category.balanceCents} />
      </p>

      <Field label="Nombre">
        <div className="flex gap-2">
          <Input value={name} onChange={(event) => setName(event.target.value)} />
          <Button
            type="button"
            variant="secondary"
            loading={updateCategory.isPending}
            onClick={() => updateCategory.mutate({ name })}
          >
            Guardar
          </Button>
        </div>
      </Field>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">Sobrante al cerrar</p>
        <div className="flex gap-2">
          {(['reset', 'accumulate'] as RolloverType[]).map((rolloverType) => (
            <Button
              key={rolloverType}
              type="button"
              variant={category.rolloverType === rolloverType ? 'primary' : 'secondary'}
              size="sm"
              loading={updateCategory.isPending}
              onClick={() => updateCategory.mutate({ rolloverType })}
            >
              {es.rollover[rolloverType]}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted leading-relaxed">
          {category.rolloverType ? es.rolloverDesc[category.rolloverType] : null}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">Movimientos</p>
        {ledgerEmpty ? (
          hasBudget ? (
            <EmptyState tone="exito" title="Nada gastado en este sobre" />
          ) : (
            <EmptyState
              tone="neutral"
              title="Este sobre no se ha usado"
              action={
                <Link href="/sobres" className="text-sm font-medium text-primary underline">
                  Asignar dinero
                </Link>
              }
            />
          )
        ) : (
          <ul className="flex flex-col gap-2">
            {ledger.data.map((entry) => {
              const tx = transactionsById.get(entry.transactionId);
              const isReversed = tx ? tx.reversedByTransactionId !== null : false;
              const isReversal = tx ? tx.reversesTransactionId !== null : false;
              const amount = BigInt(entry.amountCents);
              const isInflow = amount < 0n;
              const displayCents = (-amount).toString();

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
                      <Money cents={displayCents} />
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
          loading={archiveCategory.isPending}
          onClick={() => {
            setArchiveError(null);
            archiveCategory.mutate(true, {
              onError: (error) => {
                setArchiveError(error instanceof ApiError ? error.code : 'INTERNAL_ERROR');
              },
            });
          }}
        >
          {es.envelopesView.archiveAction}
        </Button>
        {archiveError ? <ErrorState code={archiveError} /> : null}
      </div>
    </div>
  );
}
