import { z } from 'zod';
import { calendarDateString, centsString, idString } from '@/lib/validation/primitives';

// API-CONTRACT.md §11.6. `categoryId` lo elige el usuario — la API no asume una
// categoría de "Pérdidas" (§15.5).
export const createLoanWriteOffSchema = z.object({
  bookedAt: calendarDateString,
  description: z.string().min(1),
  receivableAccountId: idString,
  categoryId: idString,
  amountCents: centsString,
});
