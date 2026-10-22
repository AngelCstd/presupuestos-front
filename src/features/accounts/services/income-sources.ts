import { apiRequest } from '@/lib/api/client';
import { buildQueryString } from '@/lib/api/query-string';
import { getAccessToken } from '@/lib/supabase/server';
import type { IncomeSource, OffsetPage } from '@/types/api';

// API-CONTRACT.md §10.2. Sin carpeta propia en ARCHITECTURE-front.md §15 — se coloca
// junto a accounts por ser, igual que las cuentas, dinero/origen de dinero direccionable.
// Documentado como inferencia de ubicación en PROGRESS.md.

export async function listIncomeSources(
  params: { includeArchived?: boolean; page?: number; pageSize?: number } = {},
): Promise<OffsetPage<IncomeSource>> {
  const accessToken = await getAccessToken();
  return apiRequest<OffsetPage<IncomeSource>>({
    method: 'GET',
    path: `/income-sources${buildQueryString(params)}`,
    accessToken,
  });
}

export async function createIncomeSource(body: { name: string; currency?: string }): Promise<IncomeSource> {
  const accessToken = await getAccessToken();
  return apiRequest<IncomeSource>({ method: 'POST', path: '/income-sources', body, accessToken });
}

export async function getIncomeSource(id: string): Promise<IncomeSource> {
  const accessToken = await getAccessToken();
  return apiRequest<IncomeSource>({ method: 'GET', path: `/income-sources/${id}`, accessToken });
}

export async function updateIncomeSource(
  id: string,
  body: { name?: string; currency?: string },
): Promise<IncomeSource> {
  const accessToken = await getAccessToken();
  return apiRequest<IncomeSource>({ method: 'PATCH', path: `/income-sources/${id}`, body, accessToken });
}

export async function archiveIncomeSource(id: string): Promise<IncomeSource> {
  const accessToken = await getAccessToken();
  return apiRequest<IncomeSource>({ method: 'POST', path: `/income-sources/${id}/archive`, accessToken });
}

export async function unarchiveIncomeSource(id: string): Promise<IncomeSource> {
  const accessToken = await getAccessToken();
  return apiRequest<IncomeSource>({ method: 'POST', path: `/income-sources/${id}/unarchive`, accessToken });
}
