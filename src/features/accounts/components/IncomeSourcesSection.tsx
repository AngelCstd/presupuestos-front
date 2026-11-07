'use client';

import { useState, useMemo } from 'react';
import { Balance } from '@/components/money/Balance';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/states/EmptyState';
import { Skeleton } from '@/components/states/Skeleton';
import { CreateIncomeSourceForm } from '@/features/accounts/components/CreateIncomeSourceForm';
import { useIncomeSources } from '@/features/accounts/hooks/useIncomeSources';

import { es } from '@/lib/i18n/es';

export function IncomeSourcesSection() {
  const { data, isLoading } = useIncomeSources();
  const [creating, setCreating] = useState(false);

  const sources = useMemo(
    () => [...(data?.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [data?.data],
  );

  if (isLoading || !data) {
    return <Skeleton className="h-16 w-full rounded-xl" />;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {sources.length === 0 ? (
        <EmptyState
          tone="pendiente"
          title={es.masView.emptyIncomeSourcesTitle}
          description={es.masView.emptyIncomeSourcesDesc}
        />
      ) : (
        sources.map((incomeSource) => (
          <div
            key={incomeSource.id}
            className="flex items-center justify-between rounded-xl border border-border/80 bg-background p-3.5 shadow-sm"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">{incomeSource.name}</span>
              <span className="text-2xs text-muted">{es.masView.incomeSourceAccumulatedLabel}</span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <Balance cents={incomeSource.balanceCents} kind={incomeSource.kind} />
            </div>
          </div>
        ))
      )}

      <Button type="button" variant="secondary" size="sm" onClick={() => setCreating(true)} className="self-start text-xs">
        {es.masView.newIncomeSourceAction}
      </Button>

      <CreateIncomeSourceForm open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
