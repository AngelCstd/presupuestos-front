import { apiRequest } from '@/lib/api/client';
import { buildQueryString } from '@/lib/api/query-string';
import { getAccessToken } from '@/lib/supabase/server';
import type { CalendarDate, ClosePreview, CloseResult, OffsetPage, Period, PeriodStatus } from '@/types/api';

// API-CONTRACT.md §12.1, §12.3.

export async function listPeriods(
  params: { status?: PeriodStatus; page?: number; pageSize?: number } = {},
): Promise<OffsetPage<Period>> {
  const accessToken = await getAccessToken();
  return apiRequest<OffsetPage<Period>>({ method: 'GET', path: `/periods${buildQueryString(params)}`, accessToken });
}

/** 404 NO_CURRENT_PERIOD si hoy cae en un hueco o antes del primer periodo. */
export async function getCurrentPeriod(): Promise<Period> {
  const accessToken = await getAccessToken();
  return apiRequest<Period>({ method: 'GET', path: '/periods/current', accessToken });
}

export async function createPeriod(body: { startsOn: CalendarDate; endsOn: CalendarDate }): Promise<Period> {
  const accessToken = await getAccessToken();
  return apiRequest<Period>({ method: 'POST', path: '/periods', body, accessToken });
}

export async function updatePeriod(
  id: string,
  body: { startsOn?: CalendarDate; endsOn?: CalendarDate },
): Promise<Period> {
  const accessToken = await getAccessToken();
  return apiRequest<Period>({ method: 'PATCH', path: `/periods/${id}`, body, accessToken });
}

export async function deletePeriod(id: string): Promise<void> {
  const accessToken = await getAccessToken();
  await apiRequest<null>({ method: 'DELETE', path: `/periods/${id}`, accessToken });
}

export async function getClosePreview(id: string): Promise<ClosePreview> {
  const accessToken = await getAccessToken();
  return apiRequest<ClosePreview>({ method: 'GET', path: `/periods/${id}/close-preview`, accessToken });
}

export async function closePeriod(id: string): Promise<CloseResult> {
  const accessToken = await getAccessToken();
  return apiRequest<CloseResult>({ method: 'POST', path: `/periods/${id}/close`, accessToken });
}
