/**
 * Tipos TypeScript de las formas de API-CONTRACT.md. Solo lectura contra el contrato:
 * si un campo no está aquí, no existe (TASK-front.md U1).
 */

// ---------------------------------------------------------------------------
// Convenciones básicas (API-CONTRACT.md §4)
// ---------------------------------------------------------------------------

/** Fecha de calendario `YYYY-MM-DD` (§4.2). Marca de tipo para no confundirla con un instante. */
export type CalendarDate = string & { readonly __brand: 'CalendarDate' };

/** Instante RFC 3339 en UTC, con `Z` (§4.2): createdAt, updatedAt, closedAt, archivedAt. */
export type Instant = string;

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

/**
 * `kind` de cuenta/sobre/fuente de ingreso (§4.5).
 * `system` es interno: la API nunca lo devuelve en ningún listado, y si aparece
 * de forma marginal en el detalle de una transacción de saldo inicial, la UI lo omite.
 */
export type AccountKind = 'cash' | 'credit' | 'receivable' | 'category' | 'income_source' | 'system';

export type EnvelopeStatus = 'no_budget' | 'available' | 'depleted' | 'overspent';
export type RolloverType = 'accumulate' | 'reset';
export type BudgetImpactStatus = 'in_open_period' | 'no_period' | 'compensated' | 'uncompensated';
export type AllocationSource = 'manual' | 'rollover';
export type PeriodStatus = 'open' | 'closed';
export type CloseAction = 'carry_forward' | 'release' | 'carry_deficit' | 'none';

// ---------------------------------------------------------------------------
// Paginación (§6)
// ---------------------------------------------------------------------------

export interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
}

export interface OffsetPage<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

// ---------------------------------------------------------------------------
// Errores (§7)
// ---------------------------------------------------------------------------

export interface ApiErrorDetail {
  field: string;
  constraint: string;
}

export interface ApiErrorBody {
  statusCode: number;
  code: string;
  message: string;
  details?: ApiErrorDetail[];
  timestamp: string;
  path: string;
}

// ---------------------------------------------------------------------------
// Profile (§8)
// ---------------------------------------------------------------------------

export interface Profile {
  userId: string;
  email: string;
  timezone: string;
  createdAt: Instant;
  updatedAt: Instant;
}

// ---------------------------------------------------------------------------
// Accounts (§9)
// ---------------------------------------------------------------------------

/** `kind` real de una cuenta direccionable. `system` nunca aparece aquí (§4.5, §9). */
export type RealAccountKind = 'cash' | 'credit' | 'receivable';

export interface Account {
  id: string;
  name: string;
  kind: RealAccountKind;
  currency: string;
  balanceCents: string;
  archivedAt: Instant | null;
  createdAt: Instant;
  updatedAt: Instant;
}

export interface AccountLedgerEntry {
  transactionId: string;
  bookedAt: CalendarDate;
  description: string;
  amountCents: string;
  createdAt: Instant;
}

// ---------------------------------------------------------------------------
// Categories / Income sources (§10)
// ---------------------------------------------------------------------------

export interface CategoryPeriodBlock {
  periodId: string;
  assignedCents: string;
  spentCents: string;
  availableCents: string;
  hasBudget: boolean;
  status: EnvelopeStatus;
}

export interface Category {
  id: string;
  name: string;
  kind: 'category';
  rolloverType: RolloverType;
  currency: string;
  balanceCents: string;
  archivedAt: Instant | null;
  createdAt: Instant;
  updatedAt: Instant;
  /** Solo viene poblado cuando el GET incluyó `periodId`; si no, es `null` (§10.1). */
  period: CategoryPeriodBlock | null;
}

export interface IncomeSource {
  id: string;
  name: string;
  kind: 'income_source';
  currency: string;
  balanceCents: string;
  archivedAt: Instant | null;
  createdAt: Instant;
  updatedAt: Instant;
}

