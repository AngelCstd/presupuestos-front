# INVENTARIO.md — Inventario técnico verificado

> Generado mediante inspección directa del código fuente en `presupuestos-front`.
> Ningún componente, token, clave de i18n o función aquí listada es una suposición;
> cada entrada fue verificada abriendo el archivo fuente correspondiente.

---

## 1. Componentes reutilizables

### `src/components/ui/`

* **`Button`** (`src/components/ui/Button.tsx`)
  ```typescript
  interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    children: ReactNode;
  }
  ```
* **`Input`** (`src/components/ui/Input.tsx`)
  ```typescript
  interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    invalid?: boolean;
  }
  ```
* **`Field`** (`src/components/ui/Field.tsx`)
  ```typescript
  interface FieldProps {
    label: string;
    error?: string | null;
    hint?: string;
    children: ReactElement<{ id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }>;
  }
  ```
* **`Badge`** (`src/components/ui/Badge.tsx`)
  ```typescript
  type BadgeTone = 'neutral' | 'success' | 'danger' | 'warning';
  export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode });
  ```
* **`Checkbox`** (`src/components/ui/Checkbox.tsx`)
  ```typescript
  interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label: ReactNode;
  }
  ```
* **`ConfirmDialog`** (`src/components/ui/ConfirmDialog.tsx`)
  ```typescript
  interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: ReactNode;
    confirmLabel: string;
    danger?: boolean;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  }
  ```
* **`Sheet`** (`src/components/ui/Sheet.tsx`)
  ```typescript
  interface SheetProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
  }
  ```
* **`Spinner`** (`src/components/ui/Spinner.tsx`)
  ```typescript
  export function Spinner({ className }: { className?: string });
  ```
* **`Toast`** (`src/components/ui/Toast.tsx`)
  ```typescript
  export function Toast(): JSX.Element | null; // Notificación efímera conectada a useToastStore
  ```

### `src/components/layout/`

* **`Banner`** (`src/components/layout/Banner.tsx`)
  ```typescript
  interface BannerProps {
    message: ReactNode;
    action?: ReactNode;
  }
  ```
* **`OverduePeriodBanner`** (`src/components/layout/OverduePeriodBanner.tsx`)
  ```typescript
  export function OverduePeriodBanner(); // Lee useOpenPeriods() y hoy vía useTimezone()
  ```
* **`TabBar`** (`src/components/layout/TabBar.tsx`)
  ```typescript
  export function TabBar(); // Renderiza Inicio, Sobres, Movimientos, Más
  ```
* **`Fab`** (`src/components/layout/Fab.tsx`)
  ```typescript
  export function Fab(); // Botón flotante hacia /capturar/gasto
  ```

### `src/components/money/`

* **`Money`** (`src/components/money/Money.tsx`)
  ```typescript
  interface MoneyProps {
    cents: string;
    currency?: string; // default MXN
  }
  ```
* **`Balance`** (`src/components/money/Balance.tsx`)
  ```typescript
  interface BalanceProps {
    cents: string;
    kind: AccountKind; // Aplica formatBalance (credit agrega "debes", etc.)
  }
  ```
* **`AmountInput`** (`src/components/money/AmountInput.tsx`)
  ```typescript
  interface AmountInputProps extends Omit<InputProps, 'value' | 'onChange' | 'type' | 'inputMode'> {
    value: string; // centavos string
    onChange: (cents: string) => void;
  }
  ```

### `src/components/states/`

* **`Skeleton`** (`src/components/states/Skeleton.tsx`)
  ```typescript
  export function Skeleton({ className }: { className?: string });
  ```
* **`EmptyState`** (`src/components/states/EmptyState.tsx`)
  ```typescript
  type EmptyStateTone = 'neutral' | 'pendiente' | 'exito';
  interface EmptyStateProps {
    tone: EmptyStateTone;
    title: string;
    description?: string;
    action?: ReactNode;
  }
  ```
* **`ErrorState`** (`src/components/states/ErrorState.tsx`)
  ```typescript
  interface ErrorStateProps {
    code: string; // Mapeado por errorMessageFor(code)
    onRetry?: () => void;
    retryLabel?: string;
    action?: ReactNode;
  }
  ```

### `src/features/**/components/`

