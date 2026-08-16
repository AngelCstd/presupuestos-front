import { describe, expect, it } from 'vitest';
import { invalidationFor } from '@/lib/query/invalidation';
import { qk } from '@/lib/query-keys';
import type { MutationName, QueryKey } from '@/types/api';

/**
 * `invalidationFor` solo recibe el nombre de la mutación (TASK-front.md §6.1), sin ids
 * de recurso: no puede construir un `qk.account(id)` de una cuenta específica, así que
 * lo que declara son las categorías de recurso a invalidar (el primer segmento de cada
 * key de `qk`), no instancias puntuales — esas las agrega el hook de la mutación con los
 * ids que sí conoce. Por eso esta suite compara por categoría, no por key completa,
 * excepto para `qk.openPeriods()`, que TASK-front.md U10 exige verificar tal cual.
 */
function categoriesOf(keys: readonly QueryKey[]): Set<string> {
  return new Set(keys.map((key) => String(key[0])));
}

const EXPECTED_CATEGORIES: Record<MutationName, string[]> = {
  createTransaction: ['dashboard', 'transactions', 'accounts', 'account', 'account-ledger', 'categories', 'unassigned-funds'],
  reversal: ['dashboard', 'transactions', 'accounts', 'account', 'account-ledger', 'categories', 'unassigned-funds', 'transaction'],
  putAllocation: ['dashboard', 'categories', 'allocations', 'unassigned-funds'],
  moveAllocation: ['dashboard', 'categories', 'allocations', 'unassigned-funds'],
  deleteAllocation: ['dashboard', 'categories', 'allocations', 'unassigned-funds'],
  closePeriod: ['dashboard', 'categories', 'allocations', 'periods', 'close-preview', 'unassigned-funds'],
  createPeriod: ['periods', 'dashboard', 'unassigned-funds'],
  editPeriod: ['periods', 'dashboard', 'unassigned-funds'],
  deletePeriod: ['periods', 'dashboard', 'unassigned-funds'],
  createAccount: ['accounts', 'dashboard'],
  archiveAccount: ['accounts', 'dashboard'],
  createCategory: ['categories', 'dashboard'],
  archiveCategory: ['categories', 'dashboard'],
  confirmRecurring: [
    'recurring-templates',
    'dashboard',
    'transactions',
    'accounts',
    'account',
    'account-ledger',
    'categories',
    'unassigned-funds',
  ],
};

describe('invalidationFor — cada mutación invalida exactamente las categorías declaradas (ARCHITECTURE §5.2)', () => {
  for (const [mutation, expected] of Object.entries(EXPECTED_CATEGORIES) as [
    MutationName,
    string[],
  ][]) {
    it(`"${mutation}" invalida exactamente: ${expected.join(', ')}`, () => {
      const result = invalidationFor(mutation);
      expect(categoriesOf(result)).toEqual(new Set(expected));
    });
  }
});

describe('invalidationFor — openPeriods es la más fácil de olvidar y no se olvida', () => {
  it.each(['closePeriod', 'createPeriod', 'editPeriod', 'deletePeriod'] as MutationName[])(
    '"%s" incluye qk.openPeriods() explícitamente',
    (mutation) => {
      const result = invalidationFor(mutation);
      expect(result).toContainEqual(qk.openPeriods());
    },
  );

  it('una mutación que no toca periodos (crear cuenta) no incluye openPeriods', () => {
    const result = invalidationFor('createAccount');
    expect(result).not.toContainEqual(qk.openPeriods());
  });
});
