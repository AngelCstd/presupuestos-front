'use client';

import { useQuery } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { qk } from '@/lib/query-keys';
import type { CategoryLedgerEntry, CursorPage } from '@/types/api';

/** Primera página nada más — U17 no pide paginación infinita, solo saber si está vacío. */
export function useCategoryLedger(id: string) {
  return useQuery({
    queryKey: qk.categoryLedger(id),
    queryFn: () => bffFetch<CursorPage<CategoryLedgerEntry>>({ path: `/categories/${id}/ledger?limit=20` }),
  });
}
