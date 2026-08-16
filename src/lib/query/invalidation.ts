import type { MutationName, QueryKey } from '@/types/api';

/**
 * STUB — sesión de tests. La implementación real (U10, TASK-front.md) todavía no existe.
 * Firma fijada en TASK-front.md §6.1. La matriz completa vive en ARCHITECTURE-front.md §5.2.
 */

export function invalidationFor(mutation: MutationName): readonly QueryKey[] {
  throw new Error('invalidationFor: not implemented');
}