* **`EnvelopeStatusBadge`** (`src/features/envelopes/components/EnvelopeStatusBadge.tsx`)
  ```typescript
  export function EnvelopeStatusBadge({ status }: { status: EnvelopeStatus });
  ```
* **`CategoryCard`** (`src/features/envelopes/components/CategoryCard.tsx`)
  ```typescript
  interface CategoryCardProps {
    category: Category;
    onSetAllocation: (targetAssignedCents: string) => void;
    onCoverOverspend: () => void;
    saving?: boolean;
  }
  ```
* **`CoverOverspendSheet`** (`src/features/envelopes/components/CoverOverspendSheet.tsx`)
  ```typescript
  interface CoverOverspendSheetProps {
    open: boolean;
    onClose: () => void;
    target: Category | null;
    categories: Category[];
    onCover: (fromCategoryId: string, amountCents: string) => void;
    moving?: boolean;
  }
  ```
* **`CreatePeriodForm`** (`src/features/periods/components/CreatePeriodForm.tsx`)
  ```typescript
  export function CreatePeriodForm({
    open,
    onClose,
    defaultStartsOn,
    onCreated,
  }: {
    open: boolean;
    onClose: () => void;
    defaultStartsOn?: string;
    onCreated?: (periodId: string) => void;
  });
  ```
* **`CreateAccountForm`** (`src/features/accounts/components/CreateAccountForm.tsx`)
  ```typescript
  export function CreateAccountForm({ open, onClose }: { open: boolean; onClose: () => void });
  ```
* **`CreateIncomeSourceForm`** (`src/features/accounts/components/CreateIncomeSourceForm.tsx`)
  ```typescript
  export function CreateIncomeSourceForm({ open, onClose }: { open: boolean; onClose: () => void });
  ```
* **`IncomeSourcesSection`** (`src/features/accounts/components/IncomeSourcesSection.tsx`)
  ```typescript
  export function IncomeSourcesSection();
  ```
* **`ProfileSection`** (`src/features/profile/components/ProfileSection.tsx`)
  ```typescript
  export function ProfileSection();
  ```
* **`SignOutButton`** (`src/features/profile/components/SignOutButton.tsx`)
  ```typescript
  export function SignOutButton();
  ```
* **`ConfirmRecurringForm`** (`src/features/recurring/components/ConfirmRecurringForm.tsx`)
  ```typescript
  export function ConfirmRecurringForm({
    template,
    open,
    onClose,
  }: {
    template: RecurringTemplate;
    open: boolean;
    onClose: () => void;
  });
  ```
* **`BudgetImpactMessage`** (`src/features/transactions/components/BudgetImpactMessage.tsx`)
  ```typescript
  export function BudgetImpactMessage({ budgetImpact }: { budgetImpact: BudgetImpact });
  ```
* **`MovementLine`** (`src/features/transactions/components/MovementLine.tsx`)
  ```typescript
  export function MovementLine({ movement }: { movement: Movement });
  ```
* **`TransactionRow`** (`src/features/transactions/components/TransactionRow.tsx`)
  ```typescript
  export function TransactionRow({ transaction }: { transaction: Transaction });
  ```
* **`SimpleTransactionForm`** (`src/features/transactions/components/SimpleTransactionForm.tsx`)
  ```typescript
  interface SimpleTransactionFormProps {
    intent: CreateTransactionIntent;
    draftIntent: string;
    title: string | ((values: SimpleTransactionFormValues) => string);
    firstLabel: string;
    firstOptions: SimpleOption[] | undefined;
    secondLabel: string;
    secondOptions: SimpleOption[] | undefined;
    buildBody: (values: SimpleTransactionFormValues) => Record<string, unknown>;
    emptyState?: { title: string; description?: string; tone: EmptyStateTone; action?: ReactNode };
  }
  ```

---

## 2. Tokens (CSS variables y Tailwind)

Declarados en `src/app/globals.css` y mapeados en `tailwind.config.ts`:

