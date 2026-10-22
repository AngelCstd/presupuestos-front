import { apiRequest } from '@/lib/api/client';
import { buildQueryString } from '@/lib/api/query-string';
import { getAccessToken } from '@/lib/supabase/server';
import type { ConfirmRecurringRequest, ConfirmRecurringResult, OffsetPage, RecurringTemplate } from '@/types/api';

// API-CONTRACT.md §13. Solo lectura, crear y confirmar en v1 — sin editar ni borrar
// (TASK-front.md §2.2).

export async function listRecurringTemplates(
  params: { dueOnly?: boolean; includeInactive?: boolean; page?: number; pageSize?: number } = {},
): Promise<OffsetPage<RecurringTemplate>> {
  const accessToken = await getAccessToken();
  return apiRequest<OffsetPage<RecurringTemplate>>({
    method: 'GET',
    path: `/recurring-templates${buildQueryString(params)}`,
    accessToken,
  });
}

export async function createRecurringTemplate(body: {
  name: string;
  categoryId: string;
  accountId?: string;
  amountCents: string;
  dayOfMonth: number;
}): Promise<RecurringTemplate> {
  const accessToken = await getAccessToken();
  return apiRequest<RecurringTemplate>({ method: 'POST', path: '/recurring-templates', body, accessToken });
}

export async function confirmRecurringTemplate(
  id: string,
  body: ConfirmRecurringRequest,
  idempotencyKey: string,
): Promise<ConfirmRecurringResult> {
  const accessToken = await getAccessToken();
  return apiRequest<ConfirmRecurringResult>({
    method: 'POST',
    path: `/recurring-templates/${id}/confirm`,
    body,
    accessToken,
    idempotencyKey,
  });
}
