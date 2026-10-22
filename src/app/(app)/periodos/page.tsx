import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { listPeriods } from '@/features/periods/services/periods';
import { qk } from '@/lib/query-keys';
import { PeriodsView } from './PeriodsView';

export default async function PeriodsPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: qk.periods(null),
    queryFn: () => listPeriods({ pageSize: 200 }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PeriodsView />
    </HydrationBoundary>
  );
}
