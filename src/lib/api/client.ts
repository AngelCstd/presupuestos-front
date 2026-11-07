import { ApiError } from '@/lib/api/errors';
import type { ApiErrorBody, HttpMethod } from '@/types/api';

/**
 * Solo corre en servidor (ARCHITECTURE-front.md §3): lo llaman los Server Components
 * directo, y los Route Handlers también. Adjunta el JWT, normaliza cualquier respuesta
 * no-2xx a `ApiError`, y absorbe `IDEMPOTENCY_IN_FLIGHT` reintentando con la misma
 * llave hasta 3 veces (API-CONTRACT.md §5.2, TASK-front.md U7) — el mismo mecanismo que
 * `lib/bff/forward.ts` usa para los handlers dedicados.
 */

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export interface ApiRequestParams {
  method: HttpMethod;
  path: string;
  body?: unknown;
  accessToken: string;
  idempotencyKey?: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isInFlightError(status: number, body: unknown): boolean {
  return (
    status === 409 &&
    typeof body === 'object' &&
    body !== null &&
    (body as { code?: string }).code === 'IDEMPOTENCY_IN_FLIGHT'
  );
}

export async function apiRequest<T>(
  params: ApiRequestParams,
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const baseUrl = process.env.API_BASE_URL ?? '';
  const url = `${baseUrl}${params.path}`;
  console.log(`[API REQUEST] ${params.method} -> ${url}`);

  const headers = new Headers();
  headers.set('authorization', `Bearer ${params.accessToken}`);
  if (params.body !== undefined) headers.set('content-type', 'application/json');
  if (params.idempotencyKey) headers.set('idempotency-key', params.idempotencyKey);

  for (let attempt = 1; ; attempt += 1) {
    let response: Response;
    try {
      response = await fetchImpl(url, {
        method: params.method,
        headers,
        body: params.body !== undefined ? JSON.stringify(params.body) : undefined,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[API NETWORK ERROR] Failed fetching ${url}:`, message);
      throw new ApiError('NETWORK_ERROR', 500, [{ field: 'network', constraint: message }]);
    }

    console.log(`[API RESPONSE] Status ${response.status} from ${url}`);

    // 204 No Content (p.ej. DELETE /periods/{id}/allocations/{allocationId},
    // API-CONTRACT.md §12.2) no tiene cuerpo por diseño — nunca se le pide `.json()`.
    if (response.status === 204) {
      return null as T;
    }

    const body: unknown = await response.json().catch(async () => {
      const text = await response.text().catch(() => '');
      return { code: 'PARSE_ERROR', statusCode: response.status, details: text };
    });

    if (isInFlightError(response.status, body) && attempt <= MAX_RETRIES) {
      console.warn(`[API IN FLIGHT] Retrying ${url} (attempt ${attempt})`);
      await delay(RETRY_DELAY_MS);
      continue;
    }

    if (response.status >= 200 && response.status < 300) {
      return body as T;
    }

    console.error(`[API ERROR BODY] Status ${response.status} from ${url}:`, JSON.stringify(body));
    const errorBody = body as ApiErrorBody;
    throw new ApiError(errorBody.code, errorBody.statusCode, errorBody.details);
  }
}
