import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getAccount, getAccountLedger } from '@/features/accounts/services/accounts';
import { qk } from '@/lib/query-keys';
import { AccountDetailView } from './AccountDetailView';

export default async function AccountDetailPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: qk.account(accountId),
    queryFn: () => getAccount(accountId),
  });
  await queryClient.prefetchQuery({
    queryKey: qk.accountLedger(accountId),
    queryFn: () => getAccountLedger(accountId, { limit: 20 }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AccountDetailView accountId={accountId} />
    </HydrationBoundary>
  );
}
