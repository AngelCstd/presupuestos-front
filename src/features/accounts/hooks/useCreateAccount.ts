'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { invalidationFor } from '@/lib/query/invalidation';
import type { Account, RealAccountKind } from '@/types/api';

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { name: string; kind: RealAccountKind; currency?: string }) =>
      bffFetch<Account>({ method: 'POST', path: '/accounts', body }),
    onSuccess: () => {
      for (const key of invalidationFor('createAccount')) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
