'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { Skeleton } from '@/components/states/Skeleton';
import { CategoryCard } from '@/features/envelopes/components/CategoryCard';
import { CoverOverspendSheet } from '@/features/envelopes/components/CoverOverspendSheet';
import { useCategories } from '@/features/envelopes/hooks/useCategories';
import { useMoveAllocation } from '@/features/envelopes/hooks/useMoveAllocation';
import { useSetAllocation } from '@/features/envelopes/hooks/useSetAllocation';
import { SUGGESTED_CATEGORIES } from '@/features/onboarding/suggestions';
import { bffFetch } from '@/lib/api/browser-client';
import { ApiError } from '@/lib/api/errors';
import { es } from '@/lib/i18n/es';
import type { Category } from '@/types/api';

export function EnvelopesView({ periodId }: { periodId: string | null }) {
  const { data, isLoading, error, refetch } = useCategories(periodId);
  const [coverTarget, setCoverTarget] = useState<Category | null>(null);
  const [creatingSuggestions, setCreatingSuggestions] = useState(false);

  const setAllocation = useSetAllocation(periodId ?? '');
  const moveAllocation = useMoveAllocation(periodId ?? '');

  if (periodId === null) {
    return (
      <div className="p-4">
        <EmptyState
          tone="pendiente"
          title="Necesitas un periodo abierto para repartir"
          action={
            <Link href="/periodos" className="text-sm font-medium text-primary underline">
              Crear periodo
            </Link>
          }
        />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorState
          code={error instanceof ApiError ? error.code : 'INTERNAL_ERROR'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (data.total === 0) {
    return (
      <div className="p-4">
        <EmptyState
          tone="pendiente"
          title={`No tienes ${es.kind.category.toLowerCase()}s`}
          description={`Un ${es.kind.category.toLowerCase()} es una bolsa de dinero con nombre: Comida, Transporte, lo que uses.`}
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
              Usar los sugeridos
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {data.data.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          saving={setAllocation.isPending && setAllocation.variables?.categoryId === category.id}
          onSetAllocation={(targetAssignedCents) =>
            setAllocation.mutate({ categoryId: category.id, targetAssignedCents })
          }
          onCoverOverspend={() => setCoverTarget(category)}
        />
      ))}

      <CoverOverspendSheet
        open={coverTarget !== null}
        onClose={() => setCoverTarget(null)}
        target={coverTarget}
        categories={data.data}
        moving={moveAllocation.isPending}
        onCover={(fromCategoryId, amountCents) => {
          if (!coverTarget) return;
          moveAllocation.mutate(
            { fromCategoryId, toCategoryId: coverTarget.id, amountCents },
            { onSuccess: () => setCoverTarget(null) },
          );
        }}
      />
    </div>
  );
}
