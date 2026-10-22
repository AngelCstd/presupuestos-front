import type { HttpMethod } from '@/types/api';

/**
 * Catch-all con allowlist (ARCHITECTURE-front.md §4.1). Todo lo que NO esté aquí
 * devuelve 404 sin tocar la API. Los 9 endpoints idempotentes de §5 del contrato
 * (transacciones, opening-balances, reversal, confirm) NO van aquí — tienen handler
 * dedicado (ARCHITECTURE §4.3), porque necesitan validación Zod y el reintento de
 * IDEMPOTENCY_IN_FLIGHT que el catch-all no debe cargar.
 */

export interface AllowedRoute {
  method: HttpMethod;
  pattern: string;
}

export const ALLOWLIST: readonly AllowedRoute[] = [
  { method: 'GET', pattern: '/me' },
  { method: 'PATCH', pattern: '/me' },

  { method: 'GET', pattern: '/accounts' },
  { method: 'POST', pattern: '/accounts' },
  { method: 'GET', pattern: '/accounts/:id' },
  { method: 'PATCH', pattern: '/accounts/:id' },
  { method: 'POST', pattern: '/accounts/:id/archive' },
  { method: 'POST', pattern: '/accounts/:id/unarchive' },
  { method: 'GET', pattern: '/accounts/:id/ledger' },

  { method: 'GET', pattern: '/categories' },
  { method: 'POST', pattern: '/categories' },
  // No hay GET /categories/:id en el contrato — solo la lista, PATCH, archive/
  // unarchive y el ledger. Encontrado y corregido en U17 (2026-08-16, PROGRESS.md):
  // esta ruta estaba aquí sin base, inventada al construir U9.
  { method: 'PATCH', pattern: '/categories/:id' },
  { method: 'POST', pattern: '/categories/:id/archive' },
  { method: 'POST', pattern: '/categories/:id/unarchive' },
  { method: 'GET', pattern: '/categories/:id/ledger' },

  { method: 'GET', pattern: '/income-sources' },
  { method: 'POST', pattern: '/income-sources' },
  { method: 'GET', pattern: '/income-sources/:id' },
  { method: 'PATCH', pattern: '/income-sources/:id' },
  { method: 'POST', pattern: '/income-sources/:id/archive' },
  { method: 'POST', pattern: '/income-sources/:id/unarchive' },

  { method: 'GET', pattern: '/transactions' },
  { method: 'GET', pattern: '/transactions/:id' },
  { method: 'PATCH', pattern: '/transactions/:id' },

  { method: 'GET', pattern: '/periods' },
  { method: 'GET', pattern: '/periods/current' },
  { method: 'POST', pattern: '/periods' },
  { method: 'PATCH', pattern: '/periods/:id' },
  { method: 'DELETE', pattern: '/periods/:id' },
  { method: 'GET', pattern: '/periods/:id/close-preview' },
  { method: 'POST', pattern: '/periods/:id/close' },
  { method: 'GET', pattern: '/periods/:id/allocations' },
  { method: 'POST', pattern: '/periods/:id/allocations' },
  { method: 'PUT', pattern: '/periods/:id/allocations/:categoryId' },
  { method: 'POST', pattern: '/periods/:id/allocations/move' },
  { method: 'DELETE', pattern: '/periods/:id/allocations/:allocationId' },

  { method: 'GET', pattern: '/recurring-templates' },
  { method: 'POST', pattern: '/recurring-templates' },
  { method: 'PATCH', pattern: '/recurring-templates/:id' },
  { method: 'DELETE', pattern: '/recurring-templates/:id' },

  { method: 'GET', pattern: '/insights/account-balances' },
  { method: 'GET', pattern: '/insights/category-balances' },
  { method: 'GET', pattern: '/insights/unassigned-funds' },
  { method: 'GET', pattern: '/insights/unbudgeted-transactions' },
  { method: 'GET', pattern: '/insights/dashboard' },
] as const;

function matchesPattern(pattern: string, path: string): boolean {
  const patternSegments = pattern.split('/').filter(Boolean);
  const pathSegments = path.split('/').filter(Boolean);

  if (patternSegments.length !== pathSegments.length) return false;

  return patternSegments.every((segment, i) => segment.startsWith(':') || segment === pathSegments[i]);
}

export function isAllowedRoute(
  method: HttpMethod,
  path: string,
  table: readonly AllowedRoute[] = ALLOWLIST,
): boolean {
  return table.some((route) => route.method === method && matchesPattern(route.pattern, path));
}
