import { describe, expect, it } from 'vitest';
import { loadDraft, openDraft, updateDraft } from '@/features/capture/stores/draft-store';
import { createFakeStorage } from './helpers/fake-storage';

/**
 * El 401 remonta el componente (redirige a /login?next=... y vuelve). El borrador ya
 * vive en sessionStorage antes de que eso pase (ARCHITECTURE-front.md §7), así que la
 * recuperación es que reabrir el formulario rehidrate exactamente lo que había.
 */
describe('recuperación tras 401 — el borrador se rehidrata intacto', () => {
  it('valores y llave sobreviven a un remount simulado (401 + re-login)', () => {
    const storage = createFakeStorage();

    // El usuario llena el formulario.
    const original = openDraft('expense', { amount: '100', description: 'Súper' }, storage);
    const beforeUnauthorized = updateDraft(
      'expense',
      { amount: '250', description: 'Súper de la quincena' },
      storage,
    );

    // 401: el componente se desmonta, redirige a /login, y vuelve. El borrador NO se
    // tocó — no hubo clearDraft — así que sigue en el storage inyectado.

    // El usuario vuelve a /capturar/gasto: el formulario se reabre. openDraft con
    // valores por default NO debe pisar lo que ya había, porque hay un borrador vigente.
    const rehydrated = openDraft(
      'expense',
      { amount: '0', description: '' }, // valores por default de un formulario en blanco
      storage,
    );

    expect(rehydrated.idempotencyKey).toBe(original.idempotencyKey);
    expect(rehydrated.idempotencyKey).toBe(beforeUnauthorized.idempotencyKey);
    expect(rehydrated.values).toEqual({ amount: '250', description: 'Súper de la quincena' });
  });

  it('loadDraft después de la recuperación devuelve los mismos valores que antes del 401', () => {
    const storage = createFakeStorage();
    const original = openDraft('expense', { amount: '100' }, storage);
    updateDraft('expense', { amount: '250' }, storage);

    // Simula el remount: nada llama a clearDraft entre el 401 y el re-login.
    const afterRelogin = loadDraft('expense', storage);

    expect(afterRelogin?.idempotencyKey).toBe(original.idempotencyKey);
    expect(afterRelogin?.values).toEqual({ amount: '250' });
  });
});
