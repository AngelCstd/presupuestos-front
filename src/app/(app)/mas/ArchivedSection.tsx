'use client';

import { Button } from '@/components/ui/Button';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useArchiveAccount } from '@/features/accounts/hooks/useArchiveAccount';
import { useArchiveIncomeSource } from '@/features/accounts/hooks/useArchiveIncomeSource';
import { useIncomeSources } from '@/features/accounts/hooks/useIncomeSources';
import { useArchiveCategory } from '@/features/envelopes/hooks/useArchiveCategory';
import { useCategories } from '@/features/envelopes/hooks/useCategories';
import type { Account, Category, IncomeSource } from '@/types/api';

function ArchivedAccountRow({ account }: { account: Account }) {
  const archiveAccount = useArchiveAccount(account.id);
  return (
    <div className="flex items-center justify-between rounded-md border border-border p-3">
      <span className="text-foreground">{account.name}</span>
      <Button type="button" size="sm" variant="secondary" loading={archiveAccount.isPending} onClick={() => archiveAccount.mutate(false)}>
        Reactivar
      </Button>
    </div>
  );
}

function ArchivedCategoryRow({ category }: { category: Category }) {
  const archiveCategory = useArchiveCategory(category.id);
  return (
    <div className="flex items-center justify-between rounded-md border border-border p-3">
      <span className="text-foreground">{category.name}</span>
      <Button type="button" size="sm" variant="secondary" loading={archiveCategory.isPending} onClick={() => archiveCategory.mutate(false)}>
        Reactivar
      </Button>
    </div>
  );
}

function ArchivedIncomeSourceRow({ incomeSource }: { incomeSource: IncomeSource }) {
  const archiveIncomeSource = useArchiveIncomeSource(incomeSource.id);
  return (
    <div className="flex items-center justify-between rounded-md border border-border p-3">
      <span className="text-foreground">{incomeSource.name}</span>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        loading={archiveIncomeSource.isPending}
        onClick={() => archiveIncomeSource.mutate(false)}
      >
        Reactivar
      </Button>
    </div>
  );
}

export function ArchivedSection() {
  const { data: accounts } = useAccounts({ includeArchived: true });
  const { data: categories } = useCategories(null, { includeArchived: true });
  const { data: incomeSources } = useIncomeSources({ includeArchived: true });

  const archivedAccounts = accounts?.data.filter((account) => account.archivedAt !== null) ?? [];
  const archivedCategories = categories?.data.filter((category) => category.archivedAt !== null) ?? [];
  const archivedIncomeSources = incomeSources?.data.filter((incomeSource) => incomeSource.archivedAt !== null) ?? [];

  const total = archivedAccounts.length + archivedCategories.length + archivedIncomeSources.length;

  if (total === 0) {
    return <p className="text-sm text-muted">No tienes nada archivado.</p>;
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
