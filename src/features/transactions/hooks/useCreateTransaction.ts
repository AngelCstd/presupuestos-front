'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { BFF_DEDICATED_ROUTES } from '@/lib/bff/dedicated-routes';
import { invalidationFor } from '@/lib/query/invalidation';
import type { TransactionMutationResult } from '@/types/api';

export type CreateTransactionIntent =
  | 'expenses'
  | 'incomes'
  | 'transfers'
  | 'loans'
  | 'loan-repayments'
  | 'loan-write-offs';

const PATH_BY_INTENT: Record<CreateTransactionIntent, string> = {
  expenses: BFF_DEDICATED_ROUTES.expenses,
  incomes: BFF_DEDICATED_ROUTES.incomes,
  transfers: BFF_DEDICATED_ROUTES.transfers,
  loans: BFF_DEDICATED_ROUTES.loans,
  'loan-repayments': BFF_DEDICATED_ROUTES.loanRepayments,
  'loan-write-offs': BFF_DEDICATED_ROUTES.loanWriteOffs,
};

/**
 * Una función por endpoint del contrato ya existe en `features/transactions/services/`
 * (U11, servidor); esto es su equivalente de navegador para los formularios de
 * `/capturar/*`, que no pueden importar servicios server-only. Nunca optimista —
 * `budgetImpact` solo se conoce con la respuesta (ARCHITECTURE-front.md §5.3).
 */
export function useCreateTransaction(intent: CreateTransactionIntent) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ body, idempotencyKey }: { body: unknown; idempotencyKey: string }) =>
      bffFetch<TransactionMutationResult>({
        method: 'POST',
        path: PATH_BY_INTENT[intent],
        body,
        idempotencyKey,
      }),
    onSuccess: () => {
      for (const key of invalidationFor('createTransaction')) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
