'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { BFF_DEDICATED_ROUTES } from '@/lib/bff/dedicated-routes';
import { qk } from '@/lib/query-keys';
import { invalidationFor } from '@/lib/query/invalidation';
import type { CalendarDate, TransactionMutationResult } from '@/types/api';

/**
 * Único punto de entrada a POST /transactions/opening-balances fuera del onboarding
 * (corrección del 2026-08-17 a SCREENS-front.md): vive en el detalle de cuenta porque
 * un saldo inicial siempre es sobre una cuenta concreta.
 */
export function useCaptureOpeningBalance(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookedAt,
      balanceCents,
      idempotencyKey,
    }: {
      bookedAt: CalendarDate;
      balanceCents: string;
      idempotencyKey: string;
    }) =>
      bffFetch<TransactionMutationResult>({
        method: 'POST',
        path: BFF_DEDICATED_ROUTES.openingBalances,
        body: {
          bookedAt,
          description: 'Saldo inicial',
          balances: [{ accountId, balanceCents }],
        },
        idempotencyKey,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.account(accountId) });
      queryClient.invalidateQueries({ queryKey: qk.accountLedger(accountId) });
      for (const key of invalidationFor('createTransaction')) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
