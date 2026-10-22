'use client';

import { useQuery } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { buildQueryString } from '@/lib/api/query-string';
import { qk } from '@/lib/query-keys';
import type { Account, OffsetPage, RealAccountKind } from '@/types/api';

export function useAccounts(params: { kind?: RealAccountKind; includeArchived?: boolean } = {}) {
  return useQuery({
    queryKey: qk.accounts(params),
    queryFn: () => bffFetch<OffsetPage<Account>>({ path: `/accounts${buildQueryString(params)}` }),
  });
}
