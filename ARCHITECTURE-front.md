# ARCHITECTURE-front.md

> **Estado:** v1 — congelado para implementación.
> **Fuente de verdad del backend:** `API-CONTRACT.md`. Este documento **nunca** lo contradice ni lo extiende. Si algo choca, gana el contrato y este documento está mal.
> **Destinatario:** el agente que implementa, y quien revise después. Toda decisión aquí trae su razón; si una decisión no tiene razón escrita, es un hueco, no una preferencia.

---

## 1. Stack y restricciones fijas

| Pieza | Decisión | Estado |
|---|---|---|
| Framework | Next.js, App Router | Cerrado antes de este documento |
| Lenguaje | TypeScript, `strict: true` | Cerrado |
| Auth | Supabase Auth vía `@supabase/ssr`, sesión en cookies `httpOnly` | Cerrado |
| Backend | API NestJS en `https://<host>/api/v1` | Cerrado y desplegado |
| Despliegue | Vercel | Cerrado |
| Server state | TanStack Query, con prefetch en servidor e hidratación | Decidido aquí (§5) |
| Client state | Zustand **solo** para borradores de formulario | Decidido aquí (§7) |
| Formularios | React Hook Form + Zod | Decidido aquí (§9) |
| Estilos | Tailwind + tokens en CSS variables | Decidido aquí (§13) |
| Tests | Vitest, solo lógica pura y hooks. **Cero tests de render o snapshot** | Cerrado por el brief |

**Por qué existe el BFF.** La sesión vive en cookies `httpOnly`; un Client Component no las puede leer, así que no puede adjuntar el JWT. Todas las llamadas del navegador pasan por Route Handlers del lado servidor, que leen la cookie, sacan el `access_token` y lo mandan como `Authorization: Bearer`.

**El token nunca llega al navegador.** Ni en props, ni en `window.__NEXT_DATA__`, ni en una respuesta del BFF. Si algún día aparece en el bundle del cliente, es un bug de seguridad, no un detalle.

---

## 2. Estructura de rutas y jerarquía de pantallas

Navegación persistente: **tab bar inferior de 4** (Inicio · Sobres · Movimientos · Más) + **botón flotante** abajo a la derecha que va directo a capturar un gasto.

```
app/
├─ layout.tsx                        raíz: providers, TimezoneProvider, banner de quincena vencida
├─ (auth)/
│  └─ login/page.tsx                 fuera de la tab bar
├─ empezar/page.tsx                  onboarding, pantalla única, fuera de la tab bar
├─ (app)/                            todo lo que lleva tab bar
│  ├─ layout.tsx                     tab bar + FAB + guard de onboarding
│  ├─ page.tsx                       Inicio
│  ├─ sobres/
│  │  ├─ page.tsx
│  │  └─ [categoryId]/page.tsx
│  ├─ movimientos/
│  │  ├─ page.tsx
│  │  └─ [transactionId]/page.tsx
│  ├─ cuentas/
│  │  ├─ page.tsx
│  │  └─ [accountId]/page.tsx
│  ├─ quincenas/
│  │  ├─ page.tsx
│  │  └─ [periodId]/cerrar/page.tsx
│  ├─ recordatorios/
│  │  ├─ page.tsx
│  │  └─ nuevo/page.tsx
│  └─ mas/page.tsx                   perfil, zona horaria, fuentes de ingreso, archivadas
├─ capturar/                         full-screen, SIN tab bar
│  ├─ layout.tsx
│  ├─ gasto/page.tsx                 destino del FAB
│  ├─ otro/page.tsx                  selector de las otras 6 intenciones
│  ├─ ingreso/page.tsx
│  ├─ transferencia/page.tsx
│  ├─ prestamo/page.tsx
│  ├─ cobro/page.tsx
│  └─ perdida/page.tsx               loan-write-off
└─ api/bff/
   ├─ [...path]/route.ts             catch-all con allowlist — solo lecturas y escrituras simples
   └─ tx/…                           handlers dedicados de los 9 endpoints idempotentes (§4.2)
```

**Cuentas, quincenas y recordatorios no tienen tab propia**: se llega desde "Más" y desde enlaces contextuales en Inicio. Cuatro tabs es el límite antes de que el pulgar tenga que apuntar.

**`capturar/` está fuera de `(app)/` a propósito.** Es full-screen: sin tab bar, con botón de cerrar. Tiene URL real, así que sobrevive a un refresh y el re-login puede volver exactamente ahí (§8).

**Guard de onboarding.** `(app)/layout.tsx` lee las cuentas; si no hay ninguna con `kind: "cash"`, redirige a `/empezar`. Es la señal del §15.3 del contrato — no hay flag y no se inventa uno en `localStorage`.

---

## 3. Separación de responsabilidades

Cinco capas, y ninguna salta a la de más abajo:

```
Componentes  →  hooks de feature  →  servicios  →  cliente HTTP  →  API
   (pintan)      (queries, mutaciones)  (endpoints)   (auth, errores, reintentos)
```

