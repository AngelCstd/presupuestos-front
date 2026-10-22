import { z } from 'zod';
import { calendarDateString, centsString, idString } from '@/lib/validation/primitives';

// API-CONTRACT.md §11.5.
export const createLoanRepaymentSchema = z.object({
  bookedAt: calendarDateString,
  description: z.string().min(1),
  receivableAccountId: idString,
  toAccountId: idString,
  amountCents: centsString,
});
