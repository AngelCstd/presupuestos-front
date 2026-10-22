'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { qk } from '@/lib/query-keys';
import type { Profile } from '@/types/api';

/** Sin `MutationName` propio: solo afecta `qk.me()`, ninguna otra pantalla lo cachea. */
export function useUpdateTimezone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (timezone: string) => bffFetch<Profile>({ method: 'PATCH', path: '/me', body: { timezone } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.me() });
    },
  });
}