- **Componentes**: pintan y disparan. Cero `fetch`, cero aritmética de dinero, cero reglas de negocio en JSX.
- **Hooks de feature** (`useDashboard`, `useCreateExpense`): envuelven TanStack Query y saben qué invalidar.
- **Servicios** (`features/*/services/*.ts`): una función por endpoint del contrato. Saben la forma del request y la del response, nada más.
- **Cliente HTTP** (`lib/api/client.ts`): adjunta el JWT, normaliza errores a `ApiError`, y maneja `IDEMPOTENCY_IN_FLIGHT`. **Solo corre en servidor.**

**Un solo cliente HTTP para dos caminos.** Los Server Components lo llaman directo (sin pasar por el BFF: sería un salto de red desperdiciado contra tu propio proceso). Los Route Handlers lo llaman también. El navegador nunca lo toca.

---

## 4. El BFF

### 4.1 Catch-all con allowlist

`app/api/bff/[...path]/route.ts` reenvía a la API **solo** lo que esté en una tabla explícita:

```ts
// lib/bff/allowlist.ts
type AllowedRoute = { method: HttpMethod; pattern: string };

export const ALLOWLIST: readonly AllowedRoute[] = [
  { method: 'GET',   pattern: '/me' },
  { method: 'PATCH', pattern: '/me' },
  { method: 'GET',   pattern: '/accounts' },
  { method: 'POST',  pattern: '/accounts' },
  { method: 'GET',   pattern: '/accounts/:id' },
  // … el resto, una línea por operación
] as const;
```

`:id` casa un segmento y nada más — no cruza `/`. Una ruta que no esté en la tabla devuelve **`404` sin tocar la API**.

**Por qué no un catch-all pelón:** convertiría el BFF en un proxy abierto y autenticado hacia tu propia API. El día que el backend agregue un endpoint, quedaría expuesto al navegador sin que nadie lo haya decidido. La allowlist hace que exponer algo sea un acto deliberado, en un archivo que se lee de un vistazo.

**Por qué no 35 handlers separados:** son archivos casi idénticos, y la duplicación misma es el riesgo — el día que uno se desvíe del resto, nadie lo nota.

Qué hace el catch-all, en orden:
1. Casa `method` + `path` contra la allowlist. Si no casa → `404`.
2. Lee la sesión de Supabase desde las cookies. Sin sesión → `401` con el mismo formato de error del contrato.
3. Reenvía path, query string y body. **Copia solo los headers de una lista blanca** (`content-type`, `idempotency-key`). Nada de reenviar headers arbitrarios del navegador.
4. Devuelve status y body **después de verificar que sea JSON parseable**. Si el parseo falla, responde `500 INTERNAL_ERROR` con el formato de error del contrato (ver §4.2). El mapeo de `code` a español sigue siendo del cliente, no del BFF.

### 4.2 El BFF garantiza la forma del error, siempre

Reenviar "tal cual" solo es seguro si lo que llega es JSON del contrato. No siempre lo es: un 502 de un proxy intermedio llega como HTML, un timeout llega como cuerpo vacío. Eso reventaría en el `JSON.parse` del cliente con un error que no dice nada y que ningún `code` cubre.

```ts
// lib/bff/forward.ts — al final de todo reenvío
try {
  body = await upstream.json();
} catch {
  return contractError(500, 'INTERNAL_ERROR', path);
}
```

**Invariante:** toda respuesta del BFF es JSON, y toda respuesta no-2xx trae `{ statusCode, code, message, timestamp, path }`. El cliente nunca recibe algo que no sepa manejar, y `errorMessageFor` siempre encuentra un `code` — aunque sea el fallback genérico.

Aplica igual a los handlers dedicados: comparten `forward.ts`.

### 4.3 Handlers dedicados: los 9 idempotentes

Los nueve endpoints del §5 del contrato tienen handler propio, porque tienen lógica que el catch-all no debe cargar:

```
POST /api/bff/tx/expenses            → POST /transactions/expenses
POST /api/bff/tx/incomes             → POST /transactions/incomes
POST /api/bff/tx/transfers           → POST /transactions/transfers
POST /api/bff/tx/loans               → POST /transactions/loans
POST /api/bff/tx/loan-repayments     → POST /transactions/loan-repayments
POST /api/bff/tx/loan-write-offs     → POST /transactions/loan-write-offs
POST /api/bff/tx/opening-balances    → POST /transactions/opening-balances
POST /api/bff/tx/:id/reversal        → POST /transactions/{id}/reversal
POST /api/bff/recurring/:id/confirm  → POST /recurring-templates/{id}/confirm
```

