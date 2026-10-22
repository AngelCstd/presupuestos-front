'use client';

import { useQuery } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { qk } from '@/lib/query-keys';
import type { Account } from '@/types/api';

export function useAccount(id: string) {
  return useQuery({
    queryKey: qk.account(id),
    queryFn: () => bffFetch<Account>({ path: `/accounts/${id}` }),
  });
}
