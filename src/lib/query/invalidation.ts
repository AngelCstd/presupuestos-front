import { qk } from '@/lib/query-keys';
import type { MutationName, QueryKey } from '@/types/api';

/**
 * La matriz de ARCHITECTURE-front.md §5.2, como dato. `invalidationFor` no recibe ids
 * de recurso (TASK-front.md §6.1) — no puede construir un `qk.account('a1')` de una
 * cuenta específica sin saber cuál. Lo que declara son las categorías de recurso a
 * invalidar, como prefijos de key (`['account']`, no `['account', 'a1']`): TanStack
 * Query hace matching por prefijo, así que invalidar el prefijo cubre cualquier
 * instancia cacheada. La única key completa que se declara tal cual es
 * `qk.openPeriods()`, porque es la que alimenta el banner del layout raíz y TASK-front.md
 * exige verificarla explícitamente en cada mutación que cierra o crea un periodo.
 */
function prefix(category: string): QueryKey {
  return [category];
}

function categories(...cats: string[]): QueryKey[] {
  return cats.map(prefix);
}

const CREATE_TRANSACTION_KEYS = categories(
  'dashboard',
  'transactions',
  'accounts',
  'account',
  'account-ledger',
  'categories',
  'unassigned-funds',
);

const ALLOCATION_WRITE_KEYS = categories('dashboard', 'categories', 'allocations', 'unassigned-funds');

const INVALIDATION_MATRIX: Record<MutationName, QueryKey[]> = {
  createTransaction: CREATE_TRANSACTION_KEYS,
  reversal: [...CREATE_TRANSACTION_KEYS, prefix('transaction')],

  putAllocation: ALLOCATION_WRITE_KEYS,
  moveAllocation: ALLOCATION_WRITE_KEYS,
  deleteAllocation: ALLOCATION_WRITE_KEYS,

  closePeriod: [
    ...categories('dashboard', 'categories', 'allocations', 'periods', 'close-preview', 'unassigned-funds'),
    qk.openPeriods(),
  ],
  createPeriod: [...categories('periods', 'dashboard', 'unassigned-funds'), qk.openPeriods()],
  editPeriod: [...categories('periods', 'dashboard', 'unassigned-funds'), qk.openPeriods()],
  deletePeriod: [...categories('periods', 'dashboard', 'unassigned-funds'), qk.openPeriods()],

  createAccount: categories('accounts', 'dashboard'),
  archiveAccount: categories('accounts', 'dashboard'),

  createCategory: categories('categories', 'dashboard'),
  archiveCategory: categories('categories', 'dashboard'),

  confirmRecurring: [prefix('recurring-templates'), ...CREATE_TRANSACTION_KEYS],
};

export function invalidationFor(mutation: MutationName): readonly QueryKey[] {
  return INVALIDATION_MATRIX[mutation];
}
