import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { readSessionState, sessionActionFor } from '@/lib/supabase/session-policy';

/**
 * El adaptador (U8b, sin tests, verificación humana — TASK-front.md). Su única lógica
 * es ejecutar lo que `session-policy.ts` (U8a, con tests) decidió; todo `if` que no sea
 * "llamar a Supabase" pertenece allá, no aquí.
 *
 * Puente entre la cookie real de Supabase y la forma que `readSessionState` espera
 * (`tests/session-policy.test.ts`, con test propio y ya en verde, así que no se toca):
 * `getSession()` lee la sesión almacenada en las cookies **sin red** — de ahí se saca
 * `expires_at` (segundos Unix) y se normaliza a `{ expiresAt: <ISO 8601> }` bajo la
 * llave sintética `sb-session`. Esa lectura local decide la ACCIÓN, nunca autoriza por
 * sí sola: `action === 'refresh'` siempre pasa por `getUser()`, que sí valida contra el
 * servidor de Supabase (y refresca si el access token expiró pero el refresh token
 * sigue vigente). Documentado como inferencia en PROGRESS.md — pendiente de smoke test
 * humano real (TASK-front.md §8, puntos 6.4 y 6.7).
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!;

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const cookieMap = new Map<string, string>();
  if (session?.expires_at) {
    cookieMap.set(
      'sb-session',
      JSON.stringify({ expiresAt: new Date(session.expires_at * 1000).toISOString() }),
    );
  }

  const state = readSessionState(cookieMap, new Date());
  const action = sessionActionFor(state, request.nextUrl.pathname);

  if (action === 'allow') {
    return response;
  }

  if (action === 'redirect-login') {
    return redirectToLogin(request);
  }

  // action === 'refresh': el access token local está vencido, pero puede haber un
  // refresh token vigente. getUser() lo intenta contra el servidor de Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? response : redirectToLogin(request);
}

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}
