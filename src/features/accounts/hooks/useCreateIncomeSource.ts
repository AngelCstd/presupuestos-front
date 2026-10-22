'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import type { IncomeSource } from '@/types/api';

/** Sin `MutationName` propio, mismo criterio que `useCreateRecurringTemplate` (U22). */
export function useCreateIncomeSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { name: string; currency?: string }) =>
      bffFetch<IncomeSource>({ method: 'POST', path: '/income-sources', body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-sources'] });
    },
  });
}
