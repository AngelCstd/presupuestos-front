'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Banner } from '@/components/layout/Banner';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { Skeleton } from '@/components/states/Skeleton';
import { TransactionRow } from '@/features/transactions/components/TransactionRow';
import { useTransactions, type TransactionFilters } from '@/features/transactions/hooks/useTransactions';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useCategories } from '@/features/envelopes/hooks/useCategories';
import { useOpenPeriods } from '@/features/periods/hooks/useOpenPeriods';
import { useUnbudgetedTransactions } from '@/features/dashboard/hooks/useUnbudgetedTransactions';
import { ApiError } from '@/lib/api/errors';
import { formatCalendarDate } from '@/lib/domain/dates';
import { es } from '@/lib/i18n/es';

export function MovimientosView() {
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const hasFilters = Object.values(filters).some((value) => value !== undefined && value !== '');

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useTransactions(filters);
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories(null);
  const { data: openPeriods } = useOpenPeriods();
  const { data: unbudgeted } = useUnbudgetedTransactions();

  const currentPeriod = openPeriods?.data?.[0];
  const isPeriodFilterActive = Boolean(
    currentPeriod &&
      filters.from === currentPeriod.startsOn &&
      filters.to === currentPeriod.endsOn &&
      !filters.accountId &&
      !filters.categoryId,
  );

  const selectedAccountName = accounts?.data.find((a) => a.id === filters.accountId)?.name;
  const selectedCategoryName = categories?.data.find((c) => c.id === filters.categoryId)?.name;

  const sortedAccounts = useMemo(
    () => [...(accounts?.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [accounts?.data],
  );
  const sortedCategories = useMemo(
    () => [...(categories?.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [categories?.data],
  );

  const transactions = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  return (
    <div className="flex flex-col gap-5 p-4 pb-36">
      <header className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-bold text-foreground">{es.transactionsHistory.title}</h1>
          <p className="text-xs text-muted">{es.transactionsHistory.subtitle}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setFiltersOpen((prev) => !prev)}
          className="text-xs shrink-0"
        >
          {filtersOpen ? es.transactionsHistory.hideFiltersButton : es.transactionsHistory.filterButton}
        </Button>
      </header>

      {unbudgeted && unbudgeted.transactions.length > 0 && unbudgeted.transactions[0] ? (
        <Banner
          message={es.transactionsHistory.unbudgetedBanner(unbudgeted.transactions.length)}
          action={
            <Link
              href={`/movimientos/${unbudgeted.transactions[0].transactionId}`}
              className="text-sm font-medium text-primary underline active:scale-95 inline-flex items-center gap-1"
            >
              <span>{es.inicio.viewPending}</span>
              <span aria-hidden="true" className="text-xs">›</span>
            </Link>
          }
        />
      ) : null}

      {/* Etiquetas compactas de filtros activos */}
      {hasFilters && !filtersOpen ? (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {filters.from ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted-background/60 px-2.5 py-0.5 text-2xs font-medium text-foreground">
              <span>{es.transactionsHistory.fromDate}: {formatCalendarDate(filters.from)}</span>
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, from: undefined }))}
                className="hover:text-danger ml-0.5"
                aria-label="Quitar filtro desde"
              >
                ✕
              </button>
            </span>
          ) : null}
          {filters.to ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted-background/60 px-2.5 py-0.5 text-2xs font-medium text-foreground">
              <span>{es.transactionsHistory.toDate}: {formatCalendarDate(filters.to)}</span>
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, to: undefined }))}
                className="hover:text-danger ml-0.5"
                aria-label="Quitar filtro hasta"
              >
                ✕
              </button>
            </span>
          ) : null}
          {selectedAccountName ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted-background/60 px-2.5 py-0.5 text-2xs font-medium text-foreground">
              <span>{selectedAccountName}</span>
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, accountId: undefined }))}
                className="hover:text-danger ml-0.5"
                aria-label="Quitar filtro cuenta"
              >
                ✕
              </button>
            </span>
          ) : null}
          {selectedCategoryName ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted-background/60 px-2.5 py-0.5 text-2xs font-medium text-foreground">
              <span>{selectedCategoryName}</span>
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, categoryId: undefined }))}
                className="hover:text-danger ml-0.5"
                aria-label="Quitar filtro sobre"
              >
                ✕
              </button>
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setFilters({})}
            className="text-2xs font-medium text-primary hover:underline ml-1"
          >
            {es.transactionsHistory.clearFilters}
          </button>
        </div>
      ) : null}

      {/* Panel colapsable de Filtros */}
      {filtersOpen ? (
        <section className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted-background/30 p-3.5">
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-2xs font-medium text-muted">
              <span>{es.transactionsHistory.fromDate}</span>
              <input
                type="date"
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={filters.from ?? ''}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, from: event.target.value || undefined }))
                }
              />
            </label>
            <label className="flex flex-col gap-1 text-2xs font-medium text-muted">
              <span>{es.transactionsHistory.toDate}</span>
              <input
                type="date"
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={filters.to ?? ''}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, to: event.target.value || undefined }))
                }
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              value={filters.accountId ?? ''}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, accountId: event.target.value || undefined }))
              }
            >
              <option value="">{es.transactionsHistory.allAccounts}</option>
              {sortedAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>

            <select
              className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              value={filters.categoryId ?? ''}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, categoryId: event.target.value || undefined }))
              }
            >
              <option value="">{es.transactionsHistory.allEnvelopes}</option>
              {sortedCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pt-1">
            {hasFilters ? (
              <button
                type="button"
                onClick={() => setFilters({})}
                className="text-xs text-muted hover:text-foreground"
              >
                {es.transactionsHistory.clearFilters}
              </button>
            ) : <span />}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setFiltersOpen(false)}
              className="text-xs"
            >
              Listo
            </Button>
          </div>
        </section>
      ) : null}

      {/* Lista de Movimientos */}
      <section className="flex flex-col gap-2.5">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-18 w-full rounded-xl" />
            <Skeleton className="h-18 w-full rounded-xl" />
            <Skeleton className="h-18 w-full rounded-xl" />
          </div>
        ) : error ? (
          <ErrorState code={error instanceof ApiError ? error.code : 'INTERNAL_ERROR'} onRetry={() => refetch()} />
        ) : transactions.length === 0 ? (
          isPeriodFilterActive ? (
            <EmptyState tone="exito" title={es.transactionsHistory.emptyPeriodTitle} />
          ) : hasFilters ? (
            <EmptyState
              tone="neutral"
              title={es.transactionsHistory.emptyFilteredTitle}
              action={
                <Button type="button" variant="ghost" size="sm" onClick={() => setFilters({})}>
                  {es.transactionsHistory.clearFilters}
                </Button>
              }
            />
          ) : (
            <EmptyState
              tone="pendiente"
              title={es.transactionsHistory.emptyNoRecordsTitle}
              description={es.transactionsHistory.emptyNoRecordsDesc}
              action={
                <Link href="/capturar/gasto" className="text-sm font-medium text-primary underline">
                  {es.transactionsHistory.emptyNoRecordsAction}
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
                className="mt-2 w-full py-2.5 text-sm"
              >
                {es.transactionsHistory.loadMore}
              </Button>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
