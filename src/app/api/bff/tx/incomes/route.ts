import type { NextRequest } from 'next/server';
import { createIncomeSchema } from '@/features/transactions/schemas/income';
import { handleIdempotentPost } from '@/lib/bff/idempotent-handler';

export async function POST(request: NextRequest) {
  return handleIdempotentPost(request, { apiPath: '/transactions/incomes', schema: createIncomeSchema });
}
