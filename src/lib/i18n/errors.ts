/**
 * Catálogo completo de API-CONTRACT.md §7.2, traducido al español. El `message` del
 * servidor nunca se usa aquí — solo se programa contra `code`.
 */

const FALLBACK_MESSAGE = 'Algo salió mal. Vuelve a intentar.';

const ERROR_MESSAGES: Record<string, string> = {
  // 400 — la petición está mal formada
  VALIDATION_FAILED: 'Algunos datos no son válidos. Revisa el formulario.',
  IDEMPOTENCY_KEY_REQUIRED: 'Ocurrió un problema técnico al enviar esto. Inténtalo de nuevo.',
  IDEMPOTENCY_KEY_INVALID: 'Ocurrió un problema técnico al enviar esto. Inténtalo de nuevo.',
  INVALID_CURSOR: 'No se pudo cargar más contenido. Vuelve a intentar.',
  INVALID_TIMEZONE: 'Esa zona horaria no es válida.',

  // 401 / 403 — identidad y permisos
  UNAUTHORIZED: 'Tu sesión terminó. Vuelve a iniciar sesión.',
  PROFILE_DELETED: 'Tu cuenta fue dada de baja.',
  SYSTEM_ACCOUNT_NOT_ADDRESSABLE: 'Esa cuenta no está disponible.',
  OWNERSHIP_MISMATCH: 'Algo salió mal con este recurso. Vuelve a intentar.',

  // 404 — no existe, o no es tuyo
  ACCOUNT_NOT_FOUND: 'No encontramos esa cuenta.',
  CATEGORY_NOT_FOUND: 'No encontramos ese sobre.',
  INCOME_SOURCE_NOT_FOUND: 'No encontramos esa fuente de ingreso.',
  TRANSACTION_NOT_FOUND: 'No encontramos ese movimiento.',
  PERIOD_NOT_FOUND: 'No encontramos ese periodo.',
  ALLOCATION_NOT_FOUND: 'No encontramos esa asignación.',
  RECURRING_TEMPLATE_NOT_FOUND: 'No encontramos ese recordatorio.',
  NO_CURRENT_PERIOD: 'No hay periodo abierto.',

  // 409 — el estado del recurso no permite la operación
  IDEMPOTENCY_IN_FLIGHT: 'Estamos procesando tu envío anterior.',
  DUPLICATE_ACCOUNT_NAME: 'Ya existe algo con ese nombre. Usa otro.',
  ACCOUNT_NOT_EMPTY: 'Salda o transfiere el dinero antes de archivar esta cuenta.',
  ACCOUNT_ARCHIVED: 'Esta cuenta está archivada y no admite movimientos nuevos.',
  ALREADY_ARCHIVED: 'Esto ya estaba archivado.',
  NOT_ARCHIVED: 'Esto no estaba archivado.',
  CURRENCY_LOCKED: 'Esta cuenta ya tiene movimientos; su moneda no se puede cambiar.',
  CATEGORY_HAS_ALLOCATIONS: 'Quita primero el presupuesto de este sobre en el periodo actual.',
  ALREADY_REVERSED: 'Este movimiento ya está corregido.',
  CANNOT_REVERSE_REVERSAL: 'Una corrección no se corrige; registra un movimiento nuevo.',
  IMMUTABLE_LEDGER: 'Ese registro no se puede modificar ni borrar.',
  PERIOD_OVERLAP: 'Esas fechas se traslapan con otro periodo.',
  PERIOD_CLOSED: 'Este periodo está cerrado y ya no admite cambios.',
  PERIOD_ALREADY_CLOSED: 'Este periodo ya estaba cerrado.',
  NEXT_PERIOD_REQUIRED: 'Necesitas crear el siguiente periodo antes de cerrar esta.',
  NEXT_PERIOD_CLOSED: 'El siguiente periodo ya está cerrado.',
  EARLIER_PERIOD_OPEN: 'Cierra primero el periodo anterior.',
  PERIOD_NOT_EMPTY: 'Este periodo tiene asignaciones. Bórralas antes de eliminarla.',
  DUPLICATE_ROLLOVER: 'Este periodo ya se estaba cerrando. Vuelve a intentar.',
  RESOURCE_IN_USE: 'Esto está en uso y no se puede modificar.',

  // 422 — la petición es coherente pero el contenido no es válido para el dominio
  INVALID_ACCOUNT_ROLE: 'Esa cuenta no es válida para esta operación.',
  SPLIT_TOTAL_MISMATCH: 'Las partes no suman el total.',
  SAME_ACCOUNT_TRANSFER: 'El origen y el destino no pueden ser la misma cuenta.',
  SAME_CATEGORY_MOVE: 'El origen y el destino no pueden ser el mismo sobre.',
  EMPTY_OPENING_BALANCE: 'Captura al menos un saldo distinto de cero.',
  PAYMENT_ACCOUNT_REQUIRED: 'Elige una cuenta de pago.',
  REVERSAL_DATE_LOCKED: 'No puedes cambiar la fecha de esta corrección.',
  MIXED_CURRENCY: 'No puedes mezclar cuentas de monedas distintas en un mismo movimiento.',
  INVALID_BUDGET_CATEGORY: 'Ese sobre no es válido.',
  UNBALANCED_TRANSACTION: 'Algo salió mal con este movimiento. Vuelve a intentar.',
  INVALID_REVERSAL: 'Esta corrección no es válida.',
  INVALID_INPUT: 'Algunos datos no son válidos.',

  // 500
  INTERNAL_ERROR: 'Algo salió mal en el servidor. Vuelve a intentar más tarde.',
};

export function errorMessageFor(code: string): string {
  return ERROR_MESSAGES[code] ?? FALLBACK_MESSAGE;
}
