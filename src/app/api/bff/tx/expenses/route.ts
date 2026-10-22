import type { NextRequest } from 'next/server';
import { createExpenseSchema } from '@/features/transactions/schemas/expense';
import { handleIdempotentPost } from '@/lib/bff/idempotent-handler';

export async function POST(request: NextRequest) {
  return handleIdempotentPost(request, { apiPath: '/transactions/expenses', schema: createExpenseSchema });
}
