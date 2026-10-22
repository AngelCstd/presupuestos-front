import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { listAccounts } from '@/features/accounts/services/accounts';
import { qk } from '@/lib/query-keys';
import { CuentasView } from './CuentasView';

export default async function CuentasPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: qk.accounts({}),
    queryFn: () => listAccounts({}),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CuentasView />
    </HydrationBoundary>
  );
}
