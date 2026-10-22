import { z } from 'zod';
import { calendarDateString, centsString, idString } from '@/lib/validation/primitives';

export const expenseLineSchema = z.object({
  categoryId: idString,
  amountCents: centsString,
});

export const lentToLineSchema = z.object({
  receivableAccountId: idString,
  amountCents: centsString,
});

// API-CONTRACT.md §11.1.
export const createExpenseSchema = z.object({
  bookedAt: calendarDateString,
  description: z.string().min(1),
  paidFromAccountId: idString,
  totalCents: centsString,
  lines: z.array(expenseLineSchema).min(1),
  lentTo: z.array(lentToLineSchema).optional(),
});
