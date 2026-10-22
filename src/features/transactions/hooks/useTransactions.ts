'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { buildQueryString } from '@/lib/api/query-string';
import { qk } from '@/lib/query-keys';
import type { CursorPage, Transaction } from '@/types/api';

export interface TransactionFilters {
  from?: string;
  to?: string;
  accountId?: string;
  categoryId?: string;
}

/**
 * Cursor opaco (API-CONTRACT.md §6.1): vive solo en el `pageParam` de
 * `useInfiniteQuery`, nunca en la query key ni en almacenamiento — no se parsea, no se
 * persiste (TASK-front.md U19).
 */
export function useTransactions(filters: TransactionFilters = {}) {
  return useInfiniteQuery({
    queryKey: qk.transactions(filters),
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      bffFetch<CursorPage<Transaction>>({
        path: `/transactions${buildQueryString({ ...filters, cursor: pageParam ?? undefined, limit: 30 })}`,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
