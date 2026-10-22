import { z } from 'zod';
import { calendarDateString, centsString, idString } from '@/lib/validation/primitives';

// API-CONTRACT.md §13, POST /recurring-templates/{id}/confirm. Todos los campos son
// opcionales y sobreescriben los de la plantilla.
export const confirmRecurringSchema = z.object({
  bookedAt: calendarDateString.optional(),
  amountCents: centsString.optional(),
  paidFromAccountId: idString.optional(),
  description: z.string().min(1).optional(),
});
