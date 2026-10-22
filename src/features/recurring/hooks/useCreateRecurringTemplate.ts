'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import type { RecurringTemplate } from '@/types/api';

/**
 * Sin `MutationName` propio: crear una plantilla solo afecta `recurring-templates`, y
 * el más cercano que existe (`confirmRecurring`) invalida de más (dashboard, cuentas,
 * transacciones) — nada de eso cambia al crear, solo al confirmar. Se invalida el
 * prefijo directo en vez de forzar una reutilización que no encaja (mismo criterio que
 * ya se documentó para `useUpdateAccount`/`useUpdateCategory`, pero ahí sí había un
 * `MutationName` cuya categoría coincidía; aquí no la hay).
 */
export function useCreateRecurringTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { name: string; categoryId: string; accountId?: string; amountCents: string; dayOfMonth: number }) =>
      bffFetch<RecurringTemplate>({ method: 'POST', path: '/recurring-templates', body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-templates'] });
    },
  });
}
