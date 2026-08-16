import { describe, expect, it } from 'vitest';
import { isAllowedRoute, type AllowedRoute } from '@/lib/bff/allowlist';

const TABLE: readonly AllowedRoute[] = [
  { method: 'GET', pattern: '/me' },
  { method: 'GET', pattern: '/accounts' },
  { method: 'POST', pattern: '/accounts' },
  { method: 'GET', pattern: '/accounts/:id' },
  { method: 'GET', pattern: '/accounts/:id/ledger' },
];

describe('isAllowedRoute', () => {
  it('una ruta y método presentes en la tabla casan', () => {
    expect(isAllowedRoute('GET', '/me', TABLE)).toBe(true);
    expect(isAllowedRoute('POST', '/accounts', TABLE)).toBe(true);
  });

  it('una ruta ausente de la tabla no casa', () => {
    expect(isAllowedRoute('GET', '/algo-que-no-existe', TABLE)).toBe(false);
  });

  it(':id casa un segmento — /accounts/abc casa /accounts/:id', () => {
    expect(isAllowedRoute('GET', '/accounts/abc', TABLE)).toBe(true);
  });

  it(':id NO cruza / — /accounts/abc/def no casa /accounts/:id', () => {
    expect(isAllowedRoute('GET', '/accounts/abc/def', TABLE)).toBe(false);
  });

  it('/accounts/abc/def sí casa /accounts/:id/ledger cuando el segmento final coincide', () => {
    expect(isAllowedRoute('GET', '/accounts/abc/ledger', TABLE)).toBe(true);
  });

  it('un método no registrado para esa ruta no casa, aunque el path exista', () => {
    expect(isAllowedRoute('DELETE', '/accounts', TABLE)).toBe(false);
    expect(isAllowedRoute('DELETE', '/me', TABLE)).toBe(false);
  });

  it('sin tabla explícita, usa el ALLOWLIST real por default', () => {
    expect(() => isAllowedRoute('GET', '/me')).not.toThrow();
  });
});
