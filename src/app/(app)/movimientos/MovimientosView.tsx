'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Banner } from '@/components/layout/Banner';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { Skeleton } from '@/components/states/Skeleton';
import { TransactionRow } from '@/features/transactions/components/TransactionRow';
import { useTransactions, type TransactionFilters } from '@/features/transactions/hooks/useTransactions';
import { useUnbudgetedTransactions } from '@/features/dashboard/hooks/useUnbudgetedTransactions';
import { ApiError } from '@/lib/api/errors';

export function MovimientosView() {
  const [filters, setFilters] = useState<TransactionFilters>({});
  const hasFilters = Object.values(filters).some((value) => value !== undefined && value !== '');

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useTransactions(filters);
  const { data: unbudgeted } = useUnbudgetedTransactions();

  const transactions = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="flex flex-col gap-4">
      {unbudgeted && unbudgeted.transactions.length > 0 ? (
        <Banner message={`${unbudgeted.transactions.length} movimientos no caen en ningún periodo.`} />
      ) : null}

      <div className="flex flex-wrap gap-2 p-4 pb-0">
        <input
          type="date"
          className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
          value={filters.from ?? ''}
          onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value || undefined }))}
        />
        <input
          type="date"
          className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
          value={filters.to ?? ''}
          onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value || undefined }))}
        />
        {hasFilters ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => setFilters({})}>
            Quitar filtros
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 p-4 pt-0">
        {isLoading ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : error ? (
          <ErrorState code={error instanceof ApiError ? error.code : 'INTERNAL_ERROR'} onRetry={() => refetch()} />
        ) : transactions.length === 0 ? (
          hasFilters ? (
            <EmptyState tone="neutral" title="Ningún movimiento con estos filtros" />
          ) : (
            <EmptyState
              tone="pendiente"
              title="Aún no registras nada"
              description="Captura tu primer gasto y aquí va a quedar el historial."
              action={
                <Link href="/capturar/gasto" className="text-sm font-medium text-primary underline">
                  Capturar gasto
                </Link>
              }
            />
          )
        ) : (
          <>
            {transactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
            {hasNextPage ? (
              <Button
                type="button"
                variant="secondary"
                loading={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                Cargar más
              </Button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
