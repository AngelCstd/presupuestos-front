'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { invalidationFor } from '@/lib/query/invalidation';

export function useDeleteAllocation(periodId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (allocationId: string) =>
      bffFetch<null>({ method: 'DELETE', path: `/periods/${periodId}/allocations/${allocationId}` }),
    onSuccess: () => {
      for (const key of invalidationFor('deleteAllocation')) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
