'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { qk } from '@/lib/query-keys';
import { invalidationFor } from '@/lib/query/invalidation';
import type { Account } from '@/types/api';

export function useUpdateAccount(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { name?: string; currency?: string }) =>
      bffFetch<Account>({ method: 'PATCH', path: `/accounts/${id}`, body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.account(id) });
      // Sin fila propia en ARCHITECTURE §5.2 para "editar cuenta" (mismo hueco que
      // "editar sobre", ya documentado en useUpdateCategory.ts) — 'createAccount'
      // invalida exactamente lo mismo que un edit necesita (accounts, dashboard).
      for (const key of invalidationFor('createAccount')) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
