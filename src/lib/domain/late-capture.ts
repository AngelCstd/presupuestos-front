/**
 * Acoplado a un detalle de implementación del backend, no al contrato — ver
 * ARCHITECTURE-front.md §14. Todo el acoplamiento vive en este archivo.
 */

// Raya larga U+2014, no un guión ASCII (ARCHITECTURE-front.md §14). El prefijo es literal.
export const LATE_CAPTURE_NOTE_PREFIX = 'Ajuste por captura tardía';

const NOTE_PREFIX_WITH_DASH = `${LATE_CAPTURE_NOTE_PREFIX} —`;

const NOTE_PATTERN = /^Ajuste por captura tardía — tx ([0-9a-f-]{36}), fecha \d{4}-\d{2}-\d{2}$/;

export function isLateCaptureNote(note: string | null): boolean {
  if (note === null) return false;
  return note.startsWith(NOTE_PREFIX_WITH_DASH);
}

export function extractTransactionIdFromNote(note: string | null): string | null {
  if (note === null) return null;
  const match = NOTE_PATTERN.exec(note);
  return match?.[1] ?? null;
}
