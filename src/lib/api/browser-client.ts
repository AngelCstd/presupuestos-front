'use client';

import { ApiError } from '@/lib/api/errors';
import type { ApiErrorBody, HttpMethod } from '@/types/api';

/**
 * El único punto desde el que el navegador habla con datos: siempre `/api/bff/*`,
 * nunca la API real directo (ARCHITECTURE-front.md §1, §3 — el `access_token` nunca
 * cruza al cliente). Lo usan los hooks de feature (useQuery/useMutation), no los
 * Server Components — esos usan `lib/api/client.ts` / `lib/api/server-api.ts` directo.
 */
export interface BffFetchParams {
  method?: HttpMethod;
  path: string;
  body?: unknown;
  idempotencyKey?: string;
}

export async function bffFetch<T>({ method = 'GET', path, body, idempotencyKey }: BffFetchParams): Promise<T> {
  const headers = new Headers();
  if (body !== undefined) headers.set('content-type', 'application/json');
  if (idempotencyKey) headers.set('idempotency-key', idempotencyKey);

  const response = await fetch(`/api/bff${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return null as T;
  }

  const data: unknown = await response.json();

  if (response.status >= 200 && response.status < 300) {
    return data as T;
  }

  const errorBody = data as ApiErrorBody;
  throw new ApiError(errorBody.code, errorBody.statusCode, errorBody.details);
}
