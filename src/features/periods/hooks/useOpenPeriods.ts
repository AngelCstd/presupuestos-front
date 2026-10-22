'use client';

import { useQuery } from '@tanstack/react-query';
import { bffFetch } from '@/lib/api/browser-client';
import { qk } from '@/lib/query-keys';
import type { OffsetPage, Period } from '@/types/api';

/**
 * Alimenta el banner de periodo vencido del layout raíz — la única lectura que no
 * cuelga de ninguna pantalla (ARCHITECTURE-front.md §12.1). Corre en el navegador
 * (por eso `bffFetch`, no `apiRequest`): el layout raíz envuelve rutas públicas
 * también, y ahí no hay sesión desde la que un Server Component pueda leer directo.
 */
export function useOpenPeriods() {
  return useQuery({
    queryKey: qk.openPeriods(),
    queryFn: () => bffFetch<OffsetPage<Period>>({ path: '/periods?status=open' }),
  });
}
