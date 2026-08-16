/**
 * STUB — sesión de tests. La implementación real (U12, TASK-front.md) todavía no existe.
 *
 * `Draft<T>` está en ARCHITECTURE-front.md §7, pero U12 no fija firmas de función
 * (§6.1 de TASK-front.md no lo cubre). Esta sesión propone las funciones puras de abajo
 * — documentado en PROGRESS.md — para poder testear el ciclo de la llave de idempotencia
 * sin sessionStorage real: `DraftStorage` es la misma forma que `Storage` del DOM
 * (getItem/setItem/removeItem), inyectable, para no depender de jsdom.
 *
 * `useDraft` (el hook de React mencionado en TASK-front.md U12) se deja fuera de esta
 * sesión: ningún test lo ejercita directamente — todos prueban estas funciones puras —
 * y es responsabilidad del implementador envolverlas en Zustand + `persist`.
 */

export interface Draft<T = unknown> {
  idempotencyKey: string;
  values: T;
  savedAt: string;
}

export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function draftStorageKey(intent: string): string {
  throw new Error('draftStorageKey: not implemented');
}

export function loadDraft<T>(intent: string, storage: DraftStorage): Draft<T> | null {
  throw new Error('loadDraft: not implemented');
}

export function openDraft<T>(intent: string, initialValues: T, storage: DraftStorage): Draft<T> {
  throw new Error('openDraft: not implemented');
}

export function updateDraft<T>(intent: string, values: T, storage: DraftStorage): Draft<T> {
  throw new Error('updateDraft: not implemented');
}

export function clearDraft(intent: string, storage: DraftStorage): void {
  throw new Error('clearDraft: not implemented');
}
