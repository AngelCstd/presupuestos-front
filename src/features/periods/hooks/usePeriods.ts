'use client';

import { useQuery } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { qk } from '@/lib/query-keys';
import type { OffsetPage, Period } from '@/types/api';

/** Todos los periodos — usado para detectar si una fecha cae en uno cerrado (U18). */
export function usePeriods() {
  return useQuery({
    queryKey: qk.periods(null),
    queryFn: () => bffFetch<OffsetPage<Period>>({ path: '/periods?pageSize=200' }),
  });
}
