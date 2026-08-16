import type { QueryKey } from '@/types/api';

/**
 * STUB — sesión de tests. La implementación real (U10, TASK-front.md) todavía no existe.
 * Forma fijada en TASK-front.md §6.2, con la firma completa de cada función en
 * ARCHITECTURE-front.md §5.1. Cada función lanza: aunque el contenido esté descrito
 * en la arquitectura, esta sesión no implementa nada (ver el resto de `lib/`).
 */

function notImplemented(name: string): never {
  throw new Error(`qk.${name}: not implemented`);
}

export const qk = {
  me: (): QueryKey => notImplemented('me'),
  dashboard: (periodId: string | null): QueryKey => notImplemented('dashboard'),
  accounts: (opts: Record<string, unknown>): QueryKey => notImplemented('accounts'),
  account: (id: string): QueryKey => notImplemented('account'),
  accountLedger: (id: string): QueryKey => notImplemented('accountLedger'),
  categories: (periodId: string | null): QueryKey => notImplemented('categories'),
  category: (id: string): QueryKey => notImplemented('category'),
  categoryLedger: (id: string): QueryKey => notImplemented('categoryLedger'),
  incomeSources: (): QueryKey => notImplemented('incomeSources'),
  periods: (status: string | null): QueryKey => notImplemented('periods'),
  openPeriods: (): QueryKey => notImplemented('openPeriods'),
  allocations: (periodId: string): QueryKey => notImplemented('allocations'),
  closePreview: (periodId: string): QueryKey => notImplemented('closePreview'),
  transactions: (filters: Record<string, unknown>): QueryKey => notImplemented('transactions'),
  transaction: (id: string): QueryKey => notImplemented('transaction'),
  recurringTemplates: (opts: Record<string, unknown>): QueryKey =>
    notImplemented('recurringTemplates'),
  unassignedFunds: (): QueryKey => notImplemented('unassignedFunds'),
};
