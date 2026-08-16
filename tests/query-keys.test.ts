import { describe, expect, it } from 'vitest';
import { qk } from '@/lib/query-keys';

describe('qk — cada key coincide exactamente con ARCHITECTURE-front.md §5.1', () => {
  it('me()', () => {
    expect(qk.me()).toEqual(['me']);
  });

  it('dashboard(null) usa "current"', () => {
    expect(qk.dashboard(null)).toEqual(['dashboard', 'current']);
  });

  it('dashboard(periodId) usa el id', () => {
    expect(qk.dashboard('per-1')).toEqual(['dashboard', 'per-1']);
  });

  it('accounts(opts)', () => {
    expect(qk.accounts({ kind: 'cash' })).toEqual(['accounts', { kind: 'cash' }]);
  });

  it('account(id)', () => {
    expect(qk.account('a1')).toEqual(['account', 'a1']);
  });

  it('accountLedger(id)', () => {
    expect(qk.accountLedger('a1')).toEqual(['account-ledger', 'a1']);
  });

  it('categories(null) usa "none"', () => {
    expect(qk.categories(null)).toEqual(['categories', 'none']);
  });

  it('categories(periodId) usa el id', () => {
    expect(qk.categories('per-1')).toEqual(['categories', 'per-1']);
  });

  it('category(id)', () => {
    expect(qk.category('c1')).toEqual(['category', 'c1']);
  });

  it('categoryLedger(id)', () => {
    expect(qk.categoryLedger('c1')).toEqual(['category-ledger', 'c1']);
  });

  it('incomeSources()', () => {
    expect(qk.incomeSources()).toEqual(['income-sources']);
  });

  it('periods(null) usa "all"', () => {
    expect(qk.periods(null)).toEqual(['periods', 'all']);
  });

  it('periods(status) usa el status', () => {
    expect(qk.periods('open')).toEqual(['periods', 'open']);
  });

  it('openPeriods() es la misma familia que periods("open")', () => {
    expect(qk.openPeriods()).toEqual(['periods', 'open']);
  });

  it('allocations(periodId)', () => {
    expect(qk.allocations('per-1')).toEqual(['allocations', 'per-1']);
  });

  it('closePreview(periodId)', () => {
    expect(qk.closePreview('per-1')).toEqual(['close-preview', 'per-1']);
  });

  it('transactions(filters)', () => {
    expect(qk.transactions({ accountId: 'a1' })).toEqual(['transactions', { accountId: 'a1' }]);
  });

  it('transaction(id)', () => {
    expect(qk.transaction('t1')).toEqual(['transaction', 't1']);
  });

  it('recurringTemplates(opts)', () => {
    expect(qk.recurringTemplates({ dueOnly: true })).toEqual([
      'recurring-templates',
      { dueOnly: true },
    ]);
  });

  it('unassignedFunds()', () => {
    expect(qk.unassignedFunds()).toEqual(['unassigned-funds']);
  });
});

describe('qk — estabilidad', () => {
  it('la misma entrada produce siempre la misma key', () => {
    expect(qk.dashboard('per-1')).toEqual(qk.dashboard('per-1'));
    expect(qk.transactions({ accountId: 'a1' })).toEqual(qk.transactions({ accountId: 'a1' }));
  });

  it('entradas distintas producen keys distintas', () => {
    expect(qk.dashboard('per-1')).not.toEqual(qk.dashboard('per-2'));
    expect(qk.category('c1')).not.toEqual(qk.categoryLedger('c1'));
  });
});

describe('qk — ninguna key contiene un cursor', () => {
  it('las keys de listas paginadas por cursor no incluyen valores de cursor', () => {
    const keysToCheck = [
      qk.transactions({ accountId: 'a1' }),
      qk.accountLedger('a1'),
      qk.categoryLedger('c1'),
    ];

    for (const key of keysToCheck) {
      expect(JSON.stringify(key).toLowerCase()).not.toContain('cursor');
    }
  });
});
