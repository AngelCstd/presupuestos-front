import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { serverApi } from '@/lib/api/server-api';
import { qk } from '@/lib/query-keys';
import { InicioView } from './InicioView';

/**
 * U16 (TASK-front.md). El Server Component precarga con `serverApi.getDashboard()`
 * (una sola llamada a GET /insights/dashboard, sin pasar por el BFF —
 * ARCHITECTURE-front.md §5) y entrega el resultado ya hidratado; de ahí en adelante
 * `InicioView` vive de `useDashboard()` en el cliente.
 */
export default async function InicioPage() {
  const queryClient = new QueryClient();
  try {
    console.log('[InicioPage] Prefetching dashboard data from server...');
    await queryClient.prefetchQuery({
      queryKey: qk.dashboard(null),
      queryFn: () => serverApi.getDashboard(),
    });
    console.log('[InicioPage] Dashboard prefetch complete.');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[InicioPage Prefetch Error]:', message);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InicioView />
    </HydrationBoundary>
  );
}
