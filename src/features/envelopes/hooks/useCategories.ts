'use client';

import { useQuery } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { buildQueryString } from '@/lib/api/query-string';
import { qk } from '@/lib/query-keys';
import type { Category, OffsetPage } from '@/types/api';

export function useCategories(periodId: string | null, opts: { includeArchived?: boolean } = {}) {
  return useQuery({
    queryKey: qk.categories(periodId, opts),
    queryFn: () =>
      bffFetch<OffsetPage<Category>>({
        path: `/categories${buildQueryString({ ...(periodId ? { periodId } : {}), ...opts })}`,
      }),
  });
}