export type CategoryLedgerEntry = AccountLedgerEntry;

// ---------------------------------------------------------------------------
// Transactions (§11)
// ---------------------------------------------------------------------------

export interface BudgetCompensation {
  categoryId: string;
  categoryName: string;
  amountCents: string;
}

export interface BudgetImpact {
  status: BudgetImpactStatus;
  closedPeriodId: string | null;
  compensatedInPeriodId: string | null;
  compensations: BudgetCompensation[];
}

/**
 * Cuerpo de respuesta de las siete intenciones y de la reversa (§11, §11.8).
 * No incluye `movements` a propósito: para eso está `GET /transactions/{id}`.
 */
export interface TransactionMutationResult {
  id: string;
  bookedAt: CalendarDate;
  description: string;
  totalCents: string;
  reversesTransactionId: string | null;
  createdAt: Instant;
  budgetImpact: BudgetImpact;
}

export interface Movement {
  accountId: string;
  accountName: string;
  accountKind: AccountKind;
  amountCents: string;
}

/** Forma que devuelven `GET /transactions` y `GET /transactions/{id}` (§11.9, §11.10). */
export interface Transaction {
  id: string;
  bookedAt: CalendarDate;
  description: string;
  totalCents: string;
  reversesTransactionId: string | null;
  reversedByTransactionId: string | null;
  createdAt: Instant;
  movements: Movement[];
}

export interface ExpenseLine {
  categoryId: string;
  amountCents: string;
}

export interface LentToLine {
  receivableAccountId: string;
  amountCents: string;
}

export interface CreateExpenseRequest {
  bookedAt: CalendarDate;
  description: string;
  paidFromAccountId: string;
  totalCents: string;
  lines: ExpenseLine[];
  lentTo?: LentToLine[];
}

export interface CreateIncomeRequest {
  bookedAt: CalendarDate;
  description: string;
  toAccountId: string;
  sourceId: string;
  amountCents: string;
}

export interface CreateTransferRequest {
  bookedAt: CalendarDate;
  description: string;
  fromAccountId: string;
  toAccountId: string;
  amountCents: string;
}

export interface CreateLoanRequest {
  bookedAt: CalendarDate;
  description: string;
  fromAccountId: string;
  receivableAccountId: string;
  amountCents: string;
}

export interface CreateLoanRepaymentRequest {
  bookedAt: CalendarDate;
  description: string;
  receivableAccountId: string;
  toAccountId: string;
  amountCents: string;
}

export interface CreateLoanWriteOffRequest {
  bookedAt: CalendarDate;
  description: string;
  receivableAccountId: string;
  categoryId: string;
  amountCents: string;
}

export interface OpeningBalanceEntry {
  accountId: string;
  balanceCents: string;
}

export interface CreateOpeningBalancesRequest {
  bookedAt: CalendarDate;
  description: string;
  balances: OpeningBalanceEntry[];
}

export interface ReversalRequest {
  description?: string;
  /** Omitir SIEMPRE que el original haya sido captura tardía (§11.12). */
  bookedAt?: CalendarDate;
}

// ---------------------------------------------------------------------------
// Budget: periods y allocations (§12)
// ---------------------------------------------------------------------------

export interface Period {
  id: string;
  startsOn: CalendarDate;
  endsOn: CalendarDate;
  status: PeriodStatus;
  closedAt: Instant | null;
  createdAt: Instant;
  updatedAt: Instant;
}

export interface Allocation {
  id: string;
  periodId: string;
  categoryId: string;
  categoryName: string;
  amountCents: string;
  source: AllocationSource;
  note: string | null;
  createdAt: Instant;
}

export interface SetAllocationRequest {
  targetAssignedCents: string;
}

export interface SetAllocationResult {
  periodId: string;
  categoryId: string;
  assignedCents: string;
  spentCents: string;
  availableCents: string;
  hasBudget: boolean;
  status: EnvelopeStatus;
}

