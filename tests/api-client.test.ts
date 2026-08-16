import { describe, expect, it, vi } from 'vitest';
import { apiRequest } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';

/**
 * Agregado por la sesión de tests como archivo 18 (ver TASK-front.md §5.2): U7 lo pedía
 * en su propio texto y la tabla no lo listaba. Cubre exactamente lo que ningún otro
 * archivo toca: normalización a ApiError, 200/201 idénticos, userId nunca en el body.
 * El reintento de IDEMPOTENCY_IN_FLIGHT lo cubre bff-forward.test.ts a nivel BFF.
 */

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('apiRequest — normaliza cualquier respuesta no-2xx a ApiError', () => {
  it('un 400 VALIDATION_FAILED se convierte en ApiError con code, statusCode y details', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(400, {
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'La petición no pasó validación.',
        details: [{ field: 'totalCents', constraint: 'must be a string of integer cents' }],
        timestamp: '2026-08-09T18:22:41.108Z',
        path: '/api/v1/transactions/expenses',
      }),
    );

    await expect(
      apiRequest(
        { method: 'POST', path: '/transactions/expenses', accessToken: 'token-123' },
        fetchImpl as unknown as typeof fetch,
      ),
    ).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      statusCode: 400,
      details: [{ field: 'totalCents', constraint: 'must be a string of integer cents' }],
    });
  });

  it('el rechazo es una instancia real de ApiError, no un error genérico', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(404, {
        statusCode: 404,
        code: 'ACCOUNT_NOT_FOUND',
        message: 'No encontrado.',
        timestamp: '2026-08-09T18:22:41.108Z',
        path: '/api/v1/accounts/nope',
      }),
    );

    await expect(
      apiRequest(
        { method: 'GET', path: '/accounts/nope', accessToken: 'token-123' },
        fetchImpl as unknown as typeof fetch,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

describe('apiRequest — 200 y 201 se tratan idénticamente (API-CONTRACT.md §5.2)', () => {
  it('ambos resuelven con el mismo cuerpo, sin distinción de comportamiento', async () => {
    const body = { id: 'tx-1', totalCents: '70000' };
    const fetch200 = vi.fn().mockResolvedValue(jsonResponse(200, body));
    const fetch201 = vi.fn().mockResolvedValue(jsonResponse(201, body));

    const result200 = await apiRequest(
      { method: 'POST', path: '/transactions/expenses', accessToken: 'token-123' },
      fetch200 as unknown as typeof fetch,
    );
    const result201 = await apiRequest(
      { method: 'POST', path: '/transactions/expenses', accessToken: 'token-123' },
      fetch201 as unknown as typeof fetch,
    );

    expect(result200).toEqual(body);
    expect(result201).toEqual(body);
  });
});

describe('apiRequest — el body nunca incluye userId', () => {
  it('el JSON enviado es exactamente el body dado, sin userId agregado', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(201, { id: 'tx-1' }));

    await apiRequest(
      {
        method: 'POST',
        path: '/transactions/expenses',
        accessToken: 'token-123',
        body: { totalCents: '70000', description: 'Wifi agosto' },
      },
      fetchImpl as unknown as typeof fetch,
    );

    const call = fetchImpl.mock.calls[0] as [string, RequestInit];
    const sentBody = JSON.parse(call[1]?.body as string);

    expect(sentBody).not.toHaveProperty('userId');
    expect(sentBody).toEqual({ totalCents: '70000', description: 'Wifi agosto' });
  });
});

describe('apiRequest — autenticación', () => {
  it('adjunta el access token como Authorization: Bearer', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { userId: 'u1' }));

    await apiRequest(
      { method: 'GET', path: '/me', accessToken: 'abc123' },
      fetchImpl as unknown as typeof fetch,
    );

    const call = fetchImpl.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(call[1]?.headers);

    expect(headers.get('authorization')).toBe('Bearer abc123');
  });
});