Cada uno:
- **Valida el body con Zod antes de salir a la red.** Un `amountCents` que no case `/^-?\d{1,19}$/` se rechaza aquí; no gasta un round-trip para recibir un `400 VALIDATION_FAILED`.
- **Exige el header `Idempotency-Key`** y verifica que sea UUID. Si falta, es un bug del cliente y se responde `400 IDEMPOTENCY_KEY_REQUIRED` sin llamar a la API.
- **Absorbe `409 IDEMPOTENCY_IN_FLIGHT`**: espera 1s y reintenta con la misma llave, hasta 3 veces. Solo si sigue fallando, el error sube. El usuario nunca ve ese código (§18 del contrato).
- **Trata `200` y `201` idénticamente**, tal como dice el §5.2.

### 4.4 Lo que el BFF nunca hace

- No calcula saldos, ni suma, ni deriva estados. Toda la aritmética vive en `/insights` (§14 del contrato).
- No traduce mensajes al español. Eso es capa de presentación (§10).
- No cachea respuestas de la API. La caché vive en TanStack Query, del lado del cliente, donde la invalidación es explícita.
- No acepta ni reenvía un campo `userId`. El contrato responde `400` si llega, y el BFF ni siquiera lo deja pasar.

---

## 5. Estado: qué es servidor, qué es cliente

**Híbrido.** El Server Component de cada ruta hace `prefetchQuery` contra la API (directo, sin BFF) y entrega el resultado en un `HydrationBoundary`. De ahí en adelante manda TanStack Query en el cliente.

```tsx
// app/(app)/page.tsx
export default async function InicioPage() {
  const qc = new QueryClient();
  await qc.prefetchQuery({
    queryKey: qk.dashboard(null),
    queryFn: () => serverApi.getDashboard(),
  });
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <InicioView />
    </HydrationBoundary>
  );
}
```

**Por qué así y no solo RSC:** el §15.7 del contrato dice que no hay tiempo real ni polling; los datos se refrescan cuando el usuario actúa. Eso hace que la invalidación fina sea lo único que mantiene la pantalla fresca — y `router.refresh()` es un martillo que revalida la ruta entera por un gasto capturado.

**Por qué no solo cliente:** en móvil, arrancar con esqueleto en cada navegación se siente lento, y el dashboard es una sola llamada que el servidor ya puede tener lista.

### 5.1 Query keys

```ts
// lib/query-keys.ts
export const qk = {
  me:                 ()               => ['me'] as const,
  dashboard:          (periodId)       => ['dashboard', periodId ?? 'current'] as const,
  accounts:           (opts)           => ['accounts', opts] as const,
  account:            (id)             => ['account', id] as const,
  accountLedger:      (id)             => ['account-ledger', id] as const,
  categories:         (periodId)       => ['categories', periodId ?? 'none'] as const,
  category:           (id)             => ['category', id] as const,
  categoryLedger:     (id)             => ['category-ledger', id] as const,
  incomeSources:      ()               => ['income-sources'] as const,
  periods:            (status)         => ['periods', status ?? 'all'] as const,
  openPeriods:        ()               => ['periods', 'open'] as const,
  allocations:        (periodId)       => ['allocations', periodId] as const,
  closePreview:       (periodId)       => ['close-preview', periodId] as const,
  transactions:       (filters)        => ['transactions', filters] as const,
  transaction:        (id)             => ['transaction', id] as const,
  recurringTemplates: (opts)           => ['recurring-templates', opts] as const,
  unassignedFunds:    ()               => ['unassigned-funds'] as const,
};
```

**Los cursores no entran en la query key ni se persisten.** `useInfiniteQuery` los guarda en memoria y se tiran al desmontar — el §6.1 del contrato dice que son opacos y no sobreviven a la sesión.

### 5.2 Matriz de invalidación

Toda mutación declara qué invalida. Nada de `queryClient.invalidateQueries()` sin argumentos.

| Mutación | Invalida |
|---|---|
| Crear cualquier transacción | `dashboard`, `transactions`, `accounts`, `account`/`accountLedger` de las cuentas tocadas, `categories`, `unassignedFunds` |
| Reversa | igual que arriba, más `transaction(id)` del original (cambia `reversedByTransactionId`) |
| `PUT` allocations | `dashboard`, `categories`, `allocations`, `unassignedFunds` |
| `move` allocations | igual que arriba |
| `DELETE` allocation | igual que arriba |
| Cerrar periodo | **todo lo de presupuesto**: `dashboard`, `categories`, `allocations`, `periods`, `openPeriods`, `closePreview`, `unassignedFunds` |
| Crear/editar/borrar periodo | `periods`, `openPeriods`, `dashboard`, `unassignedFunds` |
| Crear/archivar cuenta | `accounts`, `dashboard` |
| Crear/archivar sobre | `categories`, `dashboard` |
| Confirmar recurrente | `recurringTemplates`, más todo lo de "crear transacción" |

**`openPeriods` se invalida al cerrar y al crear un periodo.** Es la query que alimenta el banner del layout raíz (§11) y no cuelga de ninguna pantalla, así que es fácil olvidarla.

### 5.3 Optimistic UI: dónde sí y dónde no

