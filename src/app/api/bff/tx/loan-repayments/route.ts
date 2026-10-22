import type { NextRequest } from 'next/server';
import { createLoanRepaymentSchema } from '@/features/transactions/schemas/loan-repayment';
import { handleIdempotentPost } from '@/lib/bff/idempotent-handler';

export async function POST(request: NextRequest) {
  return handleIdempotentPost(request, {
    apiPath: '/transactions/loan-repayments',
    schema: createLoanRepaymentSchema,
  });
}
