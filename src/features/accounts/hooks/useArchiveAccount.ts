'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { qk } from '@/lib/query-keys';
import { invalidationFor } from '@/lib/query/invalidation';
import type { Account } from '@/types/api';

export function useArchiveAccount(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (archive: boolean) =>
      bffFetch<Account>({ method: 'POST', path: `/accounts/${id}/${archive ? 'archive' : 'unarchive'}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.account(id) });
      for (const key of invalidationFor('archiveAccount')) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