- **Sí** en `PUT /periods/{id}/allocations/{categoryId}`: el usuario escribe un monto y el sobre se actualiza al instante. Es idempotente por diseño (§12.2), así que un reintento no acumula.
- **No** en ninguna transacción. `budgetImpact` solo se conoce con la respuesta del servidor, y pintar un gasto como aplicado antes de saber si fue `compensated` es mentirle al usuario justo en el caso que hay que explicar.
- **No** en el cierre de periodo. Es irreversible (§15.1); se espera la respuesta.

---

## 6. Idempotencia: dónde vive la llave

Regla del §5.1 del contrato: **una llave por intención del usuario, no por intento HTTP.**

```
Se abre el formulario  →  se genera UUID v4  →  se guarda en el borrador
                                                        ↓
                          reintento 1, reintento 2, reintento N: MISMA llave
                                                        ↓
                                   respuesta 2xx  →  se borra el borrador
```

Implementación:
- La llave vive en el **borrador** (§7), no en un `useRef` ni en una variable del handler de submit. Un `useRef` muere con el componente, y el componente muere en el re-login del `401`.
- Se genera con `crypto.randomUUID()` en la inicialización perezosa del borrador. Si ya había borrador, **se reusa la llave que traía**.
- Se limpia **solo** con `2xx`. Ni con error de red, ni con `409`, ni con `401`, ni al desmontar.
- El usuario cambia el monto y vuelve a mandar sin haber recibido `2xx`: **misma llave**, y el servidor devuelve la transacción original (§5.2). Es correcto: sigue siendo la misma intención. Para registrar algo distinto, se cierra el formulario y se abre otro — eso sí genera llave nueva.

---

## 7. Borradores de formulario y el `401`

Requisito del §18: *el `401` no pierde el contenido del formulario*. Con `capturar/` como ruta real, el problema se reduce a que el estado sobreviva a un remount.

```ts
// features/capture/stores/draft-store.ts
type Draft<T> = { idempotencyKey: string; values: T; savedAt: string };
```

- **Almacén:** Zustand con `persist` sobre `sessionStorage`. `sessionStorage`, no `localStorage`: un borrador de hace tres días es basura, y basura con una llave de idempotencia vieja.
- **Clave:** `draft:<intención>` — `draft:expense`, `draft:income`, etc. Una por intención, no una por sesión.
- **Ciclo:** se crea al abrir el formulario · se escribe en cada cambio (con debounce de 300 ms) · se borra con `2xx` o cuando el usuario cancela explícitamente.
- **El flujo del `401`:**
  1. La mutación falla con `code: "UNAUTHORIZED"`.
  2. El borrador **ya está en `sessionStorage`**; no hay que salvarlo en ese momento.
  3. Redirige a `/login?next=/capturar/gasto`.
  4. Tras el login, vuelve a esa URL.
  5. El formulario se rehidrata del borrador, **con la misma llave**, y el usuario solo vuelve a apretar Guardar.
- **`middleware.ts`** refresca la sesión de Supabase en cada request (patrón estándar de `@supabase/ssr`). La mayoría de los `401` ni llegan a la UI.

**Zustand no se usa para nada más.** No hay store global de cuentas, ni de sobres, ni de UI. Eso vive en TanStack Query o en estado local. Un store que duplica datos del servidor es dos fuentes que se pueden contradecir.

---

## 8. Primitivas de dominio — lógica pura, un archivo cada una

Estas son las que los tests vigilan. **Cada regla existe exactamente una vez.**

```
lib/domain/
├─ money.ts        formatMoney, formatBalance, splitEvenly, parseAmountInput
├─ dates.ts        todayInTimeZone, formatInstant, isDateInClosedPeriod
├─ envelopes.ts    deriveEnvelopeStatus
└─ late-capture.ts isLateCaptureNote, extractTransactionIdFromNote
```

### 8.1 `money.ts`

```ts
formatMoney(cents: string, currency?: string): string
```
Centavos string → texto. **Aritmética con `BigInt`**, nunca `Number`: el contrato manda enteros de 64 bits precisamente porque `Number` los corrompe arriba de 2^53 (§4.1). Se llama **solo al pintar**. Ningún estado, ningún valor de formulario, ningún cálculo está en unidades.

```ts
formatBalance(cents: string, kind: AccountKind): { amount: string; suffix: string | null }
```
La regla de signo del §4.5, y **depende exclusivamente del `kind`**:

| `kind` | Resultado |
|---|---|
| `cash` | tal cual, sin sufijo |
| `credit` | valor absoluto + `"debes"` |
| `receivable` | tal cual + `"te deben"` |
| `category` | tal cual, sin sufijo |
| `income_source` | valor absoluto, sin sufijo |
| `system` | **nunca llega aquí** — se filtra antes de pintar |

Nunca recibe el nombre de la cuenta ni la pantalla donde se pinta. Si alguna vez necesita ese parámetro, el diseño se rompió.

