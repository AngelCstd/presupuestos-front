'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { invalidationFor } from '@/lib/query/invalidation';
import type { MoveAllocationRequest, SetAllocationResult } from '@/types/api';

/** POST .../allocations/move — cubrir un sobregiro moviendo desde otro sobre del mismo periodo. */
export function useMoveAllocation(periodId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: MoveAllocationRequest) =>
      bffFetch<SetAllocationResult>({
        method: 'POST',
        path: `/periods/${periodId}/allocations/move`,
        body,
      }),
    onSuccess: () => {
      for (const key of invalidationFor('moveAllocation')) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
