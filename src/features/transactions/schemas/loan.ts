import { z } from 'zod';
import { calendarDateString, centsString, idString } from '@/lib/validation/primitives';

// API-CONTRACT.md §11.4.
export const createLoanSchema = z.object({
  bookedAt: calendarDateString,
  description: z.string().min(1),
  fromAccountId: idString,
  receivableAccountId: idString,
  amountCents: centsString,
});
