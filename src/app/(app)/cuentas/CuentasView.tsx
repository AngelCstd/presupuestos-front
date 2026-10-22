'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Balance } from '@/components/money/Balance';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/states/ErrorState';
import { Skeleton } from '@/components/states/Skeleton';
import { CreateAccountForm } from '@/features/accounts/components/CreateAccountForm';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { ApiError } from '@/lib/api/errors';

export function CuentasView() {
  const { data, isLoading, error, refetch } = useAccounts();
  const [creating, setCreating] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
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

  return (
    <div className="flex flex-col gap-4 p-4">
      {data.data.map((account) => (
        <Link
          key={account.id}
          href={`/cuentas/${account.id}`}
          className="flex items-center justify-between gap-2 rounded-md border border-border p-3 hover:bg-muted-background"
        >
          <span className="text-foreground">{account.name}</span>
          <span className="flex items-center gap-2">
            <Balance cents={account.balanceCents} kind={account.kind} />
            <span aria-hidden="true" className="text-muted">
              ›
            </span>
          </span>
        </Link>
      ))}

      <Button type="button" variant="secondary" onClick={() => setCreating(true)}>
        Nueva cuenta
      </Button>

      <CreateAccountForm open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