```ts
splitEvenly(totalCents: string, parts: number): string[]
```
El residuo va a la **primera** parte, nunca se descarta: `$100.00 / 3` → `["3334","3333","3333"]`. Descartarlo produce `422 SPLIT_TOTAL_MISMATCH` (§11.1). Invariante: `sum(resultado) === totalCents`, siempre.

**Consecuencia de presentación, no de la función:** el primer sobre del reparto siempre paga el centavo de más, y siempre es el mismo — el de arriba. No es un bug, pero el usuario no debería descubrirlo después. **El formulario muestra el desglose ya calculado antes de guardar** (`$33.34 · $33.33 · $33.33`), con los montos editables. Quién se queda el residuo es una decisión de la función; que se vea, es del formulario.

```ts
parseAmountInput(text: string): string | null
```
Lo que el usuario teclea (`"1,234.56"`, `"1234.5"`, `"$700"`) → centavos string, o `null` si no es válido. Es lo único que convierte de unidades a centavos, y va en el borde del formulario.

### 8.2 `dates.ts`

El más delicado, y el que rompe en producción sin que nadie lo note.

```ts
todayInTimeZone(timeZone: string): string   // "2026-08-15"
```
`bookedAt` se resuelve **en la zona del usuario antes de mandarse** (§4.2). Un gasto capturado a las 23:00 en CDMX (UTC−6) sale como el día en curso, no como el siguiente.

Implementación sin dependencia: `Intl.DateTimeFormat('en-CA', { timeZone }).format(date)` produce `YYYY-MM-DD` directo. **Nunca `toISOString().slice(0,10)`** — eso es UTC y es exactamente el bug.

```ts
formatInstant(iso: string, timeZone: string): string
```
Un `createdAt` en UTC se pinta en hora local del usuario.

**La zona sale de `GET /me`, no del navegador.** El §4.2 lo dice explícitamente. Se lee una vez en el layout raíz y se reparte por `TimezoneProvider` (Context: cambia casi nunca, y ponerlo en props lo arrastraría por todo el árbol).

### 8.3 `envelopes.ts`

```ts
deriveEnvelopeStatus(p: {
  assignedCents: string; spentCents: string;
  availableCents: string; hasBudget: boolean;
}): 'no_budget' | 'available' | 'depleted' | 'overspent'
```

Orden de evaluación, y el orden importa:
1. `!hasBudget` → `no_budget` — **se evalúa primero**, sin mirar montos.
2. `availableCents < 0` → `overspent`
3. `availableCents === 0` → `depleted`
4. resto → `available`

`hasBudget` sale del **conteo** de asignaciones, no del monto (§10.1): dos asignaciones de `+50000` y `−50000` dan `assignedCents: "0"` con `hasBudget: true`. Eso es "hubo presupuesto y quedó en cero", distinto de "nunca se asignó nada".

La API ya manda `status`; esta función existe para derivarlo cuando se calcula localmente tras una mutación optimista, y porque es la lógica que decide qué ve el usuario. **Ante discrepancia, gana el `status` del servidor.**

### 8.4 `late-capture.ts`

Ver §14 — acoplamiento a implementación del backend, aislado aquí a propósito.

---

## 9. Formularios

React Hook Form + Zod. **Los esquemas Zod se comparten entre el formulario y el Route Handler** — mismo archivo, dos consumidores: en el cliente valida para la experiencia, en el BFF valida de verdad.

Todo formulario maneja los cinco estados: cargando, deshabilitado, error, éxito y accesible (`aria-describedby` en cada error, foco al primer campo inválido).

**Los montos se capturan con teclado numérico** (`inputMode="decimal"`) y se convierten con `parseAmountInput` al salir del campo. Lo que viaja en el estado del formulario ya son centavos string.

---

## 10. La capa de traducción al español

**Un solo archivo**, `lib/i18n/es.ts`. Ningún componente escribe una etiqueta de dominio a mano.

```ts
export const es = {
  kind:          { cash: 'Cuenta', credit: 'Tarjeta', receivable: 'Te deben',
                   category: 'Sobre', income_source: 'Fuente de ingreso' },
  field:         { assignedCents: 'Asignado', spentCents: 'Gastado',
                   availableCents: 'Disponible', unassignedCents: 'Por asignar',
                   balanceCents: 'Saldo' },
  envelopeStatus:{ no_budget: 'Sin presupuesto', available: 'Disponible',
                   depleted: 'Agotado', overspent: 'Sobregiro' },
  rollover:      { accumulate: 'Acumula', reset: 'Reinicia' },
  budgetImpact:  { compensated: 'Ajustado en la quincena actual',
                   uncompensated: 'Sin quincena donde ajustar' },
  intent:        { expense: 'Gasto', income: 'Ingreso', transfer: 'Transferencia',
                   loan: 'Préstamo', loanRepayment: 'Cobro',
                   loanWriteOff: 'Dar por perdido', reversal: 'Corrección' },
  errors:        { /* §11 */ },
} as const;
```

