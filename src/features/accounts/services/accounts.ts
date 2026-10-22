import { apiRequest } from '@/lib/api/client';
import { buildQueryString } from '@/lib/api/query-string';
import { getAccessToken } from '@/lib/supabase/server';
import type { Account, AccountLedgerEntry, CursorPage, OffsetPage, RealAccountKind } from '@/types/api';

// API-CONTRACT.md §9.

export interface ListAccountsParams {
  kind?: RealAccountKind;
  includeArchived?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listAccounts(params: ListAccountsParams = {}): Promise<OffsetPage<Account>> {
  const accessToken = await getAccessToken();
  return apiRequest<OffsetPage<Account>>({
    method: 'GET',
    path: `/accounts${buildQueryString(params)}`,
    accessToken,
  });
}

export async function createAccount(body: {
  name: string;
  kind: RealAccountKind;
  currency?: string;
}): Promise<Account> {
  const accessToken = await getAccessToken();
  return apiRequest<Account>({ method: 'POST', path: '/accounts', body, accessToken });
}

export async function getAccount(id: string): Promise<Account> {
  const accessToken = await getAccessToken();
  return apiRequest<Account>({ method: 'GET', path: `/accounts/${id}`, accessToken });
}

export async function updateAccount(id: string, body: { name?: string; currency?: string }): Promise<Account> {
  const accessToken = await getAccessToken();
  return apiRequest<Account>({ method: 'PATCH', path: `/accounts/${id}`, body, accessToken });
}

export async function archiveAccount(id: string): Promise<Account> {
  const accessToken = await getAccessToken();
  return apiRequest<Account>({ method: 'POST', path: `/accounts/${id}/archive`, accessToken });
}

export async function unarchiveAccount(id: string): Promise<Account> {
  const accessToken = await getAccessToken();
  return apiRequest<Account>({ method: 'POST', path: `/accounts/${id}/unarchive`, accessToken });
}

export async function getAccountLedger(
  id: string,
  params: { limit?: number; cursor?: string } = {},
): Promise<CursorPage<AccountLedgerEntry>> {
  const accessToken = await getAccessToken();
  return apiRequest<CursorPage<AccountLedgerEntry>>({
    method: 'GET',
    path: `/accounts/${id}/ledger${buildQueryString(params)}`,
    accessToken,
  });
}
