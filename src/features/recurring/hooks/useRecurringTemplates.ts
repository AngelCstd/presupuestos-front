'use client';

import { useQuery } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { buildQueryString } from '@/lib/api/query-string';
import { qk } from '@/lib/query-keys';
import type { OffsetPage, RecurringTemplate } from '@/types/api';

export function useRecurringTemplates(params: { dueOnly?: boolean; includeInactive?: boolean } = {}) {
  return useQuery({
    queryKey: qk.recurringTemplates(params),
    queryFn: () => bffFetch<OffsetPage<RecurringTemplate>>({ path: `/recurring-templates${buildQueryString(params)}` }),
  });
}