**Palabras prohibidas en la UI** (§17 del contrato): `movement`, `entry`, `ledger`, `system`, `asiento`, `partida doble`, `movimiento contable`, y cualquier monto con su signo crudo sin pasar por `formatBalance`.

**`period` se dice "Quincena"** en toda la interfaz. Si algún día el usuario define rangos no quincenales, se cambia en este archivo y en ningún otro lado.

---

## 11. Errores: por `code`, nunca por `message`

```ts
// lib/api/errors.ts
export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    readonly details?: { field: string; constraint: string }[],
  ) { super(code); }
}
```

El cliente HTTP convierte **toda** respuesta no-2xx en un `ApiError`. Los componentes leen `error.code` y nada más.

```ts
// lib/i18n/errors.ts
export function errorMessageFor(code: string): string {
  return ERROR_MESSAGES[code] ?? 'Algo salió mal. Vuelve a intentar.';
}
```

- El catálogo cubre **los ~40 códigos del §7.2** del contrato.
- Un código desconocido cae en el fallback genérico **sin romper la pantalla**. El backend puede agregar códigos en `v1` y el front no se cae.
- **El `message` del servidor nunca se muestra.** Puede cambiar de redacción sin aviso; solo se loguea.

Códigos con manejo especial, no solo mensaje:

| `code` | Comportamiento |
|---|---|
| `IDEMPOTENCY_IN_FLIGHT` | Reintento automático a 1s con la misma llave, hasta 3 veces. **Invisible al usuario** |
| `UNAUTHORIZED` | Flujo de re-login del §7 |
| `PROFILE_DELETED` | Cierra sesión y manda a una pantalla terminal |
| `VALIDATION_FAILED` | Los `details[].field` se mapean a los campos del formulario |
| `NO_CURRENT_PERIOD` | **No es error.** Es el estado vacío "no hay quincena abierta" (§12) |
| `NEXT_PERIOD_REQUIRED` | Ofrece crear el periodo siguiente y reintentar el cierre |
| `EARLIER_PERIOD_OPEN` | No debería llegar: la UI ya ordena los cierres. Si llega, refresca la lista |
| `PERIOD_CLOSED` al capturar | Carrera rara (§16.2). Reintento con la misma llave |

**`NO_CURRENT_PERIOD` es la trampa del catálogo.** Es un `404` en el contrato, pero para el usuario es una acción pendiente, no una falla. Nunca se pinta como error.

---

## 12. Avisos persistentes

Dos, y son asimétricos porque su costo lo es.

### 12.1 Quincena vencida sin cerrar — layout raíz

**Dónde:** `app/layout.tsx`, visible en las cuatro tabs y en las pantallas de captura.
**Cuándo:** existe algún periodo con `status: "open"` y `endsOn` **anterior a hoy** en la zona del usuario.
**Query:** `GET /periods?status=open`, key `qk.openPeriods()`. **Se invalida al cerrar un periodo y al crear uno.**

Esta query es la única que no cuelga de ninguna pantalla: `GET /insights/dashboard` no trae los periodos abiertos vencidos, así que el banner necesita su propia lectura a nivel layout.

**Texto:** *"Tienes una quincena sin cerrar. Su dinero sigue apartado y no lo ves como disponible."* → acción "Cerrar quincena".

**Por qué no es opcional** (§12.3 del contrato): mientras el periodo no se cierre, su dinero asignado sigue comprometido y el usuario ve menos "Por asignar" del que realmente puede repartir, sin explicación visible. El banner es la explicación.

**Si hay varias vencidas:** se muestra **solo la más antigua**, y la acción lleva a cerrar esa. Los cierres van en orden cronológico y la API rechaza el desordenado (§15.2) — ofrecer las otras sería ofrecer un botón que falla.

### 12.2 Transacciones sin quincena — Inicio y Movimientos

**Dónde:** banner en Inicio y en Movimientos. No en el layout raíz.
**Cuándo:** `dashboard.unbudgetedTransactions.length > 0`.
**Texto:** *"N movimientos no caen en ninguna quincena."* → acción "Ver" (Movimientos, filtrado) y "Crear quincena que los cubra".

**Por qué no en todas las pantallas:** es informativo, no cuesta dinero visible. Dos banners permanentes en cada pantalla dejan de leerse en una semana, y el que se deja de leer es el que sí importaba.

### 12.3 Ninguno bloquea nada

Ni capturar, ni asignar, ni navegar. Los avisos informan y ofrecen la acción.

**Capturar un gasto no se bloquea nunca, con ningún aviso.** Es el caso de uso central y la API no lo bloquea.

---

## 13. Tokens de diseño

Todo valor visual sale de tokens en CSS variables, consumidos por Tailwind. Cero hex sueltos en componentes.

Familias necesarias: color (incluidos los cuatro estados de sobre y el rojo de sobregiro), tipografía, espaciado, radios, sombras, breakpoints, z-index, motion.

