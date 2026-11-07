import { Suspense } from 'react';
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { listCategories } from '@/features/envelopes/services/categories';
import { getCurrentPeriod } from '@/features/periods/services/periods';
import { ApiError } from '@/lib/api/errors';
import { qk } from '@/lib/query-keys';
import { EnvelopesView } from './EnvelopesView';

async function resolveCurrentPeriodId(): Promise<string | null> {
  try {
    const period = await getCurrentPeriod();
    return period.id;
  } catch (error) {
    // NO_CURRENT_PERIOD es un 404 en el contrato, una acción pendiente para el
    // usuario — no un error (API-CONTRACT.md, TASK-front.md U16/U17).
    if (error instanceof ApiError && error.code === 'NO_CURRENT_PERIOD') return null;
    throw error;
  }
}

export default async function EnvelopesPage() {
  const periodId = await resolveCurrentPeriodId();
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: qk.categories(periodId),
    queryFn: () => listCategories(periodId ? { periodId } : {}),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense>
        <EnvelopesView periodId={periodId} />
      </Suspense>
    </HydrationBoundary>
  );
}
