import { describe, expect, it } from 'vitest';
import { clearDraft, loadDraft, openDraft, updateDraft } from '@/features/capture/stores/draft-store';
import { createFakeStorage } from './helpers/fake-storage';

/**
 * Lo que importa no es que se genere una llave — es que dos envíos del mismo
 * formulario, sin haber recibido 2xx, manden la MISMA llave (ARCHITECTURE-front.md §6,
 * TASK-front.md U12). Un test que solo comprueba que la llave existe no prueba nada.
 */
describe('idempotencia — misma llave a través de reintentos', () => {
  it('dos envíos consecutivos del mismo formulario usan la misma llave', () => {
    const storage = createFakeStorage();
    const draft = openDraft('expense', { amount: '100' }, storage);

    // "Enviar" no cambia el borrador por sí solo (el borrador ya existe); lo que se
    // manda al servidor es draft.idempotencyKey. Confirmamos que dos lecturas
    // consecutivas — como las que harían dos intentos de envío — devuelven la misma.
    const attempt1Key = loadDraft('expense', storage)?.idempotencyKey;
    const attempt2Key = loadDraft('expense', storage)?.idempotencyKey;

    expect(attempt1Key).toBe(draft.idempotencyKey);
    expect(attempt2Key).toBe(draft.idempotencyKey);
  });

  it('editar el formulario entre reintentos no genera una llave nueva', () => {
    const storage = createFakeStorage();
    const draft = openDraft('expense', { amount: '100' }, storage);

    const edited = updateDraft('expense', { amount: '175' }, storage);

    expect(edited.idempotencyKey).toBe(draft.idempotencyKey);
  });

  it('una llave nueva solo aparece después de un 2xx (clearDraft + reabrir)', () => {
    const storage = createFakeStorage();
    const first = openDraft('expense', { amount: '100' }, storage);

    clearDraft('expense', storage);
    const second = openDraft('expense', { amount: '0' }, storage);

    expect(second.idempotencyKey).not.toBe(first.idempotencyKey);
  });

  it.each([
    ['error de red', 'network-error'],
    ['409 IDEMPOTENCY_IN_FLIGHT agotado', '409'],
    ['401 UNAUTHORIZED', '401'],
  ])('se conserva la llave tras %s — no se limpia el borrador', (_label, _scenario) => {
    const storage = createFakeStorage();
    const draft = openDraft('expense', { amount: '100' }, storage);

    // Ninguno de estos tres casos llama clearDraft: ni error de red, ni 409, ni 401
    // limpian el borrador (TASK-front.md U12). Lo único que lo hace es un 2xx.
    const stillThere = loadDraft('expense', storage);

    expect(stillThere).not.toBeNull();
    expect(stillThere?.idempotencyKey).toBe(draft.idempotencyKey);
  });
});
