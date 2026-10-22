import { NextResponse, type NextRequest } from 'next/server';
import { ALLOWLIST, isAllowedRoute } from '@/lib/bff/allowlist';
import { contractError, forwardToApi } from '@/lib/bff/forward';
import { createClient } from '@/lib/supabase/server';
import type { HttpMethod } from '@/types/api';

/**
 * Catch-all con allowlist (ARCHITECTURE-front.md §4.1). Solo lecturas y escrituras
 * simples — los 9 endpoints idempotentes tienen handler dedicado y no pasan por aquí.
 */

type RouteParams = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, method: HttpMethod, params: RouteParams['params']) {
  const { path: segments } = await params;
  const path = `/${segments.join('/')}`;

  if (!isAllowedRoute(method, path, ALLOWLIST)) {
    return NextResponse.json(contractError(404, 'ROUTE_NOT_FOUND', path), { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json(contractError(401, 'UNAUTHORIZED', path), { status: 401 });
  }

  let body: unknown;
  if (method !== 'GET' && method !== 'DELETE') {
    try {
      body = await request.json();
    } catch {
      body = undefined;
    }
  }

  const contentType = request.headers.get('content-type');
  const idempotencyKey = request.headers.get('idempotency-key');

  const result = await forwardToApi({
    method,
    path: `${path}${request.nextUrl.search}`,
    body,
    accessToken: session.access_token,
    idempotencyKey: idempotencyKey ?? undefined,
    headers: contentType ? { 'content-type': contentType } : undefined,
  });

  return NextResponse.json(result.body, { status: result.status });
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return handle(request, 'GET', params);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return handle(request, 'POST', params);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return handle(request, 'PATCH', params);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return handle(request, 'PUT', params);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return handle(request, 'DELETE', params);
}
