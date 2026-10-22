'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import type { IncomeSource } from '@/types/api';

export function useArchiveIncomeSource(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (archive: boolean) =>
      bffFetch<IncomeSource>({ method: 'POST', path: `/income-sources/${id}/${archive ? 'archive' : 'unarchive'}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-sources'] });
    },
  });
}
