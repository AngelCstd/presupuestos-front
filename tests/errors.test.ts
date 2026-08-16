import { describe, expect, it } from 'vitest';
import { errorMessageFor } from '@/lib/i18n/errors';

// Catálogo completo de API-CONTRACT.md §7.2. Copiado aquí a propósito: el test no debe
// depender de una lista que viva en la implementación, o dejaría de detectar un código
// del contrato que el catálogo olvidó traducir.
const CONTRACT_ERROR_CODES = [
  // 400
  'VALIDATION_FAILED',
  'IDEMPOTENCY_KEY_REQUIRED',
  'IDEMPOTENCY_KEY_INVALID',
  'INVALID_CURSOR',
  'INVALID_TIMEZONE',
  // 401 / 403
  'UNAUTHORIZED',
  'PROFILE_DELETED',
  'SYSTEM_ACCOUNT_NOT_ADDRESSABLE',
  'OWNERSHIP_MISMATCH',
  // 404
  'ACCOUNT_NOT_FOUND',
  'CATEGORY_NOT_FOUND',
  'INCOME_SOURCE_NOT_FOUND',
  'TRANSACTION_NOT_FOUND',
  'PERIOD_NOT_FOUND',
  'ALLOCATION_NOT_FOUND',
  'RECURRING_TEMPLATE_NOT_FOUND',
  'NO_CURRENT_PERIOD',
  // 409
  'IDEMPOTENCY_IN_FLIGHT',
  'DUPLICATE_ACCOUNT_NAME',
  'ACCOUNT_NOT_EMPTY',
  'ACCOUNT_ARCHIVED',
  'ALREADY_ARCHIVED',
  'NOT_ARCHIVED',
  'CURRENCY_LOCKED',
  'CATEGORY_HAS_ALLOCATIONS',
  'ALREADY_REVERSED',
  'CANNOT_REVERSE_REVERSAL',
  'IMMUTABLE_LEDGER',
  'PERIOD_OVERLAP',
  'PERIOD_CLOSED',
  'PERIOD_ALREADY_CLOSED',
  'NEXT_PERIOD_REQUIRED',
  'NEXT_PERIOD_CLOSED',
  'EARLIER_PERIOD_OPEN',
  'PERIOD_NOT_EMPTY',
  'DUPLICATE_ROLLOVER',
  'RESOURCE_IN_USE',
  // 422
  'INVALID_ACCOUNT_ROLE',
  'SPLIT_TOTAL_MISMATCH',
  'SAME_ACCOUNT_TRANSFER',
  'SAME_CATEGORY_MOVE',
  'EMPTY_OPENING_BALANCE',
  'PAYMENT_ACCOUNT_REQUIRED',
  'REVERSAL_DATE_LOCKED',
  'MIXED_CURRENCY',
  'INVALID_BUDGET_CATEGORY',
  'UNBALANCED_TRANSACTION',
  'INVALID_REVERSAL',
  'INVALID_INPUT',
  // 500
  'INTERNAL_ERROR',
] as const;

// Texto literal de ARCHITECTURE-front.md §11.
const FALLBACK_MESSAGE = 'Algo salió mal. Vuelve a intentar.';

describe('errorMessageFor', () => {
  it.each(CONTRACT_ERROR_CODES)('tiene texto en español propio para %s', (code) => {
    const message = errorMessageFor(code);
    expect(message).toBeTruthy();
    expect(message).not.toBe(FALLBACK_MESSAGE);
  });

  it('un código que no existe en el catálogo devuelve el fallback genérico, sin lanzar', () => {
    expect(() => errorMessageFor('CODIGO_QUE_NO_EXISTE')).not.toThrow();
    expect(errorMessageFor('CODIGO_QUE_NO_EXISTE')).toBe(FALLBACK_MESSAGE);
  });

  it('el message del servidor nunca se usa como llave — un texto de mensaje real cae al fallback', () => {
    // Primero, una comprobación positiva: un code real SÍ resuelve a su texto propio.
    expect(errorMessageFor('PERIOD_CLOSED')).not.toBe(FALLBACK_MESSAGE);
    // Ahora la negativa: pasar algo que parece un `message` de servidor, no un `code`,
    // debe caer al fallback igual que cualquier código desconocido — la función nunca
    // hace passthrough de texto libre.
    const serverStyleMessage = 'El periodo está cerrado y sus asignaciones no se pueden modificar.';
    expect(errorMessageFor(serverStyleMessage)).toBe(FALLBACK_MESSAGE);
  });
});
