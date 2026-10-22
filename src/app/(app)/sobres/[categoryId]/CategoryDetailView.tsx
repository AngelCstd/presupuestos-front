'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Balance } from '@/components/money/Balance';
import { Money } from '@/components/money/Money';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { Skeleton } from '@/components/states/Skeleton';
import { EnvelopeStatusBadge } from '@/features/envelopes/components/EnvelopeStatusBadge';
import { useArchiveCategory } from '@/features/envelopes/hooks/useArchiveCategory';
import { useCategories } from '@/features/envelopes/hooks/useCategories';
import { useCategoryLedger } from '@/features/envelopes/hooks/useCategoryLedger';
import { useUpdateCategory } from '@/features/envelopes/hooks/useUpdateCategory';
import { ApiError } from '@/lib/api/errors';
import { es } from '@/lib/i18n/es';
import type { RolloverType } from '@/types/api';

export function CategoryDetailView({ categoryId, periodId }: { categoryId: string; periodId: string | null }) {
  const { data: categories, isLoading: loadingCategories } = useCategories(periodId);
  const { data: ledger, isLoading: loadingLedger } = useCategoryLedger(categoryId);

  const updateCategory = useUpdateCategory(categoryId);
  const archiveCategory = useArchiveCategory(categoryId);

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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">{category.name}</h1>
        {category.period ? <EnvelopeStatusBadge status={category.period.status} /> : null}
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
            <dt className="text-muted">{es.field.spentCents}</dt>
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
        {es.field.balanceCents} histórico: <Balance cents={category.balanceCents} kind={category.kind} />
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
          Archivar
        </Button>
        {archiveError ? <ErrorState code={archiveError} /> : null}
      </div>
    </div>
  );
}
