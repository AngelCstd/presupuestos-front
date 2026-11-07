import { describe, expect, it } from 'vitest';
import { formatCalendarDate } from '@/lib/domain/dates';

describe('formatCalendarDate', () => {
  it('formatea fechas estándar YYYY-MM-DD en español de México', () => {
    expect(formatCalendarDate('2026-10-23')).toBe('23 oct 2026');
    expect(formatCalendarDate('2026-11-01')).toBe('1 nov 2026');
    expect(formatCalendarDate('2026-01-15')).toBe('15 ene 2026');
    expect(formatCalendarDate('2026-12-31')).toBe('31 dic 2026');
  });

  it('no sufre desfase por huso horario (opera en UTC)', () => {
    // Si operara con huso local de forma descuidada, el día podría cambiar
    expect(formatCalendarDate('2026-05-01')).toBe('1 may 2026');
    expect(formatCalendarDate('2026-09-16')).toBe('16 sep 2026');
  });

  it('maneja valores vacíos, nulos o malformados con gracia', () => {
    expect(formatCalendarDate('')).toBe('');
    expect(formatCalendarDate(null)).toBe('');
    expect(formatCalendarDate(undefined)).toBe('');
    expect(formatCalendarDate('invalido')).toBe('invalido');
    expect(formatCalendarDate('2026-xx-yy')).toBe('2026-xx-yy');
  });
});
