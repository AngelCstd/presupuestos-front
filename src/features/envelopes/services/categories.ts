import { apiRequest } from '@/lib/api/client';
import { buildQueryString } from '@/lib/api/query-string';
import { getAccessToken } from '@/lib/supabase/server';
import type {
  Category,
  CategoryLedgerEntry,
  CursorPage,
  OffsetPage,
  RolloverType,
} from '@/types/api';

// API-CONTRACT.md §10.1.

export async function listCategories(
  params: { periodId?: string; includeArchived?: boolean; page?: number; pageSize?: number } = {},
): Promise<OffsetPage<Category>> {
  const accessToken = await getAccessToken();
  return apiRequest<OffsetPage<Category>>({
    method: 'GET',
    path: `/categories${buildQueryString(params)}`,
    accessToken,
  });
}

export async function createCategory(body: {
  name: string;
  rolloverType: RolloverType;
  currency?: string;
}): Promise<Category> {
  const accessToken = await getAccessToken();
  return apiRequest<Category>({ method: 'POST', path: '/categories', body, accessToken });
}

// No hay GET /categories/{id} en el contrato — solo GET /categories (lista, con
// periodId opcional), PATCH, archive/unarchive y el ledger. Para el detalle de un
// sobre, se busca por id dentro de la lista (ver app/(app)/sobres/[categoryId]/).

export async function updateCategory(
  id: string,
  body: { name?: string; rolloverType?: RolloverType },
): Promise<Category> {
  const accessToken = await getAccessToken();
  return apiRequest<Category>({ method: 'PATCH', path: `/categories/${id}`, body, accessToken });
}

export async function archiveCategory(id: string): Promise<Category> {
  const accessToken = await getAccessToken();
  return apiRequest<Category>({ method: 'POST', path: `/categories/${id}/archive`, accessToken });
}

export async function unarchiveCategory(id: string): Promise<Category> {
  const accessToken = await getAccessToken();
  return apiRequest<Category>({ method: 'POST', path: `/categories/${id}/unarchive`, accessToken });
}

export async function getCategoryLedger(
  id: string,
  params: { limit?: number; cursor?: string } = {},
): Promise<CursorPage<CategoryLedgerEntry>> {
  const accessToken = await getAccessToken();
  return apiRequest<CursorPage<CategoryLedgerEntry>>({
    method: 'GET',
    path: `/categories/${id}/ledger${buildQueryString(params)}`,
    accessToken,
  });
}
