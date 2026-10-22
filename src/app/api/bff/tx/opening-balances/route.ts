import type { NextRequest } from 'next/server';
import { createOpeningBalancesSchema } from '@/features/transactions/schemas/opening-balances';
import { handleIdempotentPost } from '@/lib/bff/idempotent-handler';

export async function POST(request: NextRequest) {
  return handleIdempotentPost(request, {
    apiPath: '/transactions/opening-balances',
    schema: createOpeningBalancesSchema,
  });
}
