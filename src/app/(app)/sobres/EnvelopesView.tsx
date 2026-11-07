'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { Skeleton } from '@/components/states/Skeleton';
import { CategoryCard } from '@/features/envelopes/components/CategoryCard';
import { MoveFundsSheet } from '@/features/envelopes/components/MoveFundsSheet';
import { HeroCard } from '@/features/dashboard/components/HeroCard';
import { UnassignedFundsSheet } from '@/features/dashboard/components/UnassignedFundsSheet';
import { useCategories } from '@/features/envelopes/hooks/useCategories';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';
import { useMoveAllocation } from '@/features/envelopes/hooks/useMoveAllocation';
import { useSetAllocation } from '@/features/envelopes/hooks/useSetAllocation';
import { SUGGESTED_CATEGORIES } from '@/features/onboarding/suggestions';
import { bffFetch } from '@/lib/api/browser-client';
import { ApiError } from '@/lib/api/errors';
import { es } from '@/lib/i18n/es';
import type { Category } from '@/types/api';

export function EnvelopesView({ periodId }: { periodId: string | null }) {
  const searchParams = useSearchParams();
  const cubrirId = searchParams?.get('cubrir');
  const { data, isLoading, error, refetch } = useCategories(periodId);
  const { data: dashboard } = useDashboard(periodId);
  const [moveTarget, setMoveTarget] = useState<Category | null>(null);
  const [unassignedSheetOpen, setUnassignedSheetOpen] = useState(false);
  const [creatingSuggestions, setCreatingSuggestions] = useState(false);

  const categories: Category[] = useMemo(
    () => [...(data?.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [data?.data],
  );

  useEffect(() => {
    if (cubrirId && data?.data) {
      const match = data.data.find((c) => c.id === cubrirId);
      if (match && match.period && BigInt(match.period.availableCents) < 0n) {
        setMoveTarget(match);
      } else if (match && typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('cubrir');
        window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
      }
    }
  }, [cubrirId, data]);

  function handleCloseMove() {
    setMoveTarget(null);
    if (cubrirId && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('cubrir');
      window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
    }
  }

  const setAllocation = useSetAllocation(periodId ?? '');
  const moveAllocation = useMoveAllocation(periodId ?? '');

  if (periodId === null) {
    return (
      <div className="flex flex-col gap-5 p-4 pb-36">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">{es.envelopesView.title}</h1>
          <p className="text-xs text-muted">{es.envelopesView.subtitle}</p>
        </header>
        <EmptyState
          tone="pendiente"
          title={es.envelopesView.noPeriodTitle}
          action={
            <Link href="/periodos" className="text-sm font-medium text-primary underline">
              {es.envelopesView.createPeriodAction}
            </Link>
          }
        />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-5 p-4 pb-36">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">{es.envelopesView.title}</h1>
          <p className="text-xs text-muted">{es.envelopesView.subtitle}</p>
        </header>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-5 p-4 pb-36">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">{es.envelopesView.title}</h1>
          <p className="text-xs text-muted">{es.envelopesView.subtitle}</p>
        </header>
        <ErrorState
          code={error instanceof ApiError ? error.code : 'INTERNAL_ERROR'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (data.total === 0) {
    return (
      <div className="flex flex-col gap-5 p-4 pb-36">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">{es.envelopesView.title}</h1>
          <p className="text-xs text-muted">{es.envelopesView.subtitle}</p>
        </header>
        <EmptyState
          tone="pendiente"
          title={es.envelopesView.noEnvelopesTitle}
          description={es.envelopesView.noEnvelopesDesc}
          action={
            <Button
              type="button"
              loading={creatingSuggestions}
              onClick={async () => {
                setCreatingSuggestions(true);
                for (const suggestion of SUGGESTED_CATEGORIES) {
                  await bffFetch({
                    method: 'POST',
                    path: '/categories',
                    body: { name: suggestion.name, rolloverType: suggestion.rolloverType },
                  });
                }
                setCreatingSuggestions(false);
                refetch();
              }}
            >
              {es.envelopesView.useSuggestionsAction}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4 pb-36">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">{es.envelopesView.title}</h1>
        <p className="text-xs text-muted">{es.envelopesView.subtitle}</p>
      </header>

      {/* F3: Unassigned funds block identical to Inicio */}
      {dashboard ? (
        <HeroCard
          dashboard={dashboard}
          onOpenUnassignedSheet={() => setUnassignedSheetOpen(true)}
          hideEnvelopesLink={true}
        />
      ) : null}

      <section className="flex flex-col gap-4" id="envelopes-list">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            saving={setAllocation.isPending && setAllocation.variables?.categoryId === category.id}
            onSetAllocation={(targetAssignedCents) =>
              setAllocation.mutate({ categoryId: category.id, targetAssignedCents })
            }
            onCoverOverspend={() => setMoveTarget(category)}
            onMoveFunds={() => setMoveTarget(category)}
          />
        ))}
      </section>

      <MoveFundsSheet
        open={moveTarget !== null}
        onClose={handleCloseMove}
        targetCategory={moveTarget}
        categories={data.data}
        moving={moveAllocation.isPending}
        onMove={(fromCategoryId, toCategoryId, amountCents) => {
          moveAllocation.mutate(
            { fromCategoryId, toCategoryId, amountCents },
            { onSuccess: handleCloseMove },
          );
        }}
      />

      {dashboard ? (
        <UnassignedFundsSheet
          open={unassignedSheetOpen}
          onClose={() => setUnassignedSheetOpen(false)}
          dashboard={dashboard}
        />
      ) : null}
    </div>
  );
}
