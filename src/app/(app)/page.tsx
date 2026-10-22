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
  await queryClient.prefetchQuery({
    queryKey: qk.dashboard(null),
    queryFn: () => serverApi.getDashboard(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InicioView />
    </HydrationBoundary>
  );
}
