import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ApiError } from '@/lib/api/errors';

/**
 * Patrón estándar de @supabase/ssr para Server Components y Route Handlers. Se crea
 * una instancia nueva por request — nunca se comparte entre requests.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Llamado desde un Server Component sin permiso de escribir cookies.
          // El middleware es quien refresca la sesión en cada request; esto es
          // inofensivo si ya está corriendo (patrón estándar de @supabase/ssr).
        }
      },
    },
  });
}

/**
 * Usado por los servicios de cada `features/<dominio>/services/` (U11) y por
 * `lib/api/server-api.ts`: los Server Components llaman al cliente HTTP directo, sin
 * pasar por el BFF (ARCHITECTURE-front.md §3) — necesitan el `access_token` de la
 * sesión actual para adjuntarlo como `Authorization`. Lanza `ApiError('UNAUTHORIZED',
 * 401)` si no hay sesión, consistente con lo que el BFF también hace.
 */
export async function getAccessToken(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new ApiError('UNAUTHORIZED', 401);
  }

  return session.access_token;
}
