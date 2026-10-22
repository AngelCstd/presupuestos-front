import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getCategoryLedger, listCategories } from '@/features/envelopes/services/categories';
import { getCurrentPeriod } from '@/features/periods/services/periods';
import { ApiError } from '@/lib/api/errors';
import { qk } from '@/lib/query-keys';
import { CategoryDetailView } from './CategoryDetailView';

async function resolveCurrentPeriodId(): Promise<string | null> {
  try {
    const period = await getCurrentPeriod();
    return period.id;
  } catch (error) {
    if (error instanceof ApiError && error.code === 'NO_CURRENT_PERIOD') return null;
    throw error;
  }
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const periodId = await resolveCurrentPeriodId();
  const queryClient = new QueryClient();

  // No hay GET /categories/{id} en el contrato — el detalle se resuelve buscando el
  // id dentro de la misma lista que /sobres ya usa (ver PROGRESS.md, U17).
  await queryClient.prefetchQuery({
    queryKey: qk.categories(periodId),
    queryFn: () => listCategories(periodId ? { periodId } : {}),
  });

  await queryClient.prefetchQuery({
    queryKey: qk.categoryLedger(categoryId),
    queryFn: () => getCategoryLedger(categoryId, { limit: 20 }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CategoryDetailView categoryId={categoryId} periodId={periodId} />
    </HydrationBoundary>
  );
}
