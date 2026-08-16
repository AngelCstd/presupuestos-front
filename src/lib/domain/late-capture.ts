/**
 * STUB — sesión de tests. La implementación real (U5, TASK-front.md) todavía no existe.
 * Acoplada a un detalle de implementación del backend, no al contrato — ver
 * ARCHITECTURE-front.md §14. `LATE_CAPTURE_NOTE_PREFIX` es una forma fijada (TASK §6.2)
 * pero se deja en un valor deliberadamente incorrecto: esta sesión no implementa nada,
 * ni siquiera datos triviales, para que ningún test de esta suite pase por accidente.
 */

export const LATE_CAPTURE_NOTE_PREFIX = '';

export function isLateCaptureNote(note: string | null): boolean {
  throw new Error('isLateCaptureNote: not implemented');
}

export function extractTransactionIdFromNote(note: string | null): string | null {
  throw new Error('extractTransactionIdFromNote: not implemented');
}
