'use client';

import { useQuery } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { buildQueryString } from '@/lib/api/query-string';
import { qk } from '@/lib/query-keys';
import type { IncomeSource, OffsetPage } from '@/types/api';

export function useIncomeSources(opts: { includeArchived?: boolean } = {}) {
  return useQuery({
    queryKey: qk.incomeSources(opts),
    queryFn: () => bffFetch<OffsetPage<IncomeSource>>({ path: `/income-sources${buildQueryString(opts)}` }),
  });
}
