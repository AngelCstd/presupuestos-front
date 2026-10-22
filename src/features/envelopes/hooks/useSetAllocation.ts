'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { deriveEnvelopeStatus } from '@/lib/domain/envelopes';
import { qk } from '@/lib/query-keys';
import { invalidationFor } from '@/lib/query/invalidation';
import type { Category, OffsetPage, SetAllocationResult } from '@/types/api';

/**
 * PUT .../allocations/{categoryId} — el único que debe usar la UI de sobres, nunca el
 * POST de delta (TASK-front.md U17). Optimista a propósito: es idempotente por diseño
 * (API-CONTRACT.md §12.2), así que el usuario ve el sobre actualizarse al instante
 * (ARCHITECTURE-front.md §5.3), con rollback si el servidor rechaza el cambio.
 */
export function useSetAllocation(periodId: string) {
  const queryClient = useQueryClient();
  const queryKey = qk.categories(periodId);

  return useMutation({
    mutationFn: ({ categoryId, targetAssignedCents }: { categoryId: string; targetAssignedCents: string }) =>
      bffFetch<SetAllocationResult>({
        method: 'PUT',
        path: `/periods/${periodId}/allocations/${categoryId}`,
        body: { targetAssignedCents },
      }),

    onMutate: async ({ categoryId, targetAssignedCents }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<OffsetPage<Category>>(queryKey);

      if (previous) {
        queryClient.setQueryData<OffsetPage<Category>>(queryKey, {
          ...previous,
          data: previous.data.map((category) => {
            if (category.id !== categoryId || !category.period) return category;

            const spentCents = category.period.spentCents;
            const availableCents = (BigInt(targetAssignedCents) - BigInt(spentCents)).toString();

            return {
              ...category,
              period: {
                ...category.period,
                assignedCents: targetAssignedCents,
                availableCents,
                hasBudget: true,
                status: deriveEnvelopeStatus({
                  assignedCents: targetAssignedCents,
                  spentCents,
                  availableCents,
                  hasBudget: true,
                }),
              },
            };
          }),
        });
      }

      return { previous };
    },

    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },

    onSettled: () => {
      for (const key of invalidationFor('putAllocation')) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
