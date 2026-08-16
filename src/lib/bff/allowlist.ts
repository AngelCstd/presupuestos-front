import type { HttpMethod } from '@/types/api';

/**
 * STUB — sesión de tests. La implementación real (U9, TASK-front.md) todavía no existe.
 * `AllowedRoute` y `ALLOWLIST` son formas fijadas (TASK §6.2); `isAllowedRoute` es una
 * firma agregada por esta sesión (ver PROGRESS.md) porque U9 no traía nombre para el
 * matching. `ALLOWLIST` se deja vacío a propósito: su contenido real (una fila por
 * operación del contrato) es trabajo del implementador, no de esta sesión.
 */

export interface AllowedRoute {
  method: HttpMethod;
  pattern: string;
}

export const ALLOWLIST: readonly AllowedRoute[] = [];

export function isAllowedRoute(
  method: HttpMethod,
  path: string,
  table: readonly AllowedRoute[] = ALLOWLIST,
): boolean {
  throw new Error('isAllowedRoute: not implemented');
}
