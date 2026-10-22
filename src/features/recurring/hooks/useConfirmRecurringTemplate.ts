'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { BFF_DEDICATED_ROUTES } from '@/lib/bff/dedicated-routes';
import { invalidationFor } from '@/lib/query/invalidation';
import type { ConfirmRecurringRequest, ConfirmRecurringResult } from '@/types/api';

export function useConfirmRecurringTemplate(templateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ body, idempotencyKey }: { body: ConfirmRecurringRequest; idempotencyKey: string }) =>
      bffFetch<ConfirmRecurringResult>({
        method: 'POST',
        path: BFF_DEDICATED_ROUTES.confirmRecurring(templateId),
        body,
        idempotencyKey,
      }),
    onSuccess: () => {
      for (const key of invalidationFor('confirmRecurring')) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
