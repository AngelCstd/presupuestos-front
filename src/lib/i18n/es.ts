/**
 * Única capa de traducción al español (ARCHITECTURE-front.md §10, API-CONTRACT.md §17).
 * Ningún componente escribe una etiqueta de dominio a mano — todo sale de aquí.
 */

// Términos de entidad que no son un `kind`, `status` ni `rolloverType` — el resto del
// glosario de SCREENS-front.md Parte 1 / API-CONTRACT.md §17 que no cabía en las
// secciones de abajo.
const entity = {
  period: 'Quincena',
  allocation: 'Asignación',
  recurringTemplate: 'Recordatorio',
  reversal: 'Corrección',
} as const;

const kind = {
  cash: 'Cuenta',
  credit: 'Tarjeta',
  receivable: 'Te deben',
  category: 'Sobre',
  income_source: 'Fuente de ingreso',
} as const;

const field = {
  assignedCents: 'Asignado',
  spentCents: 'Gastado',
  availableCents: 'Disponible',
  unassignedCents: 'Por asignar',
  balanceCents: 'Saldo',
} as const;

const envelopeStatus = {
  no_budget: 'Sin presupuesto',
  available: 'Disponible',
  depleted: 'Agotado',
  overspent: 'Sobregiro',
} as const;

const rollover = {
  accumulate: 'Acumula',
  reset: 'Reinicia',
} as const;

const budgetImpact = {
  // in_open_period no lleva texto: SCREENS-front.md Parte 1 dice explícitamente
  // "(no se muestra nada)".
  no_period: 'Este movimiento no cae en ninguna quincena',
  compensated: 'Ajustado en la quincena actual',
  uncompensated: 'Sin quincena donde ajustar',
} as const;

const intent = {
  expense: 'Gasto',
  income: 'Ingreso',
  transfer: 'Transferencia',
  loan: 'Préstamo',
  loanRepayment: 'Cobro',
  loanWriteOff: 'Dar por perdido',
  reversal: 'Corrección',
} as const;

export const es = { entity, kind, field, envelopeStatus, rollover, budgetImpact, intent } as const;
