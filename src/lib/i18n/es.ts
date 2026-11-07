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
  spentInPeriod: 'Gastado este periodo',
  availableCents: 'Disponible',
  unassignedCents: 'Por asignar',
  balanceCents: 'Saldo',
  totalLifetimeSpent: 'Gasto acumulado histórico',
  bookedAt: 'Fecha',
  description: 'Descripción',
} as const;

const envelopeStatus = {
  no_budget: 'Sin presupuesto',
  available: 'Disponible',
  depleted: 'Sin saldo',
  overspent: 'Sobregiro',
} as const;

const rollover = {
  accumulate: 'Acumula',
  reset: 'Reinicia',
} as const;

const rolloverDesc = {
  accumulate: 'Lo que no te gastes se suma al presupuesto del siguiente periodo.',
  reset: 'Lo que no te gastes vuelve a Por asignar al cerrar el periodo.',
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

const intentDesc = {
  income: 'Dinero que entra a tus cuentas bancarias',
  transfer: 'Entre tus cuentas o para pagar tarjeta de crédito',
  loan: 'Dinero que le prestaste a alguien',
  loanRepayment: 'Registrar que te pagaron un préstamo pendiente',
  loanWriteOff: 'Cancelar un préstamo que no vas a cobrar',
} as const;

// Etiquetas de navegación (SCREENS-front.md Parte 2, tab bar). No son la traducción de
// un campo o enum del contrato, pero varias comparten palabra con el glosario (p.ej.
// "Sobres" contiene "Sobre") — viven aquí igual, para que no haya una segunda copia
// que se desalinee si el glosario cambia.
const nav = {
  inicio: 'Inicio',
  sobres: 'Sobres',
  gasto: 'Gasto',
  movimientos: 'Movimientos',
  mas: 'Más',
  cuentas: 'Cuentas',
} as const;

const envelopeCard = {
  noBudgetPrompt: 'Sin presupuesto asignado este periodo',
  lateCaptureNotice:
    'Este sobregiro no es por compras de este periodo (llevas $0 gastados): proviene de un gasto registrado con fecha de un periodo anterior ya cerrado. Se cubre con el presupuesto de este periodo.',
  saveAction: 'Guardar',
  changeAction: 'Cambiar',
  cancelAction: 'Cancelar',
  adjustBudgetAction: 'Ajustar presupuesto',
  assignBudgetAction: 'Asignar presupuesto',
  allocatedBudgetLabel: 'Presupuesto asignado:',
  coverAction: 'Cubrir',
  moveAction: 'Mover',
  remainingPrefix: 'Te quedan ',
  overspentPrefix: 'Te pasaste por ',
  spentOf: ' gastados de ',
  of: ' de ',
  assignedSuffix: ' asignados',
  lateCaptureAdjustment: 'Ajuste de periodo cerrado',
} as const;

const expenseCapture = {
  title: 'Gasto',
  amount: 'Monto',
  amountPlaceholder: '0.00',
  envelope: 'Sobre',
  chooseEnvelope: 'Elige un sobre',
  paidFromAccount: 'Cuenta de pago',
  chooseAccount: 'Elige una cuenta',
  date: 'Fecha',
  description: 'Descripción (opcional)',
  splitLabel: 'Repartir entre varios sobres',
  addSplitEnvelope: 'Agregar otro sobre',
  splitMismatch: 'La suma de los sobres y la parte prestada debe coincidir con el total del gasto.',
  lentToLabel: 'Parte prestada (te lo van a pagar)',
  lentToAccount: '¿Quién te lo debe?',
  lentToAmount: 'Monto que te deben',
  saveExpense: 'Guardar gasto',
  cancel: 'Cancelar',
  closedPeriodWarning: 'Esa fecha cae en un periodo ya cerrado. El gasto se guardará y se ajustará en el presupuesto de este periodo.',
  noEnvelopesTitle: 'No tienes sobres',
  noEnvelopesDescription: 'Un sobre es una bolsa de dinero con nombre: Comida, Transporte, lo que uses.',
  createEnvelope: 'Crear sobre',
  useSuggestedEnvelopes: 'Usar los sugeridos',
  inEnvelope: ' en ',
  residualCentNotice: (envelopeName: string) =>
    `El centavo sobrante se asigna a ${envelopeName}. Puedes editar cada monto.`,
} as const;

const inicio = {
  noPeriodTitle: 'No hay periodo abierto',
  noPeriodDescription: 'Tus gastos se siguen registrando, pero no cuentan en ningún presupuesto.',
  createPeriod: 'Crear periodo',
  periodEndsToday: 'Termina hoy',
  periodEnded: 'Periodo terminado',
  daysRemainingSuffix: ' restantes',
  allAssignedTitle: 'Todo repartido',
  allAssignedDescription: 'Cada peso tiene un sobre.',
  nothingAssignedTitle: 'Aún no repartes nada',
  nothingAssignedDescription: 'Cuando registres un ingreso vas a ver aquí cuánto tienes por asignar.',
  registerIncome: 'Registrar ingreso',
  readyToAssign: 'Listo para repartir en tus sobres.',
  assignAction: 'Repartir',
  negativeRealMoneyTitle: 'Sin dinero libre para repartir',
  negativeRealMoneySubtitle: 'Tus tarjetas superan a tu efectivo',
  negativeRealMoneyDescription:
    'Todo tu efectivo actual está respaldando tus consumos en tarjeta. Para tener dinero libre que puedas repartir en sobres, necesitas registrar un ingreso o cobrar un préstamo pendiente.',
  viewAccounts: 'Ver cuentas y tarjetas',
  overspentHeroTitle: 'Sobres por ajustar',
  reviewEnvelopes: 'Revisar sobres',
  coverOverspend: 'Cubrir',
  periodSpentHeader: 'Gastado este periodo',
  ofTotal: ' de ',
  paceTracker: (day: number, totalDays: number, percent: number) =>
    `Día ${day} de ${totalDays} · Llevas el ${percent}% del presupuesto`,
  envelopesTitle: 'Sobres del periodo',
  viewEnvelopes: 'Ver sobres',
  noEnvelopesBudgeted: 'Ninguno de tus sobres tiene presupuesto este periodo',
  noExpensesYet: 'Sin gastos todavía',
  unbudgetedBanner: (count: number) =>
    count === 1
      ? '1 movimiento no cae en ningún periodo.'
      : `${count} movimientos no caen en ningún periodo.`,
  viewPending: 'Ver',
  accountsTitle: 'Cuentas y saldos',
  cashTitle: 'Efectivo y bancos',
  creditTitle: 'Tarjetas de crédito',
  receivableTitle: 'Te deben',
  noBudgetCount: (count: number) =>
    count === 1
      ? '1 sobre sin presupuesto este periodo'
      : `${count} sobres sin presupuesto este periodo`,
  overspentCountSuffix: ' sobres gastaron más de lo asignado.',
  overspentSingleSuffix: ' sobre gastó más de lo asignado.',
} as const;

const transactionsHistory = {
  title: 'Movimientos',
  subtitle: 'Historial de movimientos',
  filterButton: 'Filtrar',
  hideFiltersButton: 'Ocultar filtros',
  fromDate: 'Desde',
  toDate: 'Hasta',
  allAccounts: 'Todas las cuentas',
  allEnvelopes: 'Todos los sobres',
  clearFilters: 'Quitar filtros',
  loadMore: 'Cargar más',
  correctedBadge: 'Corregida',
  correctionBadge: 'Corrección',
  emptyNoRecordsTitle: 'Aún no registras nada',
  emptyNoRecordsDesc: 'Captura tu primer gasto y aquí va a quedar el historial.',
  emptyNoRecordsAction: 'Capturar gasto',
  emptyFilteredTitle: 'Ningún movimiento con estos filtros',
  emptyPeriodTitle: 'Sin gastos todavía',
  unbudgetedBanner: (count: number) =>
    count === 1
      ? '1 movimiento no cae en ningún periodo.'
      : `${count} movimientos no caen en ningún periodo.`,
} as const;

const envelopesView = {
  title: 'Sobres',
  subtitle: 'Presupuesto y sobres del periodo',
  noPeriodTitle: 'Necesitas un periodo abierto para repartir',
  createPeriodAction: 'Crear periodo',
  noEnvelopesTitle: 'No tienes sobres',
  noEnvelopesDesc: 'Un sobre es una bolsa de dinero con nombre: Comida, Transporte, lo que uses.',
  useSuggestionsAction: 'Usar los sugeridos',
  archiveAction: 'Archivar sobre',
} as const;

const accountsView = {
  title: 'Cuentas y tarjetas',
  subtitle: 'Saldos de cuentas, tarjetas y préstamos',
  newAccountButton: 'Nueva cuenta',
  newAccountTitle: 'Nueva cuenta',
  nameLabel: 'Nombre',
  namePlaceholder: 'Ej. BBVA Débito, Efectivo...',
  kindLabel: 'Tipo de cuenta',
  createAction: 'Crear cuenta',
  archiveAction: 'Archivar cuenta',
  cashSectionTitle: 'Efectivo y bancos',
  creditSectionTitle: 'Tarjetas de crédito',
  receivableSectionTitle: 'Te deben',
  totalCashLabel: 'Total efectivo',
  totalDebtLabel: 'Total deuda',
  totalReceivableLabel: 'Total por cobrar',
  realMoneyLabel: 'Dinero neto',
  realMoneySubtitle: 'Efectivo menos lo que debes en tarjetas',
  negativeRealMoneyBadge: 'Tus tarjetas superan a tu efectivo',
  negativeCashBadge: 'Saldo negativo',
  negativeCashAlert: 'Esta cuenta tiene saldo negativo. Revisa si falta registrar un retiro de cajero, un ingreso o un ajuste de saldo.',
  emptyCash: 'No tienes cuentas de efectivo',
  emptyCredit: 'No tienes tarjetas registradas',
  emptyReceivable: 'Nadie te debe nada',
  accountKindDetail: {
    cash: 'Cuenta de efectivo',
    credit: 'Tarjeta de crédito',
    receivable: 'Cuenta por cobrar',
  },
} as const;

const masView = {
  title: 'Más',
  subtitle: 'Ajustes, perfil y preferencias',
  profileSectionTitle: 'Perfil y preferencias',
  configSectionTitle: 'Configuración y cuenta',
  emailLabel: 'Correo',
  timezoneLabel: 'Zona horaria',
  changeTimezoneAction: 'Cambiar',
  cancelAction: 'Cancelar',
  saveTimezoneAction: 'Guardar zona horaria',
  timezoneDialogTitle: 'Cambiar zona horaria',
  timezoneDialogMessage:
    'Esto cambia en qué periodo caen los gastos que captures a partir de ahora — el punto en que empieza y termina hoy se mueve con la zona horaria.',
  timezoneDialogConfirm: 'Cambiar',
  incomeSourcesTitle: 'Fuentes de ingreso',
  incomeSourceAccumulatedLabel: 'Total histórico acumulado',
  newIncomeSourceAction: 'Nueva fuente de ingreso',
  emptyIncomeSourcesTitle: 'No tienes fuentes de ingreso',
  emptyIncomeSourcesDesc: 'Sirven para saber de dónde viene tu dinero.',
  navigationTitle: 'Secciones',
  accountsLink: 'Cuentas y tarjetas',
  periodsLink: 'Periodos',
  recurringLink: 'Recordatorios',
  archivedTitle: 'Archivadas',
  emptyArchived: 'No tienes nada archivado.',
  reactivateAction: 'Reactivar',
  incompleteSetupTitle: 'Configuración pendiente',
  incompleteSetupDesc: 'Aún te falta configurar tus primeros sobres o cuentas para completar tu inicio.',
  finishSetupLink: 'Terminar configuración inicial',
  signOutAction: 'Cerrar sesión',
} as const;

const recordatoriosView = {
  title: 'Recordatorios',
  subtitle: 'Gastos fijos y pagos recurrentes del mes',
  newReminderButton: 'Nuevo recordatorio',
  targetEnvelope: 'Sobre destino',
  dueBadge: 'Pendiente',
  confirmAction: 'Confirmar',
  readyToConfirm: 'Listo para registrar',
  scheduled: 'Próximo cargo',
  emptyTitle: 'No tienes recordatorios',
  emptyDescription: 'Sirven para lo que pagas cada mes: renta, wifi, suscripciones.',
  emptyAction: 'Crear recordatorio',
  allConfirmedTitle: 'Sin pagos vencidos',
  allConfirmedSubtitle: 'Tus compromisos están al corriente. Puedes registrar cualquiera por adelantado.',
} as const;

const closePeriodView = {
  freezeAlert:
    'Al cerrar, las asignaciones de este periodo quedan congeladas para siempre. Es el último momento para editarlas.',
  updatingPreview: 'Actualizando consecuencias de cierre...',
  impactTitle: 'Impacto total al cerrar',
  impactAssigned: 'Total asignado congelado',
  impactAssignedDesc: 'Suma neta fijada en el historial de este periodo',
  impactCarryForward: 'Traspaso a siguiente periodo',
  impactCarryForwardDesc: 'Remanente acumulable transferido',
  impactReleased: 'Liberado para asignar',
  impactReleasedDesc: 'Sobrante devuelto al fondo común',
  impactDeficit: 'Déficit arrastrado',
  impactDeficitDesc: 'Deuda que restará en el siguiente periodo',
  impactNoDeficit: 'Sin deuda pendiente',
  deficitsSectionTitle: 'Sobres con déficit a resolver',
  deficitsSectionSubtitle: 'Si no los cubres ahora, se arrastrarán como deuda al siguiente periodo.',
  coverAction: 'Cubrir',
  noSourcesToCover: 'No hay de dónde cubrir este déficit',
  sourcesAvailableToCover: 'Puedes cubrirlo desde otro sobre con saldo',
  normalSectionTitle: 'Sobres que se traspasan o liberan',
  assignedLabel: 'Asignado',
  spentLabel: 'Gastado',
  remnantLabel: 'Remanente',
  allocationsTitle: 'Asignaciones de este periodo',
  allocationsSubtitle: 'Puedes borrar una asignación si necesitas corregirla antes del cierre.',
  deleteAction: 'Borrar',
  confirmDeleteTitle: 'Borrar asignación',
  confirmDeleteNormal: '¿Borrar esta asignación?',
  confirmDeleteLateCapture:
    'Este ajuste cubre un gasto de un periodo ya cerrado. Si lo borras, ese gasto queda sin cubrir.',
  viewOriginMovement: 'Ver el movimiento de origen',
  blockersTitle: 'Pendientes antes de cerrar',
  createNextPeriodAction: 'Crear el siguiente periodo',
  closeWithDeficit: (count: number) =>
    `Cerrar periodo arrastrando deuda en ${count} ${count === 1 ? 'sobre' : 'sobres'}`,
  closeWithoutDeficit: 'Cerrar periodo sin déficits pendientes',
  irreversibleNotice: 'Esta acción no se puede deshacer. Las asignaciones quedarán congeladas para siempre.',
  outOfOrderTitle: 'Este periodo no se puede cerrar todavía',
  outOfOrderDesc:
    'Para no dejar huecos en tu historial, debes cerrar primero tus periodos anteriores en orden cronológico.',
  outOfOrderAction: (range: string) => `Ir a cerrar periodo ${range}`,
  toastSuccessWithRange: (range: string) => `Periodo cerrado con éxito. Ahora estás en ${range}`,
  toastSuccess: 'Periodo cerrado con éxito.',
} as const;

const netMoneyBreakdown = {
  cashRowLabel: 'Efectivo y bancos',
  cashRowDesc: 'Saldo total en cuentas de débito y efectivo',
  debtRowLabel: 'Deuda en tarjetas',
  debtRowDesc: 'Consumos acumulados pendientes de pagar',
  netRowLabel: 'Dinero neto',
  netRowDesc: 'Efectivo menos deuda en tarjetas',
} as const;

const netMoneySheet = {
  title: 'Dinero neto',
  subtitle: 'Efectivo menos lo que debes en tarjetas',
  notePositive:
    'Tu dinero neto es el resultado de respaldar al 100% tus tarjetas con el efectivo disponible. Es tu liquidez real después de deudas.',
  noteNegative:
    'Tus consumos en tarjeta superan al efectivo disponible en el banco. Para volver a tener dinero neto positivo necesitas registrar un ingreso o cobrar un préstamo.',
  closeAction: 'Entendido',
} as const;

const unassignedSheet = {
  title: 'Por asignar',
  calculationHeading: 'Cómo se calcula:',
  allocatedRowLabel: 'Apartado en sobres',
  allocatedRowDesc: 'Total asignado a tus sobres este periodo',
  allocatedWithoutOverspendLabel: 'Apartado en sobres sin sobregiro',
  allocatedWithoutOverspendDesc: 'Asignado a sobres con saldo positivo o en cero',
  overspentDeficitLabel: 'Gastado de más en sobres sobregirados',
  overspentDeficitDesc: 'Compras que excedieron lo presupuestado',
  formulaResultLabel: 'Resultado de la fórmula',
  unassignedLabel: 'Por asignar',
  state1: {
    subtitle: 'Dinero libre para repartir en tus sobres.',
    note: 'Tu dinero neto supera lo que has repartido este periodo. Tienes saldo libre que puedes distribuir entre tus sobres desde Inicio o en la sección de Sobres.',
  },
  state2: {
    subtitle: 'Todo tu dinero neto está distribuido en tus sobres.',
    note: 'Todo tu dinero neto está distribuido en tus sobres. No queda saldo libre por asignar ni faltante por cubrir en este periodo.',
  },
  state3: {
    subtitle: 'Sin fondos registrados para repartir.',
    note: 'No hay dinero registrado en cuentas de efectivo para repartir. Para asignar fondos a tus sobres, registra un ingreso o agrega saldos en tus cuentas de efectivo.',
  },
  state4: {
    subtitle: 'Los sobregiros absorben el dinero disponible.',
    note: (deficit: string, overspentTotal: string) =>
      `El cálculo da −${deficit}. En la pantalla se muestra $0.00 porque no hay dinero libre para repartir: los gastos adicionales consumieron los fondos disponibles y superan a tu dinero neto por esa cantidad.\n\nEl faltante para saldar los sobres en sobregiro es de ${overspentTotal}. Si cubres ese déficit reasignando saldo desde tus otros sobres, reduces el dinero apartado y eliminas el sobregiro al mismo tiempo, liberando el doble de lo que muevas hacia "Por asignar".`,
  },
  state5: {
    subtitle: 'La deuda en tarjetas supera al efectivo disponible.',
    note: (deficit: string) =>
      `El cálculo da −${deficit}. En la pantalla se muestra $0.00 porque no hay dinero libre para repartir: tus consumos en tarjeta superan el saldo en cuentas bancarias por esa cantidad.\n\nPara que vuelva a haber dinero por asignar, necesitas registrar un ingreso o cobrar un préstamo pendiente. Pagar la tarjeta no cambia este total, ya que solo transfiere fondos de efectivo a crédito sin alterar tu dinero neto.`,
  },
  closeAction: 'Entendido',
} as const;

const moveFundsSheet = {
  title: (name: string) => `Mover dinero — ${name}`,
  pullTab: 'Traer a este sobre',
  pushTab: 'Sacar de aquí',
  sourceLabel: 'Traer desde:',
  targetLabel: 'Mover hacia:',
  amountLabel: 'Monto a mover:',
  allAvailableButton: (amount: string) => `Mover todo (${amount})`,
  deficitButton: (amount: string) => `Cubrir déficit (${amount})`,
  noSources: 'No hay sobres con dinero disponible para transferir.',
  noTargets: 'No hay otros sobres disponibles en este periodo.',
  submitAction: 'Transferir',
  cancelAction: 'Cancelar',
  sourcePlaceholder: 'Elige de dónde sacar',
  targetPlaceholder: 'Elige a dónde transferir',
  sourceAvailableSuffix: 'disponible',
} as const;

export const es = {
  entity,
  kind,
  field,
  envelopeStatus,
  rollover,
  rolloverDesc,
  periodStatus,
  closeAction,
  budgetImpact,
  intent,
  intentDesc,
  nav,
  inicio,
  envelopeCard,
  expenseCapture,
  transactionsHistory,
  envelopesView,
  accountsView,
  masView,
  recordatoriosView,
  closePeriodView,
  netMoneyBreakdown,
  netMoneySheet,
  unassignedSheet,
  moveFundsSheet,
} as const;
