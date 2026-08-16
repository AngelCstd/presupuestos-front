import type { HttpMethod } from '@/types/api';

/**
 * STUB — sesión de tests. La implementación real (U7, TASK-front.md) todavía no existe.
 * Firma agregada a TASK-front.md §6.1 por esta sesión (ver PROGRESS.md): U7 no traía
 * un nombre fijado para el cliente HTTP. `fetchImpl` es inyectable para poder testear
 * sin red real.
 */

export interface ApiRequestParams {
  method: HttpMethod;
  path: string;
  body?: unknown;
  accessToken: string;
  idempotencyKey?: string;
}

export async function apiRequest<T>(
  params: ApiRequestParams,
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  throw new Error('apiRequest: not implemented');
}