export interface MoveAllocationRequest {
  fromCategoryId: string;
  toCategoryId: string;
  amountCents: string;
}

export interface ClosePreviewCategory {
  categoryId: string;
  categoryName: string;
  rolloverType: RolloverType;
  assignedCents: string;
  spentCents: string;
  availableCents: string;
  hasBudget: boolean;
  action: CloseAction;
  carryCents: string;
}

export interface ClosePreview {
  periodId: string;
  startsOn: CalendarDate;
  endsOn: CalendarDate;
  nextPeriodId: string | null;
  canClose: boolean;
  blockers: string[];
  categories: ClosePreviewCategory[];
}

export interface CarryItem {
  categoryId: string;
  categoryName: string;
  amountCents: string;
}

export interface CloseResult {
  period: Period;
  nextPeriodId: string | null;
  carriedForward: CarryItem[];
  carriedDeficits: CarryItem[];
  released: CarryItem[];
}

// ---------------------------------------------------------------------------
// Recurring templates (§13)
// ---------------------------------------------------------------------------

export interface RecurringTemplate {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  accountId: string | null;
  accountName: string | null;
  amountCents: string;
  dayOfMonth: number;
  nextDueOn: CalendarDate;
  lastConfirmedOn: CalendarDate | null;
  isActive: boolean;
  isDue: boolean;
  createdAt: Instant;
  updatedAt: Instant;
}

export interface ConfirmRecurringRequest {
  bookedAt?: CalendarDate;
  amountCents?: string;
  paidFromAccountId?: string;
  description?: string;
}

export interface ConfirmRecurringResult {
  transaction: TransactionMutationResult;
  template: RecurringTemplate;
}

// ---------------------------------------------------------------------------
// Insights (§14)
// ---------------------------------------------------------------------------

export interface InsightAccountBalance {
  accountId: string;
  name: string;
  kind: AccountKind;
  currency: string;
  balanceCents: string;
}

export interface AccountBalancesResponse {
  accounts: InsightAccountBalance[];
}

export interface InsightCategoryBalance {
  categoryId: string;
  name: string;
  assignedCents: string;
  spentCents: string;
  availableCents: string;
  hasBudget: boolean;
  status: EnvelopeStatus;
}

export interface CategoryBalancesResponse {
  periodId: string;
  categories: InsightCategoryBalance[];
}

export interface UnassignedFundsResponse {
  unassignedCents: string;
}

export interface UnbudgetedTransactionSummary {
  transactionId: string;
  bookedAt: CalendarDate;
  description: string;
}

export interface UnbudgetedTransactionsResponse {
  transactions: UnbudgetedTransactionSummary[];
}

export interface DashboardResponse {
  accounts: InsightAccountBalance[];
  unassignedCents: string;
  period: Period | null;
  categories: InsightCategoryBalance[];
  unbudgetedTransactions: UnbudgetedTransactionSummary[];
}

// ---------------------------------------------------------------------------
// Query keys / invalidación (ARCHITECTURE-front.md §5)
// ---------------------------------------------------------------------------

export type QueryKey = readonly unknown[];

/**
 * Identificador de cada fila de la matriz de invalidación (ARCHITECTURE §5.2).
 * No es una forma fijada del contrato: nombrada por la sesión de tests porque
 * `invalidationFor` (TASK-front.md §6.1) necesita un tipo de entrada. Documentado
 * en PROGRESS.md junto con las demás inferencias.
 */
export type MutationName =
  | 'createTransaction'
  | 'reversal'
  | 'putAllocation'
  | 'moveAllocation'
  | 'deleteAllocation'
  | 'closePeriod'
  | 'createPeriod'
  | 'editPeriod'
  | 'deletePeriod'
  | 'createAccount'
  | 'archiveAccount'
  | 'createCategory'
  | 'archiveCategory'
  | 'confirmRecurring';
