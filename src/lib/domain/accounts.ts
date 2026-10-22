import type { AccountKind, RealAccountKind } from '@/types/api';

/**
 * `GET /insights/account-balances` y `GET /insights/dashboard` devuelven TODAS las
 * cuentas direccionables mezcladas — cash, credit, receivable, category e
 * income_source juntas en el mismo arreglo (API-CONTRACT.md §14, confirmado con SQL
 * el 2026-08-17: `fn_account_balances` filtra solo `is_system`, nada más). Filtrar por
 * `kind` para una sección específica ("Cuentas" en Inicio, más adelante en U20) es
 * responsabilidad del frontend, y no lo era hasta este bug real: `InicioView.tsx`
 * pintaba sobres y fuentes de ingreso dentro del bloque de cuentas.
 *
 * Sin test propio todavía — pendiente para una sesión de tests, no lo escribe el
 * implementador (mismo patrón que `isDateInClosedPeriod`, U18).
 */
const REAL_ACCOUNT_KINDS: readonly AccountKind[] = ['cash', 'credit', 'receivable'];

export function isRealAccountKind(kind: AccountKind): kind is RealAccountKind {
  return REAL_ACCOUNT_KINDS.includes(kind);
}
