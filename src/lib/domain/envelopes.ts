import type { EnvelopeStatus } from '@/types/api';

/**
 * STUB — sesión de tests. La implementación real (U4, TASK-front.md) todavía no existe.
 * Firma fijada en TASK-front.md §6.1.
 */

export function deriveEnvelopeStatus(p: {
  assignedCents: string;
  spentCents: string;
  availableCents: string;
  hasBudget: boolean;
}): EnvelopeStatus {
  throw new Error('deriveEnvelopeStatus: not implemented');
}
