import { describe, expect, it } from 'vitest';
import { readSessionState, sessionActionFor } from '@/lib/supabase/session-policy';

/**
 * `readSessionState` recibe el cookie jar crudo (`ReadonlyMap<string, string>`), pero el
 * nombre exacto de la cookie de Supabase y su forma interna no están documentados en
 * ningún archivo fuente (son propiedad de U8b, el adaptador). Esta suite modela la cookie
 * como `sb-session` con un JSON `{ expiresAt: <ISO 8601> }` — es una convención de prueba,
 * no una forma fijada; anotado en PROGRESS.md. Si el implementador de U8b usa otro nombre
 * o formato, este archivo de test NO se toca (regla dura) — se pregunta antes.
 */
const SESSION_COOKIE_NAME = 'sb-session';

function cookiesWithExpiry(expiresAt: string): ReadonlyMap<string, string> {
  return new Map([[SESSION_COOKIE_NAME, JSON.stringify({ expiresAt })]]);
}

function noCookies(): ReadonlyMap<string, string> {
  return new Map();
}

function malformedCookies(): ReadonlyMap<string, string> {
  return new Map([[SESSION_COOKIE_NAME, 'esto no es JSON {{{']]);
}

describe('readSessionState', () => {
  const now = new Date('2026-08-15T12:00:00Z');

  it('sin cookie de sesión devuelve "none"', () => {
    expect(readSessionState(noCookies(), now)).toBe('none');
  });

  it('cookie con expiresAt posterior a now devuelve "valid"', () => {
    const future = new Date(now.getTime() + 60_000).toISOString();
    expect(readSessionState(cookiesWithExpiry(future), now)).toBe('valid');
  });

  it('cookie con expiresAt anterior a now devuelve "expired"', () => {
    const past = new Date(now.getTime() - 60_000).toISOString();
    expect(readSessionState(cookiesWithExpiry(past), now)).toBe('expired');
  });

  it('cookie con expiresAt exactamente igual a now devuelve "expired"', () => {
    expect(readSessionState(cookiesWithExpiry(now.toISOString()), now)).toBe('expired');
  });

  it('cookie malformada o no parseable devuelve "none", nunca lanza', () => {
    expect(() => readSessionState(malformedCookies(), now)).not.toThrow();
    expect(readSessionState(malformedCookies(), now)).toBe('none');
  });
});

describe('sessionActionFor', () => {
  it('"none" en una ruta protegida devuelve "redirect-login"', () => {
    expect(sessionActionFor('none', '/sobres')).toBe('redirect-login');
  });

  it('"none" en /login (ruta pública) devuelve "allow"', () => {
    expect(sessionActionFor('none', '/login')).toBe('allow');
  });

  it('"expired" en cualquier ruta protegida devuelve "refresh", no "redirect-login"', () => {
    expect(sessionActionFor('expired', '/sobres')).toBe('refresh');
    expect(sessionActionFor('expired', '/capturar/gasto')).toBe('refresh');
  });

  it('"valid" siempre devuelve "allow"', () => {
    expect(sessionActionFor('valid', '/sobres')).toBe('allow');
    expect(sessionActionFor('valid', '/login')).toBe('allow');
  });
});
