'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { qk } from '@/lib/query-keys';
import type { Transaction } from '@/types/api';

export function useUpdateTransactionDescription(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (description: string) =>
      bffFetch<Transaction>({ method: 'PATCH', path: `/transactions/${id}`, body: { description } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.transaction(id) }),
  });
}
