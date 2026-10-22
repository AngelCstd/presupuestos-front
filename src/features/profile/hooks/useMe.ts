'use client';

import { useQuery } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { qk } from '@/lib/query-keys';
import type { Profile } from '@/types/api';

export function useMe() {
  return useQuery({
    queryKey: qk.me(),
    queryFn: () => bffFetch<Profile>({ path: '/me' }),
  });
}
