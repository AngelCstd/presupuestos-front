import { z } from 'zod';
import { calendarDateString } from '@/lib/validation/primitives';

// API-CONTRACT.md §11.8. `bookedAt` normalmente se omite: si el original fue captura
// tardía, mandarlo da 422 REVERSAL_DATE_LOCKED (§11.12). Sigue siendo un campo válido
// para el resto de los casos — la UI decide cuándo ofrecerlo, este esquema no lo prohíbe.
export const reversalSchema = z.object({
  description: z.string().min(1).optional(),
  bookedAt: calendarDateString.optional(),
});
