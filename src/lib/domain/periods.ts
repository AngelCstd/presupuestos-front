import type { PeriodStatus } from '@/types/api';

/**
 * STUB — sesión de tests. Archivo NUEVO, no listado en el árbol de ARCHITECTURE-front.md §15.
 * Firma propuesta por la sesión de tests (no fijada en el contrato ni en la arquitectura
 * original) y aprobada + agregada a TASK-front.md §6.1. Ver PROGRESS.md.
 */

export function selectClosablePeriod(
  openPeriods: readonly { id: string; endsOn: string; status: PeriodStatus }[],
  today: string,
): { id: string; endsOn: string; status: PeriodStatus } | null {
  throw new Error('selectClosablePeriod: not implemented');
}