### Tokens con valor formal y cableados en Tailwind:
* `--font-sans`: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
* `--color-background`: `#faf7f0` (crema cálido)
* `--color-foreground`: `#262420` (negro suave)
* `--color-muted`: `#6b6858`
* `--color-muted-background`: `#f0ead9` (crema profundo para tarjetas/superficies)
* `--color-border`: `#a89c7d`
* `--color-primary`: `#5b6b4a` (sage oscuro AA)
* `--color-primary-foreground`: `#ffffff`
* `--color-danger`: `#b91c1c`
* `--color-danger-foreground`: `#ffffff`
* `--color-success`: `#5b6b4a`
* `--color-success-foreground`: `#ffffff`
* `--state-no-budget`: `#8f8974` (gris cálido apagado)
* `--state-available`: `#3b6e91` (azul apagado)
* `--state-depleted`: `#8a5f35` (ocre templado)
* `--state-overspent`: `#b91c1c` (rojo alerta)
* **Tipografía (`fontSize`):** `--font-size-2xs` (11px), `--font-size-xs` (12px), `--font-size-sm` (14px), `--font-size-base` (16px), `--font-size-lg` (18px), `--font-size-xl` (20px), `--font-size-2xl` (24px), `--font-size-3xl` (30px)
* **Radios (`borderRadius`):** `--radius-xs` (4px), `--radius-sm` (6px), `--radius-md` (8px), `--radius-lg` (12px), `--radius-xl` (16px), `--radius-full` (9999px)
* **Sombras (`boxShadow`):** `--shadow-sm`, `--shadow-md`, `--shadow-lg` (calibradas para el fondo crema)
* **Espaciado (`spacing`):** `--spacing-0-5` (2px), `--spacing-1` (4px), `--spacing-1-5` (6px), `--spacing-2` (8px), `--spacing-2-5` (10px), `--spacing-3` (12px), `--spacing-4` (16px), `--spacing-5` (20px), `--spacing-6` (24px), `--spacing-8` (32px), `--spacing-10` (40px), `--spacing-12` (48px), `--spacing-16` (64px), `--spacing-20` (80px) (malla base de 4px / 8px)

---

## 3. i18n (`src/lib/i18n/es.ts`)

Estructura exportada en el objeto `es`:

* **`es.entity`**:
  * `period`: `'Periodo'`
  * `allocation`: `'Asignación'`
  * `recurringTemplate`: `'Recordatorio'`
  * `reversal`: `'Corrección'`
* **`es.kind`**:
  * `cash`: `'Cuenta'`
  * `credit`: `'Tarjeta'`
  * `receivable`: `'Te deben'`
  * `category`: `'Sobre'`
  * `income_source`: `'Fuente de ingreso'`
* **`es.field`**:
  * `assignedCents`: `'Asignado'`
  * `spentCents`: `'Gastado'`
  * `availableCents`: `'Disponible'`
  * `unassignedCents`: `'Por asignar'`
  * `balanceCents`: `'Saldo'`
* **`es.envelopeStatus`**:
  * `no_budget`: `'Sin presupuesto'`
  * `available`: `'Disponible'`
  * `depleted`: `'Agotado'`
  * `overspent`: `'Sobregiro'`
* **`es.rollover`**:
  * `accumulate`: `'Acumula'`
  * `reset`: `'Reinicia'`
* **`es.periodStatus`**:
  * `open`: `'Abierto'`
  * `closed`: `'Cerrado'`
* **`es.closeAction`**:
  * `carry_forward`: `{ before: 'Se arrastra ', after: ' a la siguiente' }`
  * `release`: `{ before: 'Se liberan ', after: ' para asignar' }`
  * `carry_deficit`: `{ before: 'Se arrastra un déficit de ', after: '' }`
  * `none`: `{ before: 'Sin cambios', after: '' }`
* **`es.budgetImpact`**:
  * `no_period`: `'Este movimiento no cae en ningún periodo'`
  * `compensated`: `'Ajustado en el periodo actual'`
  * `uncompensated`: `'Sin periodo donde ajustar'`
* **`es.intent`**:
  * `expense`: `'Gasto'`
  * `income`: `'Ingreso'`
  * `transfer`: `'Transferencia'`
  * `loan`: `'Préstamo'`
  * `loanRepayment`: `'Cobro'`
  * `loanWriteOff`: `'Dar por perdido'`
  * `reversal`: `'Corrección'`
* **`es.nav`**:
  * `inicio`: `'Inicio'`
  * `sobres`: `'Sobres'`
  * `movimientos`: `'Movimientos'`
  * `mas`: `'Más'`

---

## 4. Primitivas de dominio (`src/lib/domain/`)

* **`accounts.ts`**:
  * `export function isRealAccountKind(kind: AccountKind): kind is RealAccountKind`
    *(Verifica si kind es 'cash' | 'credit' | 'receivable')*
