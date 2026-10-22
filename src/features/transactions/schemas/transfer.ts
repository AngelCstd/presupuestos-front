import { z } from 'zod';
import { calendarDateString, centsString, idString } from '@/lib/validation/primitives';

// API-CONTRACT.md §11.3. Cubre también el atajo "Pago de tarjeta" (SCREENS-front.md):
// origen cash, destino credit — es la misma forma, la UI decide la etiqueta.
export const createTransferSchema = z.object({
  bookedAt: calendarDateString,
  description: z.string().min(1),
  fromAccountId: idString,
  toAccountId: idString,
  amountCents: centsString,
});
