'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useArchiveAccount } from '@/features/accounts/hooks/useArchiveAccount';
import { useArchiveIncomeSource } from '@/features/accounts/hooks/useArchiveIncomeSource';
import { useIncomeSources } from '@/features/accounts/hooks/useIncomeSources';
import { useArchiveCategory } from '@/features/envelopes/hooks/useArchiveCategory';
import { useCategories } from '@/features/envelopes/hooks/useCategories';
import { es } from '@/lib/i18n/es';
import type { Account, Category, IncomeSource } from '@/types/api';

function ArchivedAccountRow({ account }: { account: Account }) {
  const archiveAccount = useArchiveAccount(account.id);
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/80 bg-background p-3.5 shadow-sm">
      <span className="text-sm font-medium text-foreground">{account.name}</span>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="text-xs"
        loading={archiveAccount.isPending}
        onClick={() => archiveAccount.mutate(false)}
      >
        {es.masView.reactivateAction}
      </Button>
    </div>
  );
}

function ArchivedCategoryRow({ category }: { category: Category }) {
  const archiveCategory = useArchiveCategory(category.id);
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/80 bg-background p-3.5 shadow-sm">
      <span className="text-sm font-medium text-foreground">{category.name}</span>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="text-xs"
        loading={archiveCategory.isPending}
        onClick={() => archiveCategory.mutate(false)}
      >
        {es.masView.reactivateAction}
      </Button>
    </div>
  );
}

function ArchivedIncomeSourceRow({ incomeSource }: { incomeSource: IncomeSource }) {
  const archiveIncomeSource = useArchiveIncomeSource(incomeSource.id);
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/80 bg-background p-3.5 shadow-sm">
      <span className="text-sm font-medium text-foreground">{incomeSource.name}</span>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="text-xs"
        loading={archiveIncomeSource.isPending}
        onClick={() => archiveIncomeSource.mutate(false)}
      >
        {es.masView.reactivateAction}
      </Button>
    </div>
  );
}

export function ArchivedSection() {
  const { data: accounts } = useAccounts({ includeArchived: true });
  const { data: categories } = useCategories(null, { includeArchived: true });
  const { data: incomeSources } = useIncomeSources({ includeArchived: true });

  const archivedAccounts = useMemo(
    () => [...(accounts?.data.filter((account) => account.archivedAt !== null) ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [accounts?.data],
  );
  const archivedCategories = useMemo(
    () => [...(categories?.data.filter((category) => category.archivedAt !== null) ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [categories?.data],
  );
  const archivedIncomeSources = useMemo(
    () => [...(incomeSources?.data.filter((incomeSource) => incomeSource.archivedAt !== null) ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [incomeSources?.data],
  );

  const total = archivedAccounts.length + archivedCategories.length + archivedIncomeSources.length;

  if (total === 0) {
    return <p className="text-xs text-muted">{es.masView.emptyArchived}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {archivedAccounts.map((account) => (
        <ArchivedAccountRow key={account.id} account={account} />
      ))}
      {archivedCategories.map((category) => (
        <ArchivedCategoryRow key={category.id} category={category} />
      ))}
      {archivedIncomeSources.map((incomeSource) => (
        <ArchivedIncomeSourceRow key={incomeSource.id} incomeSource={incomeSource} />
      ))}
    </div>
  );
}