* **`dates.ts`**:
  * `export function todayInTimeZone(timeZone: string, now: Date = new Date()): string`
    *(Devuelve YYYY-MM-DD en la zona horaria dada usando Intl.DateTimeFormat)*
  * `export function formatInstant(iso: string, timeZone: string): string`
    *(Formatea timestamp ISO a formato local)*
  * `export function isDateInClosedPeriod(date: string, periods: readonly PeriodDescriptor[]): boolean`
    *(Verifica si una fecha cae en un periodo con status === 'closed')*
* **`envelopes.ts`**:
  * `export function deriveEnvelopeStatus(p: { hasBudget: boolean; assignedCents: string; spentCents: string; availableCents: string }): EnvelopeStatus`
    *(Deriva 'no_budget' | 'available' | 'depleted' | 'overspent')*
* **`late-capture.ts`**:
  * `export const LATE_CAPTURE_NOTE_PREFIX = 'Ajuste por captura tardía'`
  * `export function isLateCaptureNote(note: string | null): boolean`
  * `export function extractTransactionIdFromNote(note: string | null): string | null`
* **`money.ts`**:
  * `export function formatMoney(cents: string, currency: string = 'MXN'): string`
    *(Formatea centavos BigInt a moneda con dos decimales)*
  * `export function formatBalance(cents: string, kind: AccountKind): string`
    *(Agrega sufijo "debes" para credit, "te deben" para receivable, o valor simple para cash/category)*
  * `export function splitEvenly(totalCents: string, parts: number): string[]`
    *(Divide centavos en N partes iguales, residuo asignado a la primera parte)*
  * `export function parseAmountInput(text: string): string | null`
    *(Parsea texto con comas/puntos a centavos string o null si inválido)*
* **`periods.ts`**:
  * `export function selectClosablePeriod(openPeriods: readonly PeriodDescriptor[], today: string): PeriodDescriptor | null`
    *(Devuelve únicamente el periodo vencido más antiguo que puede cerrarse)*

---

## 5. Hooks de datos y endpoints

* **Dashboard e Insights:**
  * `useDashboard(periodId?: string)` → `GET /insights/dashboard` (Query key: `qk.dashboard(periodId)`)
  * `useUnbudgetedTransactions()` → `GET /insights/unbudgeted-transactions` (Query key: `qk.unbudgetedTransactions()`)
* **Sobres y Asignaciones:**
  * `useCategories(periodId?: string, opts?: { includeArchived?: boolean })` → `GET /categories` (Query key: `qk.categories(periodId, opts)`)
  * `useCategoryLedger(id: string)` → `GET /categories/{id}/ledger` (Query key: `qk.categoryLedger(id)`)
  * `useAllocations(periodId: string)` → `GET /periods/{periodId}/allocations` (Query key: `qk.allocations(periodId)`)
  * `useSetAllocation(periodId: string)` → `PUT /periods/{id}/allocations/{catId}`
  * `useMoveAllocation(periodId: string)` → `POST /periods/{id}/allocations/move`
  * `useDeleteAllocation(periodId: string)` → `DELETE /periods/{id}/allocations/{allocationId}`
  * `useUpdateCategory(id: string)` → `PATCH /categories/{id}`
  * `useArchiveCategory(id: string)` → `POST /categories/{id}/archive` (o unarchive)
* **Cuentas y Fuentes de Ingreso:**
  * `useAccounts(params?: { kind?: AccountKind; includeArchived?: boolean })` → `GET /accounts` (Query key: `qk.accounts(params)`)
  * `useAccount(id: string)` → `GET /accounts/{id}` (Query key: `qk.account(id)`)
  * `useAccountLedger(id: string)` → `GET /accounts/{id}/ledger` (Query key: `qk.accountLedger(id)`)
  * `useCreateAccount()` → `POST /accounts`
  * `useUpdateAccount(id: string)` → `PATCH /accounts/{id}`
  * `useArchiveAccount(id: string)` → `POST /accounts/{id}/archive` (o unarchive)
  * `useCaptureOpeningBalance(accountId: string)` → `POST /transactions/opening-balances`
  * `useIncomeSources(opts?: { includeArchived?: boolean })` → `GET /income-sources` (Query key: `qk.incomeSources(opts)`)
  * `useCreateIncomeSource()` → `POST /income-sources`
  * `useArchiveIncomeSource(id: string)` → `POST /income-sources/{id}/archive` (o unarchive)
