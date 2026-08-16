import { describe, expect, it } from 'vitest';
import { selectClosablePeriod } from '@/lib/domain/periods';
import type { PeriodStatus } from '@/types/api';

// Aritmética de fecha propia del test, sobre una fecha de referencia fija (no la fecha
// real de hoy): selectClosablePeriod recibe `today` como parámetro explícito, así que
// no hay reloj que congelar ni "hoy" real del que depender (TASK-front.md §5.1). Este
// toISOString es del helper del test, no de lib/domain/dates.ts — esa prohibición es
// solo para el archivo fuente real.
function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const TODAY = '2026-08-20';

function period(id: string, endsOn: string, status: PeriodStatus = 'open') {
  return { id, endsOn, status };
}

describe('selectClosablePeriod', () => {
  it('con varias quincenas vencidas, elige solo la más antigua', () => {
    const oldest = period('p-old', addDays(TODAY, -10));
    const middle = period('p-mid', addDays(TODAY, -3));
    const future = period('p-future', addDays(TODAY, 5));

    const result = selectClosablePeriod([oldest, middle, future], TODAY);

    expect(result).toEqual(oldest);
  });

  it('el orden de la lista de entrada no importa', () => {
    const oldest = period('p-old', addDays(TODAY, -10));
    const middle = period('p-mid', addDays(TODAY, -3));

    expect(selectClosablePeriod([middle, oldest], TODAY)).toEqual(oldest);
    expect(selectClosablePeriod([oldest, middle], TODAY)).toEqual(oldest);
  });

  it('sin ninguna quincena vencida, no hay nada que cerrar', () => {
    const future1 = period('p-1', addDays(TODAY, 1));
    const future2 = period('p-2', addDays(TODAY, 15));

    expect(selectClosablePeriod([future1, future2], TODAY)).toBeNull();
  });

  it('una quincena cuyo endsOn es exactamente hoy no cuenta como vencida (endsOn es inclusivo)', () => {
    const endsToday = period('p-today', TODAY);

    expect(selectClosablePeriod([endsToday], TODAY)).toBeNull();
  });

  it('con una sola quincena vencida, la devuelve', () => {
    const overdue = period('p-1', addDays(TODAY, -1));

    expect(selectClosablePeriod([overdue], TODAY)).toEqual(overdue);
  });

  it('lista vacía devuelve null', () => {
    expect(selectClosablePeriod([], TODAY)).toBeNull();
  });
});
