'use client';

import { useQuery } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { qk } from '@/lib/query-keys';
import type { Transaction } from '@/types/api';

export function useTransaction(id: string) {
  return useQuery({
    queryKey: qk.transaction(id),
    queryFn: () => bffFetch<Transaction>({ path: `/transactions/${id}` }),
  });
}
