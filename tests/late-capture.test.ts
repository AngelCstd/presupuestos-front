import { describe, expect, it } from 'vitest';
import {
  extractTransactionIdFromNote,
  isLateCaptureNote,
  LATE_CAPTURE_NOTE_PREFIX,
} from '@/lib/domain/late-capture';

const WELL_FORMED_NOTE =
  'Ajuste por captura tardía — tx 47e2117a-5883-4895-8050-00f9883c1fb9, fecha 2026-08-12';

describe('LATE_CAPTURE_NOTE_PREFIX', () => {
  it('es exactamente el prefijo documentado en ARCHITECTURE-front.md §14', () => {
    expect(LATE_CAPTURE_NOTE_PREFIX).toBe('Ajuste por captura tardía');
  });
});

describe('isLateCaptureNote', () => {
  it('detecta una nota bien formada', () => {
    expect(isLateCaptureNote(WELL_FORMED_NOTE)).toBe(true);
  });

  it('detecta por prefijo aunque el resto esté malformado', () => {
    expect(isLateCaptureNote('Ajuste por captura tardía — esto no sigue el formato esperado')).toBe(
      true,
    );
  });

  it('un guión ASCII en vez de la raya larga (U+2014) no casa — el prefijo es literal', () => {
    expect(
      isLateCaptureNote('Ajuste por captura tardía - tx 47e2117a-..., fecha 2026-08-12'),
    ).toBe(false);
  });

  it('note: null devuelve false', () => {
    expect(isLateCaptureNote(null)).toBe(false);
  });

  it('una nota sin relación no casa', () => {
    expect(isLateCaptureNote('Asignación manual de agosto')).toBe(false);
  });
});

describe('extractTransactionIdFromNote', () => {
  it('extrae el transactionId de una nota bien formada', () => {
    expect(extractTransactionIdFromNote(WELL_FORMED_NOTE)).toBe(
      '47e2117a-5883-4895-8050-00f9883c1fb9',
    );
  });

  it('una nota malformada devuelve null sin lanzar — la confirmación se muestra sin enlace', () => {
    const malformed = 'Ajuste por captura tardía — esto no sigue el formato esperado';
    expect(() => extractTransactionIdFromNote(malformed)).not.toThrow();
    expect(extractTransactionIdFromNote(malformed)).toBeNull();
  });

  it('note: null devuelve null', () => {
    expect(extractTransactionIdFromNote(null)).toBeNull();
  });
});
