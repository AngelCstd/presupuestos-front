import type { NextRequest } from 'next/server';
import { createLoanSchema } from '@/features/transactions/schemas/loan';
import { handleIdempotentPost } from '@/lib/bff/idempotent-handler';

export async function POST(request: NextRequest) {
  return handleIdempotentPost(request, { apiPath: '/transactions/loans', schema: createLoanSchema });
}
