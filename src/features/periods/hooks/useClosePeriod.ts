'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { invalidationFor } from '@/lib/query/invalidation';
import type { CloseResult } from '@/types/api';

/**
 * No optimista (TASK-front.md U21): el cierre es irreversible, así que se espera la
 * respuesta real del servidor antes de reflejar nada.
 */
export function useClosePeriod(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => bffFetch<CloseResult>({ method: 'POST', path: `/periods/${id}/close` }),
    onSuccess: () => {
      for (const key of invalidationFor('closePeriod')) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
