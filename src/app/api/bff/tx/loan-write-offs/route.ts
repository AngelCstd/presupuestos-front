import type { NextRequest } from 'next/server';
import { createLoanWriteOffSchema } from '@/features/transactions/schemas/loan-write-off';
import { handleIdempotentPost } from '@/lib/bff/idempotent-handler';

export async function POST(request: NextRequest) {
  return handleIdempotentPost(request, {
    apiPath: '/transactions/loan-write-offs',
    schema: createLoanWriteOffSchema,
  });
}
