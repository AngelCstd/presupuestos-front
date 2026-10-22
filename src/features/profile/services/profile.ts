import { apiRequest } from '@/lib/api/client';
import { getAccessToken } from '@/lib/supabase/server';
import type { Profile } from '@/types/api';

/**
 * Una función por endpoint del contrato (TASK-front.md U11). Cero aritmética, cero
 * traducción, cero decisiones de UI — solo la forma del request y del response.
 * Solo corren en servidor: llaman a `apiRequest`, que nunca toca el navegador
 * (ARCHITECTURE-front.md §3).
 */

export async function getMe(): Promise<Profile> {
  const accessToken = await getAccessToken();
  return apiRequest<Profile>({ method: 'GET', path: '/me', accessToken });
}

export async function updateMe(body: { timezone: string }): Promise<Profile> {
  const accessToken = await getAccessToken();
  return apiRequest<Profile>({ method: 'PATCH', path: '/me', body, accessToken });
}
