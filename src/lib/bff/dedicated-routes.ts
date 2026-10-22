/**
 * Los 9 endpoints idempotentes (API-CONTRACT.md §5) tienen handler dedicado en el BFF,
 * a una URL que NO coincide con la ruta real de la API (ARCHITECTURE-front.md §4.3:
 * prefijo `tx/` o `recurring/.../confirm`, no `transactions/...` ni
 * `recurring-templates/...`). Cualquier código del navegador que llame a uno de estos
 * con la ruta del contrato en vez de con la del BFF cae en el catch-all, que lo
 * rechaza con 404 — a propósito, porque esa ruta no debe ser alcanzable ahí.
 *
 * Encontrado en producción de este repo (2026-08-16): `OnboardingForm.tsx` llamaba
 * `bffFetch({ path: '/transactions/opening-balances' })` en vez de
 * `/tx/opening-balances`. Este archivo existe para que ese error de un dígito de
 * carpeta no se pueda repetir en U18/U19/U22 — usa estas constantes, no la ruta del
 * contrato a mano.
 */
export const BFF_DEDICATED_ROUTES = {
  expenses: '/tx/expenses',
  incomes: '/tx/incomes',
  transfers: '/tx/transfers',
  loans: '/tx/loans',
  loanRepayments: '/tx/loan-repayments',
  loanWriteOffs: '/tx/loan-write-offs',
  openingBalances: '/tx/opening-balances',
  reversal: (transactionId: string) => `/tx/${transactionId}/reversal`,
  confirmRecurring: (templateId: string) => `/recurring/${templateId}/confirm`,
} as const;
