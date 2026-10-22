import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getTransaction } from '@/features/transactions/services/transactions';
import { qk } from '@/lib/query-keys';
import { TransactionDetailView } from './TransactionDetailView';

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ transactionId: string }>;
}) {
  const { transactionId } = await params;
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: qk.transaction(transactionId),
    queryFn: () => getTransaction(transactionId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TransactionDetailView transactionId={transactionId} />
    </HydrationBoundary>
  );
}
