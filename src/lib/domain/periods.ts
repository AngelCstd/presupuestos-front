import type { PeriodStatus } from '@/types/api';

/**
 * De varios periodos vencidos, solo el más antiguo se ofrece cerrar — los cierres van
 * en orden cronológico y la API rechaza el desordenado (API-CONTRACT.md §15.2).
 * `endsOn` es inclusivo: un periodo vencido es uno cuyo `endsOn` es ANTERIOR a hoy,
 * no igual (API-CONTRACT.md §12.1).
 */
export function selectClosablePeriod(
  openPeriods: readonly { id: string; endsOn: string; status: PeriodStatus }[],
  today: string,
): { id: string; endsOn: string; status: PeriodStatus } | null {
  const overdue = openPeriods.filter((period) => period.status === 'open' && period.endsOn < today);
  if (overdue.length === 0) return null;

  return overdue.reduce((oldest, current) => (current.endsOn < oldest.endsOn ? current : oldest));
}
