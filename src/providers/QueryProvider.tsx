'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

/**
 * Sin polling, sin tiempo real (API-CONTRACT.md §15.7): `staleTime: Infinity` por
 * default — los datos se refrescan solo cuando una mutación invalida explícitamente
 * (`lib/query/invalidation.ts`), nunca por tiempo. Un `QueryClient` nuevo por sesión de
 * navegador, no compartido entre requests del servidor.
 */
function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
