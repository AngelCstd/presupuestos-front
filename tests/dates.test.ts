import { describe, expect, it } from 'vitest';
import { formatInstant, todayInTimeZone } from '@/lib/domain/dates';
import { readSourceFile } from './helpers/source-files';

describe('todayInTimeZone — la unidad de mayor riesgo del proyecto', () => {
  it('23:00 en CDMX (UTC-6) devuelve el día en curso, no el siguiente', () => {
    // 2026-08-09 23:00 en America/Mexico_City (UTC-6, sin horario de verano) = 2026-08-10T05:00:00Z.
    const now = new Date('2026-08-10T05:00:00Z');
    expect(todayInTimeZone('America/Mexico_City', now)).toBe('2026-08-09');
  });

  it('00:30 en CDMX devuelve el mismo día', () => {
    // 2026-08-09 00:30 en America/Mexico_City = 2026-08-09T06:30:00Z.
    const now = new Date('2026-08-09T06:30:00Z');
    expect(todayInTimeZone('America/Mexico_City', now)).toBe('2026-08-09');
  });

  it('borde inverso: 00:30 en una zona UTC+ devuelve el día local, un día adelante del día UTC', () => {
    // 2026-08-10 00:30 en Asia/Tokyo (UTC+9) = 2026-08-09T15:30:00Z — el día UTC es el 9,
    // pero el día local (el que hay que devolver) es el 10.
    const now = new Date('2026-08-09T15:30:00Z');
    expect(todayInTimeZone('Asia/Tokyo', now)).toBe('2026-08-10');
  });

  it('el mismo instante da días distintos en zonas distintas — la zona nunca sale del entorno', () => {
    const now = new Date('2026-08-10T05:00:00Z');
    const cdmx = todayInTimeZone('America/Mexico_City', now);
    const tokyo = todayInTimeZone('Asia/Tokyo', now);
    expect(cdmx).not.toBe(tokyo);
  });
});

describe('formatInstant — createdAt en UTC pintado en hora local', () => {
  it('no lanza y devuelve una cadena no vacía', () => {
    expect(() => formatInstant('2026-08-09T21:14:02.331Z', 'America/Mexico_City')).not.toThrow();
    expect(formatInstant('2026-08-09T21:14:02.331Z', 'America/Mexico_City')).not.toBe('');
  });

  it('la zona horaria afecta el resultado — no es un passthrough del ISO original', () => {
    const iso = '2026-08-09T21:14:02.331Z';
    const cdmx = formatInstant(iso, 'America/Mexico_City');
    const tokyo = formatInstant(iso, 'Asia/Tokyo');
    expect(cdmx).not.toBe(iso);
    expect(cdmx).not.toBe(tokyo);
  });
});

describe('dates.ts nunca usa toISOString() — análisis estático, no ejecución', () => {
  it('resuelve fechas con Intl.DateTimeFormat (ARCHITECTURE §8.2) y nunca con toISOString()', () => {
    const source = readSourceFile('lib/domain/dates.ts');
    // Afirmación positiva primero: que sí exista lógica real de fecha, para que esta
    // prueba no pase vacía contra un archivo sin implementar (TASK-front.md §5.1).
    expect(source).toContain('Intl.DateTimeFormat');
    // Es el bug exacto que esta unidad existe para evitar (TASK-front.md U3).
    expect(source).not.toContain('toISOString');
  });
});
