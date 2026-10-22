'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { qk } from '@/lib/query-keys';
import { invalidationFor } from '@/lib/query/invalidation';
import type { Category, RolloverType } from '@/types/api';

export function useUpdateCategory(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { name?: string; rolloverType?: RolloverType }) =>
      bffFetch<Category>({ method: 'PATCH', path: `/categories/${id}`, body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.category(id) });
      // ARCHITECTURE-front.md §5.2 no tiene una fila para "editar sobre", solo
      // "crear/archivar" — y MutationName no se puede extender sin romper el
      // typecheck de tests/invalidation.test.ts (su fixture está tipado como
      // Record<MutationName, string[]>, exhaustivo). 'createCategory' invalida
      // exactamente lo mismo que debería invalidar un edit (categories, dashboard),
      // así que se reusa a propósito, no por descuido.
      for (const key of invalidationFor('createCategory')) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