**Un token semántico por estado de sobre** (`--state-no-budget`, `--state-available`, `--state-depleted`, `--state-overspent`), no colores crudos. `no_budget` se pinta **distinto** de `depleted` — es requisito del §18, no gusto.

**`unassignedCents` negativo** se pinta en el color de sobregiro, con el monto y el texto *"Te pasaste por $X"*. No tiene `kind`, así que `formatBalance` no aplica; se maneja como caso propio en el componente de "Por asignar".

La dirección visual concreta (paleta, tipografías) queda **pendiente** — no bloquea el `TASK`, que trabaja contra nombres de token, no contra valores.

---

## 14. Acoplamiento a implementación del backend — **no es contrato**

⚠️ **Esta sección documenta algo que el `API-CONTRACT.md` no garantiza.**

El §15.1b del contrato exige distinguir un ajuste de captura tardía de una asignación manual cualquiera, para pedir una confirmación distinta antes de borrarlo — pero **no especifica el formato de la `note`**. El formato real, leído del código del backend (`src/shared/ledger/budget-compensations.ts:25`):

```
Ajuste por captura tardía — tx {transactionId}, fecha {bookedAt}
```

Ejemplo: `Ajuste por captura tardía — tx 47e2117a-5883-4895-8050-00f9883c1fb9, fecha 2026-08-12`

**Reglas de uso:**

```ts
// lib/domain/late-capture.ts
export const LATE_CAPTURE_NOTE_PREFIX = 'Ajuste por captura tardía';
```

- Se detecta **por prefijo**, nunca por la cadena completa.
- El guión es una **raya larga (—, U+2014)**, no un guión normal. Un `-` ASCII no casa.
- Del texto se extrae el `transactionId`, y eso habilita algo mejor que solo advertir: **el diálogo de confirmación enlaza a la transacción que originó el ajuste**, para que el usuario vea de qué se trata antes de borrarlo.
- Si no se puede extraer el id, el ajuste **sigue detectándose** por prefijo y la confirmación se muestra sin enlace. Nunca al revés.

**Riesgo aceptado y por qué:** este string es un detalle de implementación del backend, no parte del contrato. Si cambia, el front se entera rompiéndose. Se mitiga aislándolo en una constante única con test propio: el arreglo es un archivo, y el test lo señala.

---

## 15. Estructura de archivos

```
src/
├─ app/                              (§2)
├─ features/
│  ├─ onboarding/     components/ hooks/ services/ schemas/
│  ├─ dashboard/
│  ├─ accounts/
│  ├─ envelopes/                     sobres: categories + allocations
│  ├─ transactions/                  las 7 intenciones + reversas
│  ├─ periods/                       quincenas, close-preview, cierre
│  ├─ recurring/
│  └─ profile/
├─ components/
│  ├─ ui/                            atoms: Button, Input, Sheet, Badge…
│  ├─ money/                         Money, Balance, AmountInput
│  ├─ states/                        EmptyState, ErrorState, Skeleton
│  └─ layout/                        TabBar, Fab, Banners
├─ lib/
│  ├─ api/                           client.ts, errors.ts, server-api.ts
│  ├─ bff/                           allowlist.ts, forward.ts
│  ├─ domain/                        money.ts, dates.ts, envelopes.ts, late-capture.ts
│  ├─ i18n/                          es.ts, errors.ts
│  ├─ query-keys.ts
│  └─ supabase/                      client.ts, server.ts, middleware.ts
└─ types/                            api.ts — tipos derivados del contrato
```

Organizado por dominio: el árbol dice qué hace el producto, no qué framework usa. `components/ui` guarda solo piezas sin conocimiento de dominio.

---

## 16. Tabla de decisiones

