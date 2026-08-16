/**
 * Funciones puras sobre un `DraftStorage` inyectable (misma forma que `Storage` del
 * DOM), para no acoplar la lógica de idempotencia a `sessionStorage` real. El
 * implementador de `useDraft` (el hook de React) las envuelve con Zustand + `persist`
 * sobre `sessionStorage` real — nunca `localStorage` (ARCHITECTURE-front.md §7): un
 * borrador de hace tres días trae una llave de idempotencia inútil.
 *
 * Regla central (ARCHITECTURE-front.md §6): una llave por INTENCIÓN del usuario, no por
 * intento HTTP. Se genera una vez al abrir el formulario, se reusa en cada reintento, y
 * se borra solo con un 2xx.
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
  return `draft:${intent}`;
}

export function loadDraft<T>(intent: string, storage: DraftStorage): Draft<T> | null {
  const raw = storage.getItem(draftStorageKey(intent));
  if (raw === null) return null;

  try {
    return JSON.parse(raw) as Draft<T>;
  } catch {
    return null;
  }
}

function persistDraft<T>(intent: string, draft: Draft<T>, storage: DraftStorage): Draft<T> {
  storage.setItem(draftStorageKey(intent), JSON.stringify(draft));
  return draft;
}

export function openDraft<T>(intent: string, initialValues: T, storage: DraftStorage): Draft<T> {
  // Si ya hay un borrador vigente, se reusa tal cual — su llave y sus valores, no los
  // que trae el formulario en blanco que se está abriendo (TASK-front.md U12: "se reusa
  // la llave que traía, no una nueva").
  const existing = loadDraft<T>(intent, storage);
  if (existing !== null) return existing;

  const draft: Draft<T> = {
    idempotencyKey: crypto.randomUUID(),
    values: initialValues,
    savedAt: new Date().toISOString(),
  };
  return persistDraft(intent, draft, storage);
}

export function updateDraft<T>(intent: string, values: T, storage: DraftStorage): Draft<T> {
  const existing = loadDraft<T>(intent, storage);
  const draft: Draft<T> = {
    idempotencyKey: existing?.idempotencyKey ?? crypto.randomUUID(),
    values,
    savedAt: new Date().toISOString(),
  };
  return persistDraft(intent, draft, storage);
}

export function clearDraft(intent: string, storage: DraftStorage): void {
  storage.removeItem(draftStorageKey(intent));
}
