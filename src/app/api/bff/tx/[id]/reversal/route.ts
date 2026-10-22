import type { NextRequest } from 'next/server';
import { reversalSchema } from '@/features/transactions/schemas/reversal';
import { handleIdempotentPost } from '@/lib/bff/idempotent-handler';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleIdempotentPost(request, { apiPath: `/transactions/${id}/reversal`, schema: reversalSchema });
}
