import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { contractError, forwardToApi } from '@/lib/bff/forward';

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function inFlightResponse(): Response {
  return jsonResponse(409, {
    statusCode: 409,
    code: 'IDEMPOTENCY_IN_FLIGHT',
    message: 'La escritura con esa llave sigue en vuelo.',
    timestamp: new Date().toISOString(),
    path: '/transactions/expenses',
  });
}

describe('contractError', () => {
  it('produce la forma de error del contrato (API-CONTRACT.md §7.1)', () => {
    const error = contractError(500, 'INTERNAL_ERROR', '/api/v1/periods');

    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.path).toBe('/api/v1/periods');
    expect(error.message).toBeTruthy();
    expect(() => new Date(error.timestamp).toISOString()).not.toThrow();
  });
});

describe('forwardToApi — toda respuesta del BFF es JSON válido, siempre', () => {
  it('un cuerpo HTML (ej. un 502 de un proxy intermedio) se convierte en 500 INTERNAL_ERROR', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response('<html><body>502 Bad Gateway</body></html>', {
          status: 502,
          headers: { 'content-type': 'text/html' },
        }),
      );

    const result = await forwardToApi(
      { method: 'GET', path: '/me', accessToken: 'token-123' },
      fetchImpl as unknown as typeof fetch,
    );

    expect(result.status).toBe(500);
    expect((result.body as { code: string }).code).toBe('INTERNAL_ERROR');
  });

  it('un cuerpo vacío (ej. timeout) también se convierte en 500 INTERNAL_ERROR', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('', { status: 200 }));

    const result = await forwardToApi(
      { method: 'GET', path: '/me', accessToken: 'token-123' },
      fetchImpl as unknown as typeof fetch,
    );

    expect(result.status).toBe(500);
    expect((result.body as { code: string }).code).toBe('INTERNAL_ERROR');
  });
});

describe('forwardToApi — solo se reenvían content-type e idempotency-key', () => {
  it('cookie, x-forwarded-for y user-agent del navegador nunca llegan a la API real', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));

    await forwardToApi(
      {
        method: 'POST',
        path: '/transactions/expenses',
        accessToken: 'token-123',
        idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
        headers: {
          'content-type': 'application/json',
          cookie: 'sb-session=secreto',
          'x-forwarded-for': '1.2.3.4',
          'user-agent': 'curioso/1.0',
        },
      },
      fetchImpl as unknown as typeof fetch,
    );

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const call = fetchImpl.mock.calls[0] as [string, RequestInit];
    const sentHeaders = new Headers(call[1]?.headers);

    expect(sentHeaders.get('content-type')).toBe('application/json');
    expect(sentHeaders.get('idempotency-key')).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(sentHeaders.get('cookie')).toBeNull();
    expect(sentHeaders.get('x-forwarded-for')).toBeNull();
    expect(sentHeaders.get('user-agent')).toBeNull();
  });
});

describe('forwardToApi — IDEMPOTENCY_IN_FLIGHT se reintenta hasta 3 veces', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('tres 409 IN_FLIGHT seguidos de un 200 se resuelven sin que el error suba', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(inFlightResponse())
      .mockResolvedValueOnce(inFlightResponse())
      .mockResolvedValueOnce(inFlightResponse())
      .mockResolvedValueOnce(jsonResponse(200, { id: 'tx-1' }));

    const resultPromise = forwardToApi(
      {
        method: 'POST',
        path: '/transactions/expenses',
        accessToken: 'token-123',
        idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
      },
      fetchImpl as unknown as typeof fetch,
    );
    // Evita el ruido de "unhandled rejection" mientras avanzamos el reloj falso: el
    // resultado real se sigue esperando (y fallando si corresponde) más abajo.
    resultPromise.catch(() => {});

    await vi.advanceTimersByTimeAsync(3000);

    const result = await resultPromise;

    expect(fetchImpl).toHaveBeenCalledTimes(4);
    expect(result.status).toBe(200);
  });

  it('un cuarto 409 IN_FLIGHT consecutivo sí sube', async () => {
    // mockImplementation, no mockResolvedValue: cada llamada necesita su propio
    // Response — el body de un Response solo se puede leer una vez, y las 4 llamadas
    // sí leen su body (igual que pasaría contra un fetch real). Corregido durante el
    // loop de implementación (2026-08-16): era un bug del mock, no de forwardToApi.
    // Ver PROGRESS.md.
    const fetchImpl = vi.fn().mockImplementation(() => Promise.resolve(inFlightResponse()));

    const resultPromise = forwardToApi(
      {
        method: 'POST',
        path: '/transactions/expenses',
        accessToken: 'token-123',
        idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
      },
      fetchImpl as unknown as typeof fetch,
    );
    // Evita el ruido de "unhandled rejection" mientras avanzamos el reloj falso: el
    // resultado real se sigue esperando (y fallando si corresponde) más abajo.
    resultPromise.catch(() => {});

    await vi.advanceTimersByTimeAsync(3000);

    const result = await resultPromise;

    expect(fetchImpl).toHaveBeenCalledTimes(4);
    expect(result.status).toBe(409);
    expect((result.body as { code: string }).code).toBe('IDEMPOTENCY_IN_FLIGHT');
  });
});
