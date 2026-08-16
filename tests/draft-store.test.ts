import { describe, expect, it } from 'vitest';
import {
  clearDraft,
  draftStorageKey,
  loadDraft,
  openDraft,
  updateDraft,
} from '@/features/capture/stores/draft-store';
import { createFakeStorage } from './helpers/fake-storage';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('draftStorageKey', () => {
  it('sigue la convención draft:<intención> (ARCHITECTURE-front.md §7)', () => {
    expect(draftStorageKey('expense')).toBe('draft:expense');
    expect(draftStorageKey('income')).toBe('draft:income');
  });
});

describe('ciclo del borrador', () => {
  it('abrir un formulario sin borrador previo genera una llave UUID v4 y guarda los valores', () => {
    const storage = createFakeStorage();
    const draft = openDraft('expense', { amount: '100' }, storage);

    expect(draft.idempotencyKey).toMatch(UUID_V4);
    expect(draft.values).toEqual({ amount: '100' });
  });

  it('el borrador creado se puede leer de vuelta con loadDraft', () => {
    const storage = createFakeStorage();
    const created = openDraft('expense', { amount: '100' }, storage);
    const loaded = loadDraft('expense', storage);

    expect(loaded).toEqual(created);
  });

  it('sin borrador previo, loadDraft devuelve null', () => {
    const storage = createFakeStorage();
    expect(loadDraft('expense', storage)).toBeNull();
  });

  it('updateDraft conserva la llave y actualiza los valores', () => {
    const storage = createFakeStorage();
    const created = openDraft('expense', { amount: '100' }, storage);
    const updated = updateDraft('expense', { amount: '250' }, storage);

    expect(updated.idempotencyKey).toBe(created.idempotencyKey);
    expect(updated.values).toEqual({ amount: '250' });
    expect(loadDraft('expense', storage)).toEqual(updated);
  });

  it('clearDraft borra el borrador; después, abrir de nuevo genera una llave distinta', () => {
    const storage = createFakeStorage();
    const first = openDraft('expense', { amount: '100' }, storage);

    clearDraft('expense', storage);
    expect(loadDraft('expense', storage)).toBeNull();

    const second = openDraft('expense', { amount: '0' }, storage);
    expect(second.idempotencyKey).not.toBe(first.idempotencyKey);
  });

  it('un borrador de una intención no afecta el de otra', () => {
    const storage = createFakeStorage();
    const expense = openDraft('expense', { amount: '100' }, storage);
    const income = openDraft('income', { amount: '500' }, storage);

    expect(expense.idempotencyKey).not.toBe(income.idempotencyKey);
    expect(loadDraft('expense', storage)).toEqual(expense);
    expect(loadDraft('income', storage)).toEqual(income);
  });
});
