/**
 * STUB — sesión de tests. La implementación real (U8a, TASK-front.md) todavía no existe.
 * Lógica pura, cero I/O, cero llamadas a Supabase. Firmas fijadas en TASK-front.md §6.1.
 */

export type SessionState = 'none' | 'valid' | 'expired';
export type SessionAction = 'allow' | 'refresh' | 'redirect-login';

export function readSessionState(cookies: ReadonlyMap<string, string>, now: Date): SessionState {
  throw new Error('readSessionState: not implemented');
}

export function sessionActionFor(state: SessionState, pathname: string): SessionAction {
  throw new Error('sessionActionFor: not implemented');
}
