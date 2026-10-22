import { apiRequest } from '@/lib/api/client';
import { buildQueryString } from '@/lib/api/query-string';
import { getAccessToken } from '@/lib/supabase/server';
import type {
  AccountBalancesResponse,
  CategoryBalancesResponse,
  DashboardResponse,
  UnassignedFundsResponse,
  UnbudgetedTransactionsResponse,
} from '@/types/api';

// API-CONTRACT.md §14. Toda la aritmética vive en estos cuatro endpoints — ningún otro
// servicio calcula saldos ni deriva estados (TASK-front.md U11).

export async function getAccountBalances(): Promise<AccountBalancesResponse> {
  const accessToken = await getAccessToken();
  return apiRequest<AccountBalancesResponse>({ method: 'GET', path: '/insights/account-balances', accessToken });
}

export async function getCategoryBalances(periodId: string): Promise<CategoryBalancesResponse> {
  const accessToken = await getAccessToken();
  return apiRequest<CategoryBalancesResponse>({
    method: 'GET',
    path: `/insights/category-balances${buildQueryString({ periodId })}`,
    accessToken,
  });
}

export async function getUnassignedFunds(): Promise<UnassignedFundsResponse> {
  const accessToken = await getAccessToken();
  return apiRequest<UnassignedFundsResponse>({ method: 'GET', path: '/insights/unassigned-funds', accessToken });
}

export async function getUnbudgetedTransactions(): Promise<UnbudgetedTransactionsResponse> {
  const accessToken = await getAccessToken();
  return apiRequest<UnbudgetedTransactionsResponse>({
    method: 'GET',
    path: '/insights/unbudgeted-transactions',
    accessToken,
  });
}

export async function getDashboard(periodId?: string): Promise<DashboardResponse> {
  const accessToken = await getAccessToken();
  return apiRequest<DashboardResponse>({
    method: 'GET',
    path: `/insights/dashboard${buildQueryString({ periodId })}`,
    accessToken,
  });
}
