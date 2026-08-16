import type { ApiErrorBody, HttpMethod } from '@/types/api';

/**
 * STUB — sesión de tests. La implementación real (U9, TASK-front.md) todavía no existe.
 * `contractError` ya aparecía nombrada en ARCHITECTURE-front.md §4.2; `forwardToApi` es
 * una firma agregada por esta sesión (ver PROGRESS.md). `fetchImpl` inyectable para
 * testear sin red real.
 */

export function contractError(statusCode: number, code: string, path: string): ApiErrorBody {
  throw new Error('contractError: not implemented');
}

export interface ForwardParams {
  method: HttpMethod;
  path: string;
  body?: unknown;
  accessToken: string;
  idempotencyKey?: string;
  /** Headers crudos del navegador. Solo `content-type` sobrevive al reenvío. */
  headers?: Record<string, string>;
}

export async function forwardToApi(
  params: ForwardParams,
  fetchImpl: typeof fetch = fetch,
): Promise<{ status: number; body: unknown }> {
  throw new Error('forwardToApi: not implemented');
}
