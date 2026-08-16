import type { EnvelopeStatus } from '@/types/api';

/**
 * Orden de evaluación fijo (ARCHITECTURE-front.md §8.3) — cada regla se evalúa en
 * este orden exacto, y la primera que aplica gana:
 * 1. !hasBudget → no_budget, sin mirar montos.
 * 2. availableCents < 0 → overspent.
 * 3. availableCents === 0 → depleted.
 * 4. resto → available.
 */
export function deriveEnvelopeStatus(p: {
  assignedCents: string;
  spentCents: string;
  availableCents: string;
  hasBudget: boolean;
}): EnvelopeStatus {
  if (!p.hasBudget) return 'no_budget';

  const available = BigInt(p.availableCents);
  if (available < 0n) return 'overspent';
  if (available === 0n) return 'depleted';
  return 'available';
}
