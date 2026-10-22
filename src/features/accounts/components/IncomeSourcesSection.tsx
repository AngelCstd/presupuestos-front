'use client';

import { useState } from 'react';
import { Balance } from '@/components/money/Balance';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/states/EmptyState';
import { Skeleton } from '@/components/states/Skeleton';
import { CreateIncomeSourceForm } from '@/features/accounts/components/CreateIncomeSourceForm';
import { useIncomeSources } from '@/features/accounts/hooks/useIncomeSources';

export function IncomeSourcesSection() {
  const { data, isLoading } = useIncomeSources();
  const [creating, setCreating] = useState(false);

  if (isLoading || !data) {
    return <Skeleton className="h-16 w-full" />;
  }

  return (
    <div className="flex flex-col gap-2">
      {data.data.length === 0 ? (
        <EmptyState
          tone="pendiente"
          title="No tienes fuentes de ingreso"
          description="Sirven para saber de dónde viene tu dinero."
        />
      ) : (
        data.data.map((incomeSource) => (
          <div
            key={incomeSource.id}
            className="flex items-center justify-between rounded-md border border-border p-3"
          >
            <span className="text-foreground">{incomeSource.name}</span>
            <Balance cents={incomeSource.balanceCents} kind={incomeSource.kind} />
          </div>
        ))
      )}

      <Button type="button" variant="secondary" onClick={() => setCreating(true)}>
        Nueva fuente de ingreso
      </Button>

      <CreateIncomeSourceForm open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