| Decisión | Razón | Alternativa descartada | Qué se rompería si cambiamos esto |
|---|---|---|---|
| Tab bar de 4 + FAB | El pulgar llega mejor a la esquina inferior que al centro de la barra | Botón central en la barra; navegación sin tabs | Los avisos persistentes pierden su lugar fijo |
| `capturar/` como ruta real full-screen | El §18 exige que el `401` no pierda el formulario; una URL propia lo hace casi solo | Bottom sheet sin URL; intercepting route | El re-login volvería a Inicio y el borrador quedaría huérfano |
| FAB directo a Gasto | Es el movimiento dominante; las otras 6 viven en `capturar/otro` | Selector de intención en el FAB | Un tap extra en el flujo que más se usa |
| Un formulario por intención | Los campos de las 7 intenciones casi no se traslapan | Formulario polimórfico con selector de tipo | Un `if` gigante, sin forma de testear una intención aislada |
| Híbrido RSC + TanStack Query | Sin polling (§15.7), la invalidación fina es lo único que refresca; y en móvil importa el primer render con datos | Solo RSC (`router.refresh()` revalida de más); solo cliente (esqueleto en cada navegación) | Se pierde el control de qué se refresca tras cada mutación |
| BFF catch-all **con allowlist** | Un catch-all pelón expone cualquier endpoint futuro sin que nadie lo decida | Proxy abierto; 35 handlers dedicados | Exponer un endpoint dejaría de ser un acto deliberado |
| Handlers dedicados para los 9 idempotentes | Tienen validación Zod y el reintento de `IN_FLIGHT`; el catch-all no debe cargarlos | Meterlos en el catch-all | `IDEMPOTENCY_IN_FLIGHT` se volvería un error visible |
| Llave de idempotencia en el borrador persistido | Debe sobrevivir al remount del re-login | `useRef` o estado del componente | Un reintento tras `401` generaría llave nueva → transacción duplicada |
| Borradores en `sessionStorage` | Un borrador de tres días trae una llave vieja e inútil | `localStorage`; solo memoria | Con `localStorage`, llaves zombis; solo en memoria, se pierde en el re-login |
| Optimistic solo en `PUT` allocations | Es idempotente por diseño; las transacciones dependen de `budgetImpact` del servidor | Optimistic en todo | Se pintaría un gasto como aplicado sin saber si fue `compensated` |
| `GET /periods?status=open` en el layout raíz | El dashboard no trae los vencidos y el banner es obligatorio | Derivarlo del dashboard | El banner no aparecería, y el §18 lo exige |
| Banners asimétricos | Dos permanentes en todas las pantallas dejan de leerse | Ambos en el layout; ambos solo en Inicio | El aviso que cuesta dinero se perdería entre ruido |
| Los avisos no bloquean nada | El aviso ya dice lo que hay que saber; la fricción la sufre el propio usuario | Bloquear asignación con periodo vencido | Fricción cada quincena, sin ganancia real |
| Onboarding en una sola pantalla | Lo ven tres personas, una vez; reusa pantallas que ya existen | Wizard lineal; checklist retomable | Un flujo paralelo que se mantiene para tres usos |
| Saldos iniciales por cuenta, no en el onboarding | Agregar una cuenta seis meses después usa el mismo camino | Capturarlos dentro del onboarding | Dos flujos que hacen lo mismo, uno de ellos sin usar |
| Recurrentes: leer, confirmar y crear (sin editar/borrar) | Sin `POST` la feature no se puede usar nunca; editar y borrar sí esperan | CRUD completo; solo lectura | Sin `POST`, un estado vacío sin acción posible |
| Corregidas visibles, sin filtro | El backend no permite borrar y el diseño lo abraza | Agrupar; filtro para ocultar | Se disimularía una restricción dura en vez de explicarla |
| `formatMoney` / `formatBalance` con `BigInt` | Los montos son enteros de 64 bits (§4.1) | `Number` y dividir entre 100 | Corrupción silenciosa arriba de 2^53 |
| `bookedAt` con `Intl.DateTimeFormat` en la zona de `/me` | `toISOString()` es UTC y manda el día equivocado de noche | Zona del navegador; `toISOString().slice(0,10)` | Transacciones cayendo en la quincena equivocada |

---

## 17. Huecos detectados en la API

**Ninguno bloqueante.** Los dos que había están resueltos:

1. **Formato de la `note` de captura tardía** — resuelto leyendo el código del backend. Documentado en §14 como acoplamiento a implementación, no como contrato. No requiere tocar el backend.
2. **`unassignedCents` negativo** — el contrato no dice cómo pintarlo y no tiene `kind`. Resuelto en §13: color de sobregiro, monto con signo, texto *"Te pasaste por $X"*.

**Observación sin acción, para el registro:** `GET /insights/dashboard` no incluye los periodos abiertos vencidos, lo que obliga a una segunda query global. No es un defecto —el dashboard es del periodo actual, y un vencido no lo es— pero es la única lectura que no cuelga de una pantalla, y por eso es la más fácil de olvidar al invalidar.

---

## 18. Pendiente

Lo que **no** quedó cerrado en esta fase. Nada de esto bloquea el `TASK-front.md`:

1. **Dirección visual concreta** — paleta, tipografías, densidad. El `TASK` trabaja contra nombres de token.
2. **Copy fino de los estados vacíos** — los textos están en el mapa de pantallas y son corregibles sin tocar arquitectura.
3. **Recurrentes: editar y borrar plantillas** — fuera de v1. Para saltar un ciclo hoy hay que editar `nextDueOn`, que sin `PATCH` no se puede: **limitación conocida y aceptada de v1**.
4. **Offline** — fuera de alcance. El código queda estructurado para que un reintento automático con backoff sea un cambio en la capa de mutaciones, sin tocar formularios.
5. **Multi-moneda en la UI** — la API la soporta por cuenta (§4.6) pero no hay totales consolidados. La UI de v1 asume MXN en los agregados; si aparece una cuenta en otra moneda, se pinta con su propia moneda y **no se suma** con las demás.
6. **Archivar y desarchivar** — los endpoints existen; en la UI viven en "Más". Prioridad baja.
