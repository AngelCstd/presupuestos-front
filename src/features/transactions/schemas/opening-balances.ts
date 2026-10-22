import { z } from 'zod';
import { calendarDateString, centsString, idString } from '@/lib/validation/primitives';

export const openingBalanceEntrySchema = z.object({
  accountId: idString,
  balanceCents: centsString,
});

// API-CONTRACT.md §11.7. Se puede llamar más de una vez — no es exclusivo del onboarding.
export const createOpeningBalancesSchema = z.object({
  bookedAt: calendarDateString,
  description: z.string().min(1),
  balances: z.array(openingBalanceEntrySchema).min(1),
});
