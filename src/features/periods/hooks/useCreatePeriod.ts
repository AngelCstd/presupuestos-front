'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { invalidationFor } from '@/lib/query/invalidation';
import type { CalendarDate, Period } from '@/types/api';

export function useCreatePeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { startsOn: CalendarDate; endsOn: CalendarDate }) =>
      bffFetch<Period>({ method: 'POST', path: '/periods', body }),
    onSuccess: () => {
      for (const key of invalidationFor('createPeriod')) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
