import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { listTransactions } from '@/features/transactions/services/transactions';
import { qk } from '@/lib/query-keys';
import { MovimientosView } from './MovimientosView';

export default async function MovimientosPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchInfiniteQuery({
    queryKey: qk.transactions({}),
    queryFn: () => listTransactions({}),
    initialPageParam: null,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MovimientosView />
    </HydrationBoundary>
  );
}
