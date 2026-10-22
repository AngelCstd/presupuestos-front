import type { NextRequest } from 'next/server';
import { confirmRecurringSchema } from '@/features/recurring/schemas/confirm';
import { handleIdempotentPost } from '@/lib/bff/idempotent-handler';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleIdempotentPost(request, {
    apiPath: `/recurring-templates/${id}/confirm`,
    schema: confirmRecurringSchema,
  });
}