* **Periodos:**
  * `usePeriods()` → `GET /periods` (Query key: `qk.periods(null)`)
  * `useOpenPeriods()` → `GET /periods?status=open` (Query key: `qk.openPeriods()`)
  * `useCreatePeriod()` → `POST /periods`
  * `useDeletePeriod()` → `DELETE /periods/{id}`
  * `useClosePreview(periodId: string)` → `GET /periods/{id}/close-preview` (Query key: `qk.closePreview(periodId)`)
  * `useClosePeriod(periodId: string)` → `POST /periods/{id}/close`
* **Transacciones:**
  * `useTransactions(filters?: TransactionFilters)` → `GET /transactions` (Query key: `qk.transactions(filters)`)
  * `useTransaction(id: string)` → `GET /transactions/{id}` (Query key: `qk.transaction(id)`)
  * `useCreateTransaction(intent: CreateTransactionIntent)` → `/transactions/{expenses|incomes|transfers|loans|loan-repayments|loan-write-offs}`
  * `useReverseTransaction(transactionId: string)` → `POST /transactions/{id}/reversal`
  * `useUpdateTransactionDescription(id: string)` → `PATCH /transactions/{id}`
* **Recordatorios recurrentes:**
  * `useRecurringTemplates(params?: { dueOnly?: boolean })` → `GET /recurring-templates` (Query key: `qk.recurringTemplates(params)`)
  * `useCreateRecurringTemplate()` → `POST /recurring-templates`
  * `useConfirmRecurringTemplate(templateId: string)` → `POST /recurring-templates/{id}/confirm`
* **Perfil:**
  * `useMe()` → `GET /me` (Query key: `qk.me()`)
  * `useUpdateTimezone()` → `PATCH /me`
* **Borradores e Idempotencia:**
  * `useDraft(intent: string)` → Gestión de `sessionStorage` para formularios y preservación de `Idempotency-Key`.

---

## 6. Cobertura de tests existentes (207 tests en 18 suites)

**Regla dura: Ninguno de estos archivos se modifica durante el loop.**

1. `tests/split.test.ts` (4 tests): Invariantes de `splitEvenly` y división con residuos.
2. `tests/sign-rule.test.ts` (5 tests): Regla de signos de `formatBalance` por `AccountKind`.
3. `tests/money.test.ts` (14 tests): `formatMoney` (BigInt centavos) y `parseAmountInput`.
4. `tests/dates.test.ts` (7 tests): `todayInTimeZone`, `formatInstant` y prohibición de `toISOString()`.
5. `tests/api-client.test.ts` (5 tests): `apiRequest`, normalización de `ApiError`, auth headers.
6. `tests/bff-forward.test.ts` (6 tests): Manejo de errores de BFF, reintentos de `IDEMPOTENCY_IN_FLIGHT`.
7. `tests/i18n.test.ts` (21 tests): Cobertura de glosario y ausencia de términos prohibidos.
8. `tests/query-keys.test.ts` (23 tests): Estructura e invariantes de claves en `qk.*`.
9. `tests/draft-store.test.ts` (7 tests): Persistencia de borradores e idempotencia en `sessionStorage`.
10. `tests/unauthorized-recovery.test.ts` (2 tests): Manejo de 401 y expiración de sesión.
11. `tests/session-policy.test.ts` (9 tests): Políticas de sesión y tokens.
12. `tests/idempotency.test.ts` (6 tests): Generación y ciclo de vida de llaves de idempotencia.
13. `tests/late-capture.test.ts` (9 tests): `LATE_CAPTURE_NOTE_PREFIX` y parseo de notas de captura tardía.
14. `tests/invalidation.test.ts` (19 tests): Matriz de invalidación de TanStack Query (`invalidationFor`).
15. `tests/allowlist.test.ts` (7 tests): Rutas y métodos permitidos en el proxy BFF.
16. `tests/overdue-periods.test.ts` (6 tests): Selección determinista del periodo vencido más antiguo.
17. `tests/envelopes.test.ts` (5 tests): Lógica de estados de sobre en `deriveEnvelopeStatus`.
18. `tests/errors.test.ts` (52 tests): Mapeo completo de códigos de error de API a español.
