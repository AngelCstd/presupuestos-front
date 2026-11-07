import { createBrowserClient } from '@supabase/ssr';

/**
 * Patrón estándar de @supabase/ssr para Client Components. El `access_token` vive en
 * cookies httpOnly que este cliente nunca expone directamente al código de la app — es
 * la razón de existir del BFF (ARCHITECTURE-front.md §1).
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!;

  return createBrowserClient(url, key);
}
