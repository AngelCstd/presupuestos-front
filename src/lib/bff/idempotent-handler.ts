import { NextResponse } from 'next/server';
import type { ZodType } from 'zod';
import { contractError, forwardToApi } from '@/lib/bff/forward';
import { createClient } from '@/lib/supabase/server';

/**
 * Los 9 handlers dedicados (ARCHITECTURE-front.md §4.3) comparten esta forma: validan
 * `Idempotency-Key` y el body con Zod antes de salir a la red, y nunca cargan esa
 * lógica en el catch-all.
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function handleIdempotentPost(
  request: Request,
  options: { apiPath: string; schema: ZodType },
): Promise<NextResponse> {
  const { apiPath, schema } = options;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json(contractError(401, 'UNAUTHORIZED', apiPath), { status: 401 });
  }

  const idempotencyKey = request.headers.get('idempotency-key');
  if (!idempotencyKey) {
    return NextResponse.json(contractError(400, 'IDEMPOTENCY_KEY_REQUIRED', apiPath), { status: 400 });
  }
  if (!UUID_PATTERN.test(idempotencyKey)) {
    return NextResponse.json(contractError(400, 'IDEMPOTENCY_KEY_INVALID', apiPath), { status: 400 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(contractError(400, 'VALIDATION_FAILED', apiPath), { status: 400 });
  }

  const parsed = schema.safeParse(rawBody);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      constraint: issue.message,
    }));
    return NextResponse.json({ ...contractError(400, 'VALIDATION_FAILED', apiPath), details }, { status: 400 });
  }

  const result = await forwardToApi({
    method: 'POST',
    path: apiPath,
    body: parsed.data,
    accessToken: session.access_token,
    idempotencyKey,
    headers: { 'content-type': 'application/json' },
  });

  return NextResponse.json(result.body, { status: result.status });
}
