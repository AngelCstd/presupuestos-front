'use client';

import { useQuery } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { qk } from '@/lib/query-keys';
import type { AccountLedgerEntry, CursorPage } from '@/types/api';

export function useAccountLedger(id: string) {
  return useQuery({
    queryKey: qk.accountLedger(id),
    queryFn: () => bffFetch<CursorPage<AccountLedgerEntry>>({ path: `/accounts/${id}/ledger?limit=20` }),
  });
}
