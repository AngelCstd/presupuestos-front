import { z } from 'zod';
import { calendarDateString, centsString, idString } from '@/lib/validation/primitives';

// API-CONTRACT.md §11.2.
export const createIncomeSchema = z.object({
  bookedAt: calendarDateString,
  description: z.string().min(1),
  toAccountId: idString,
  sourceId: idString,
  amountCents: centsString,
});
