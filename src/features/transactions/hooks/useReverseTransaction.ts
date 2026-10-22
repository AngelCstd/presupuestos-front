'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { BFF_DEDICATED_ROUTES } from '@/lib/bff/dedicated-routes';
import { qk } from '@/lib/query-keys';
import { invalidationFor } from '@/lib/query/invalidation';
import type { TransactionMutationResult } from '@/types/api';

/**
 * Nunca manda `bookedAt` (API-CONTRACT.md §11.8, §11.12) — si el original fue captura
 * tardía, mandarlo da `422 REVERSAL_DATE_LOCKED`. Omitirlo siempre es lo correcto: hereda
 * la fecha del original, que es justo lo que neutraliza el ajuste solo.
 */
export function useReverseTransaction(transactionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ description, idempotencyKey }: { description?: string; idempotencyKey: string }) =>
      bffFetch<TransactionMutationResult>({
        method: 'POST',
        path: BFF_DEDICATED_ROUTES.reversal(transactionId),
        body: description ? { description } : {},
        idempotencyKey,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.transaction(transactionId) });
      for (const key of invalidationFor('reversal')) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
