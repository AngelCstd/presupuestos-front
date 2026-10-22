'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { invalidationFor } from '@/lib/query/invalidation';

export function useDeletePeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bffFetch<null>({ method: 'DELETE', path: `/periods/${id}` }),
    onSuccess: () => {
      for (const key of invalidationFor('deletePeriod')) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
