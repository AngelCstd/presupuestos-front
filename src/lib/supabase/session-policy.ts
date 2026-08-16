/**
 * Lógica pura, cero llamadas a Supabase, cero I/O. Decide qué hacer dado el estado de
 * las cookies; el adaptador (U8b, sin tests) es el único que ejecuta lo que esto decide.
 */

export type SessionState = 'none' | 'valid' | 'expired';
export type SessionAction = 'allow' | 'refresh' | 'redirect-login';

// Convención de esta capa: el adaptador de Supabase (U8b) es quien escribe esta cookie
// con `expiresAt` en ISO 8601. El nombre y la forma exacta no están en el contrato ni
// en la arquitectura — están documentados como inferencia de la sesión de tests en
// PROGRESS.md, junto con el archivo que la fija: tests/session-policy.test.ts.
const SESSION_COOKIE_NAME = 'sb-session';

const PUBLIC_ROUTES = new Set(['/login']);

export function readSessionState(cookies: ReadonlyMap<string, string>, now: Date): SessionState {
  const raw = cookies.get(SESSION_COOKIE_NAME);
  if (raw === undefined) return 'none';

  let expiresAt: string | undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && 'expiresAt' in parsed) {
      const value = (parsed as { expiresAt: unknown }).expiresAt;
      if (typeof value === 'string') expiresAt = value;
    }
  } catch {
    return 'none';
  }

  if (expiresAt === undefined) return 'none';

  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return 'none';

  return expiry.getTime() > now.getTime() ? 'valid' : 'expired';
}

export function sessionActionFor(state: SessionState, pathname: string): SessionAction {
  if (state === 'valid') return 'allow';
  if (state === 'expired') return 'refresh';

  // state === 'none'
  return PUBLIC_ROUTES.has(pathname) ? 'allow' : 'redirect-login';
}
