import type { AccountKind } from '@/types/api';

/**
 * STUB — sesión de tests. La implementación real (U2, TASK-front.md) todavía no existe.
 * Firmas fijadas en TASK-front.md §6.1. No calificar aquí: cada función existe solo
 * para que `money.test.ts`, `sign-rule.test.ts` y `split.test.ts` compilen y fallen.
 */

export function formatMoney(cents: string, currency?: string): string {
  throw new Error('formatMoney: not implemented');
}

export function formatBalance(
  cents: string,
  kind: AccountKind,
): { amount: string; suffix: string | null } {
  throw new Error('formatBalance: not implemented');
}

export function splitEvenly(totalCents: string, parts: number): string[] {
  throw new Error('splitEvenly: not implemented');
}

export function parseAmountInput(text: string): string | null {
  throw new Error('parseAmountInput: not implemented');
}
