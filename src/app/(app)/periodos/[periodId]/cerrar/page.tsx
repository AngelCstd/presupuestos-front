import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { listAllocations } from '@/features/envelopes/services/allocations';
import { getClosePreview, listPeriods } from '@/features/periods/services/periods';
import { qk } from '@/lib/query-keys';
import { ClosePeriodView } from './ClosePeriodView';

export default async function ClosePeriodPage({ params }: { params: Promise<{ periodId: string }> }) {
  const { periodId } = await params;
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: qk.closePreview(periodId),
    queryFn: () => getClosePreview(periodId),
  });
  await queryClient.prefetchQuery({
    queryKey: qk.allocations(periodId),
    queryFn: () => listAllocations(periodId),
  });
  await queryClient.prefetchQuery({
    queryKey: qk.periods(null),
    queryFn: () => listPeriods({ pageSize: 200 }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClosePeriodView periodId={periodId} />
    </HydrationBoundary>
  );
}
