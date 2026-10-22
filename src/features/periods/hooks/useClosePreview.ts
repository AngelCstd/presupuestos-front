'use client';

import { useQuery } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { qk } from '@/lib/query-keys';
import type { ClosePreview } from '@/types/api';

/** No escribe nada (API-CONTRACT.md §12.3) — solo alimenta la pantalla de cierre. */
export function useClosePreview(periodId: string) {
  return useQuery({
    queryKey: qk.closePreview(periodId),
    queryFn: () => bffFetch<ClosePreview>({ path: `/periods/${periodId}/close-preview` }),
  });
}
