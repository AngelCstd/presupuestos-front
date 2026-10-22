import type { QueryKey } from '@/types/api';

/**
 * ARCHITECTURE-front.md §5.1. Los cursores nunca entran en una key (§6.1 del contrato:
 * son opacos y no se persisten).
 */
export const qk = {
  me: (): QueryKey => ['me'],
  dashboard: (periodId: string | null): QueryKey => ['dashboard', periodId ?? 'current'],
  // `object`, no `Record<string, unknown>`: pasar una interfaz nombrada (como
  // TransactionFilters) a un parámetro con firma de índice choca con TS aquí —
  // mismo patrón que ya se resolvió en buildQueryString (U11). No afecta a
  // query-keys.test.ts, que solo pasa objetos literales.
  accounts: (opts: object): QueryKey => ['accounts', opts],
  account: (id: string): QueryKey => ['account', id],
  accountLedger: (id: string): QueryKey => ['account-ledger', id],
  // `opts` no entra en la key salvo `includeArchived`, y solo como marcador
  // ('archived'), no como objeto — mantiene categories(null) === ['categories', 'none']
  // intacto (tests/query-keys.test.ts, exacto) y evita que la vista de Archivadas (U23)
  // choque con la cache normal de /sobres.
  categories: (periodId: string | null, opts: { includeArchived?: boolean } = {}): QueryKey =>
    opts.includeArchived ? ['categories', periodId ?? 'none', 'archived'] : ['categories', periodId ?? 'none'],
  category: (id: string): QueryKey => ['category', id],
  categoryLedger: (id: string): QueryKey => ['category-ledger', id],
  incomeSources: (opts: { includeArchived?: boolean } = {}): QueryKey =>
    opts.includeArchived ? ['income-sources', 'archived'] : ['income-sources'],
  periods: (status: string | null): QueryKey => ['periods', status ?? 'all'],
  openPeriods: (): QueryKey => ['periods', 'open'],
  allocations: (periodId: string): QueryKey => ['allocations', periodId],
  closePreview: (periodId: string): QueryKey => ['close-preview', periodId],
  transactions: (filters: object): QueryKey => ['transactions', filters],
  transaction: (id: string): QueryKey => ['transaction', id],
  recurringTemplates: (opts: object): QueryKey => ['recurring-templates', opts],
  unassignedFunds: (): QueryKey => ['unassigned-funds'],
  // Agregada en U19 (2026-08-17): GET /insights/unbudgeted-transactions es un
  // endpoint real y propio del contrato (§14), pero ARCHITECTURE-front.md §5.1 nunca
  // le asignó key — hueco real, no una fila que se decidiera omitir. La usa el
  // banner de Movimientos (y el de Inicio, que hasta ahora resolvía esto vía el
  // dashboard completo).
  unbudgetedTransactions: (): QueryKey => ['unbudgeted-transactions'],
};
