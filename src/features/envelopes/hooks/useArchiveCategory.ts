'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { qk } from '@/lib/query-keys';
import { invalidationFor } from '@/lib/query/invalidation';
import type { Category } from '@/types/api';

export function useArchiveCategory(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (archive: boolean) =>
      bffFetch<Category>({ method: 'POST', path: `/categories/${id}/${archive ? 'archive' : 'unarchive'}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.category(id) });
      for (const key of invalidationFor('archiveCategory')) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
