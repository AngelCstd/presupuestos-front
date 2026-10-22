'use client';

import { useQuery } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { qk } from '@/lib/query-keys';
import type { UnbudgetedTransactionsResponse } from '@/types/api';

/** Alimenta el banner de Inicio y Movimientos, y en ninguna otra pantalla (TASK-front.md U14). */
export function useUnbudgetedTransactions() {
  return useQuery({
    queryKey: qk.unbudgetedTransactions(),
    queryFn: () => bffFetch<UnbudgetedTransactionsResponse>({ path: '/insights/unbudgeted-transactions' }),
  });
}
