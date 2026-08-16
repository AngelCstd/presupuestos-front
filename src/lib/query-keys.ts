import type { QueryKey } from '@/types/api';

/**
 * ARCHITECTURE-front.md §5.1. Los cursores nunca entran en una key (§6.1 del contrato:
 * son opacos y no se persisten).
 */
export const qk = {
  me: (): QueryKey => ['me'],
  dashboard: (periodId: string | null): QueryKey => ['dashboard', periodId ?? 'current'],
  accounts: (opts: Record<string, unknown>): QueryKey => ['accounts', opts],
  account: (id: string): QueryKey => ['account', id],
  accountLedger: (id: string): QueryKey => ['account-ledger', id],
  categories: (periodId: string | null): QueryKey => ['categories', periodId ?? 'none'],
  category: (id: string): QueryKey => ['category', id],
  categoryLedger: (id: string): QueryKey => ['category-ledger', id],
  incomeSources: (): QueryKey => ['income-sources'],
  periods: (status: string | null): QueryKey => ['periods', status ?? 'all'],
  openPeriods: (): QueryKey => ['periods', 'open'],
  allocations: (periodId: string): QueryKey => ['allocations', periodId],
  closePreview: (periodId: string): QueryKey => ['close-preview', periodId],
  transactions: (filters: Record<string, unknown>): QueryKey => ['transactions', filters],
  transaction: (id: string): QueryKey => ['transaction', id],
  recurringTemplates: (opts: Record<string, unknown>): QueryKey => ['recurring-templates', opts],
  unassignedFunds: (): QueryKey => ['unassigned-funds'],
};
