import type { ApiErrorBody, HttpMethod } from '@/types/api';

/**
 * Todo reenvío garantiza JSON válido (ARCHITECTURE-front.md §4.2): un 502 de un proxy
 * intermedio llega como HTML, un timeout llega como cuerpo vacío — ninguno de los dos
 * es JSON parseable, y ninguno debe reventar como excepción sin forma en el cliente.
 * Absorbe `IDEMPOTENCY_IN_FLIGHT` reintentando con la misma llave hasta 3 veces
 * (API-CONTRACT.md §5.2) — el usuario nunca ve ese código.
 */

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export function contractError(statusCode: number, code: string, path: string): ApiErrorBody {
  return {
    statusCode,
    code,
    message: 'La API no devolvió una respuesta válida.',
    timestamp: new Date().toISOString(),
    path,
  };
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

function buildOutgoingHeaders(params: ForwardParams): Headers {
  const headers = new Headers();
  headers.set('authorization', `Bearer ${params.accessToken}`);

  const contentType = params.headers?.['content-type'];
  if (contentType) headers.set('content-type', contentType);

  if (params.idempotencyKey) headers.set('idempotency-key', params.idempotencyKey);

  return headers;
}

function isInFlightError(status: number, body: unknown): boolean {
  return (
    status === 409 &&
    typeof body === 'object' &&
    body !== null &&
    (body as { code?: string }).code === 'IDEMPOTENCY_IN_FLIGHT'
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function forwardToApi(
  params: ForwardParams,
  fetchImpl: typeof fetch = fetch,
): Promise<{ status: number; body: unknown }> {
  const url = `${process.env.API_BASE_URL ?? ''}${params.path}`;
  const outgoingHeaders = buildOutgoingHeaders(params);

  for (let attempt = 1; ; attempt += 1) {
    const upstream = await fetchImpl(url, {
      method: params.method,
      headers: outgoingHeaders,
      body: params.body !== undefined ? JSON.stringify(params.body) : undefined,
    });

    let body: unknown;
    try {
      body = await upstream.json();
    } catch {
      return { status: 500, body: contractError(500, 'INTERNAL_ERROR', params.path) };
    }

    if (isInFlightError(upstream.status, body) && attempt <= MAX_RETRIES) {
      await delay(RETRY_DELAY_MS);
      continue;
    }

    return { status: upstream.status, body };
  }
}
