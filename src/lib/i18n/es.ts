/**
 * Única capa de traducción al español (ARCHITECTURE-front.md §10, API-CONTRACT.md §17).
 * Ningún componente escribe una etiqueta de dominio a mano — todo sale de aquí.
 */

// Términos de entidad que no son un `kind`, `status` ni `rolloverType` — el resto del
// glosario de SCREENS-front.md Parte 1 / API-CONTRACT.md §17 que no cabía en las
// secciones de abajo.
const entity = {
  period: 'Periodo',
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

const periodStatus = {
  open: 'Abierto',
  closed: 'Cerrado',
} as const;

// SCREENS-front.md `/periodos/[periodId]/cerrar`: el texto de cada `action` envuelve un
// monto que se pinta con <Money>, así que se parte en `before`/`after` en vez de
// interpolar el número como string (rompería BigInt→string en formatMoney).
const closeAction = {
  carry_forward: { before: 'Se arrastra ', after: ' a la siguiente' },
  release: { before: 'Se liberan ', after: ' para asignar' },
  carry_deficit: { before: 'Se arrastra un déficit de ', after: '' },
  none: { before: 'Sin cambios', after: '' },
} as const;

const budgetImpact = {
  // in_open_period no lleva texto: SCREENS-front.md Parte 1 dice explícitamente
  // "(no se muestra nada)".
  no_period: 'Este movimiento no cae en ningún periodo',
  compensated: 'Ajustado en el periodo actual',
  uncompensated: 'Sin periodo donde ajustar',
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

// Etiquetas de navegación (SCREENS-front.md Parte 2, tab bar). No son la traducción de
// un campo o enum del contrato, pero varias comparten palabra con el glosario (p.ej.
// "Sobres" contiene "Sobre") — viven aquí igual, para que no haya una segunda copia
// que se desalinee si el glosario cambia.
const nav = {
  inicio: 'Inicio',
  sobres: 'Sobres',
  movimientos: 'Movimientos',
  mas: 'Más',
} as const;

export const es = {
  entity,
  kind,
  field,
  envelopeStatus,
  rollover,
  periodStatus,
  closeAction,
  budgetImpact,
  intent,
  nav,
} as const;
