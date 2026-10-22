import { apiRequest } from '@/lib/api/client';
import { getAccessToken } from '@/lib/supabase/server';
import type { Allocation, MoveAllocationRequest, SetAllocationResult } from '@/types/api';

// API-CONTRACT.md §12.2. "sobres: categories + allocations" (ARCHITECTURE-front.md §15).

export async function listAllocations(periodId: string): Promise<Allocation[]> {
  const accessToken = await getAccessToken();
  return apiRequest<Allocation[]>({ method: 'GET', path: `/periods/${periodId}/allocations`, accessToken });
}

/**
 * El `POST` de delta. La UI de sobres NO lo usa (TASK-front.md §7) — existe para
 * completar la cobertura de endpoints de U11, no para llamarse desde `/sobres`.
 */
export async function createAllocationDelta(
  periodId: string,
  body: { categoryId: string; amountCents: string; note: string | null },
): Promise<Allocation> {
  const accessToken = await getAccessToken();
  return apiRequest<Allocation>({
    method: 'POST',
    path: `/periods/${periodId}/allocations`,
    body,
    accessToken,
  });
}

/** El que debe usar la UI de sobres (TASK-front.md §7, §18 del contrato). */
export async function setAllocation(
  periodId: string,
  categoryId: string,
  targetAssignedCents: string,
): Promise<SetAllocationResult> {
  const accessToken = await getAccessToken();
  return apiRequest<SetAllocationResult>({
    method: 'PUT',
    path: `/periods/${periodId}/allocations/${categoryId}`,
    body: { targetAssignedCents },
    accessToken,
  });
}

export async function moveAllocation(
  periodId: string,
  body: MoveAllocationRequest,
): Promise<SetAllocationResult> {
  const accessToken = await getAccessToken();
  return apiRequest<SetAllocationResult>({
    method: 'POST',
    path: `/periods/${periodId}/allocations/move`,
    body,
    accessToken,
  });
}

export async function deleteAllocation(periodId: string, allocationId: string): Promise<void> {
  const accessToken = await getAccessToken();
  await apiRequest<null>({
    method: 'DELETE',
    path: `/periods/${periodId}/allocations/${allocationId}`,
    accessToken,
  });
}
