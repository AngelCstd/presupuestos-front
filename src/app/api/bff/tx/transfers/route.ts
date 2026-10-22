import type { NextRequest } from 'next/server';
import { createTransferSchema } from '@/features/transactions/schemas/transfer';
import { handleIdempotentPost } from '@/lib/bff/idempotent-handler';

export async function POST(request: NextRequest) {
  return handleIdempotentPost(request, { apiPath: '/transactions/transfers', schema: createTransferSchema });
}
