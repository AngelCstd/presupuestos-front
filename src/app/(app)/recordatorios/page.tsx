import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { listRecurringTemplates } from '@/features/recurring/services/recurring';
import { qk } from '@/lib/query-keys';
import { RecordatoriosView } from './RecordatoriosView';

export default async function RecordatoriosPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: qk.recurringTemplates({}),
    queryFn: () => listRecurringTemplates({}),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RecordatoriosView />
    </HydrationBoundary>
  );
}
