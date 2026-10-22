'use client';

import { useQuery } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { buildQueryString } from '@/lib/api/query-string';
import { qk } from '@/lib/query-keys';
import type { DashboardResponse } from '@/types/api';

/**
 * Una sola llamada a GET /insights/dashboard (TASK-front.md U16) — cuentas,
 * unassignedCents, periodo, sobres y no presupuestadas, todo junto. El Server
 * Component de la ruta ya la precarga con `serverApi.getDashboard()`
 * (ARCHITECTURE-front.md §5); este hook es lo que corre en el navegador después,
 * para cuando una mutación invalide `qk.dashboard(...)`.
 */
export function useDashboard(periodId: string | null = null) {
  return useQuery({
    queryKey: qk.dashboard(periodId),
    queryFn: () =>
      bffFetch<DashboardResponse>({ path: `/insights/dashboard${buildQueryString({ periodId })}` }),
  });
}
