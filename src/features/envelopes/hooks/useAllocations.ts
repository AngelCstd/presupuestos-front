'use client';

import { useQuery } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { qk } from '@/lib/query-keys';
import type { Allocation } from '@/types/api';

/** Sin paginar — la lista es corta por construcción (API-CONTRACT.md §12.2). */
export function useAllocations(periodId: string) {
  return useQuery({
    queryKey: qk.allocations(periodId),
    queryFn: () => bffFetch<Allocation[]>({ path: `/periods/${periodId}/allocations` }),
  });
}
