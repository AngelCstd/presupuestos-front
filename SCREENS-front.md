# SCREENS-front.md — Glosario y mapa de pantallas

> Complemento de `ARCHITECTURE-front.md`. Aquí vive **qué existe**, no **cómo se construye**.
> Cada pantalla declara: ruta · endpoints que la alimentan · términos en español · qué muestra cuando está vacía.

---

## Parte 1 — Glosario: la única traducción válida

Vive en `lib/i18n/es.ts`. Ningún componente escribe estas palabras a mano.

### Entidades

| API | Interfaz | Nota |
|---|---|---|
| `account` (`kind: cash`) | Cuenta | |
| `account` (`kind: credit`) | Tarjeta | Saldo en valor absoluto + "debes" |
| `account` (`kind: receivable`) | Te deben | |
| `category` | **Sobre** | Nunca "categoría" |
| `income_source` | Fuente de ingreso | |
| `period` | **Quincena** | |
| `allocation` | Asignación | |
| `recurring template` | Recordatorio | |
| `reversal` | Corrección | |

### Campos

| API | Interfaz |
|---|---|
| `assignedCents` | Asignado |
| `spentCents` | Gastado |
| `availableCents` | **Disponible** |
| `unassignedCents` | **Por asignar** |
| `balanceCents` | Saldo |
| `bookedAt` | Fecha |
| `description` | Descripción |
| `rolloverType: accumulate` | Acumula |
| `rolloverType: reset` | Reinicia |

### Estados de sobre

| API | Interfaz | Color |
|---|---|---|
| `no_budget` | Sin presupuesto | `--state-no-budget` (gris) |
| `available` | Disponible | `--state-available` |
| `depleted` | Agotado | `--state-depleted` |
| `overspent` | **Sobregiro** | `--state-overspent` (rojo) |

### Intenciones

| Endpoint | Interfaz |
|---|---|
| `/transactions/expenses` | Gasto |
| `/transactions/incomes` | Ingreso |
| `/transactions/transfers` | Transferencia · **Pago de tarjeta** |
| `/transactions/loans` | Préstamo |
| `/transactions/loan-repayments` | Cobro |
| `/transactions/loan-write-offs` | Dar por perdido |
| `/transactions/opening-balances` | Saldo inicial |
| `/transactions/{id}/reversal` | Corrección |

### Impacto en el presupuesto

| API | Interfaz |
|---|---|
| `in_open_period` | *(no se muestra nada)* |
| `no_period` | Este movimiento no cae en ninguna quincena |
| `compensated` | Ajustado en la quincena actual |
| `uncompensated` | Sin quincena donde ajustar |

### Prohibido en la UI

`movement` · `entry` · `ledger` · `system` · "asiento" · "partida doble" · "movimiento contable" · cualquier monto con signo crudo sin pasar por `formatBalance`.

⚠️ **Pago de tarjeta es una transferencia, nunca un gasto.** El gasto ya se contabilizó al comprar. Si la UI ofrece "pagar tarjeta", llama a `/transfers`. Registrarlo como gasto lo cuenta dos veces y descuadra el presupuesto entero — es el error más común de este dominio.

---

## Parte 2 — Mapa de pantallas

Tab bar: **Inicio · Sobres · Movimientos · Más**. FAB abajo a la derecha → `/capturar/gasto`.

---

### `/empezar` — Onboarding

**Fuera de la tab bar.** Una sola pantalla, un solo botón.

**Cuándo aparece:** `GET /accounts?kind=cash` devuelve `total: 0` (§15.3 — no hay flag).

**Contenido:**
1. Nombre de la primera cuenta + su saldo de hoy
2. Los 7 sobres sugeridos con checkbox **preseleccionado** (Comida `reset` · Transporte `reset` · Servicios `accumulate` · Hogar `reset` · Salud `accumulate` · Personal `reset` · Ahorro `accumulate`)
3. "Sueldo" como fuente de ingreso, con checkbox preseleccionado

**Al confirmar, en orden:** `POST /accounts` → `POST /transactions/opening-balances` (una sola llamada, con `Idempotency-Key`) → `POST /categories` × N → `POST /income-sources` × N → `/` .

**Lo que NO hace:** crear la primera quincena ni asignar presupuesto. Eso pasa en las pantallas normales, que ya existen. Más cuentas también se agregan después, por el camino normal.

**Vacío:** no aplica — esta pantalla *es* el estado vacío de la app.

---

### `/` — Inicio

**Endpoint:** `GET /insights/dashboard` (una sola llamada: cuentas, `unassignedCents`, periodo, sobres, no presupuestadas).

**Bloques, en orden:** Por asignar (el número grande) · Sobres del periodo (resumen) · Saldos de cuentas · Últimos movimientos.

**Banners:** quincena vencida (desde el layout raíz) · movimientos sin quincena.

| Estado vacío | Condición | Texto | Acción | Tono |
|---|---|---|---|---|
| Sin cuentas | `accounts` sin ninguna `cash` | — | **Guard**: redirige a `/empezar` | — |
| Sin quincena abierta | `dashboard.period === null` | "No hay quincena abierta" · "Tus gastos se siguen registrando, pero no cuentan en ningún presupuesto." | Crear quincena (prellenada 1–15 o 16–fin) | pendiente |
| Por asignar en cero, con asignaciones | `unassignedCents === "0"` y algún sobre con `hasBudget: true` | "Todo repartido" · "Cada peso tiene un sobre." | ninguna | **éxito** |
| Por asignar en cero, sin asignaciones | `unassignedCents === "0"` y ningún sobre con `hasBudget: true` | "Aún no repartes nada" · "Cuando registres un ingreso vas a ver aquí cuánto tienes por asignar." | Registrar ingreso | pendiente |
| Ningún sobre presupuestado | todos los `categories[].status === "no_budget"` | "Ninguno de tus sobres tiene presupuesto esta quincena" | Repartir → `/sobres` | pendiente |
| Sin gastos | todos los `spentCents === "0"` | "Sin gastos todavía" | ninguna | **éxito** |
| Por asignar negativo | `unassignedCents < 0` | "Te pasaste por $X" — en rojo, con el monto | Ver sobres en sobregiro | pendiente |

> Las dos filas de "Por asignar en cero" se distinguen por el **conteo de `hasBudget`**, no por el monto. Es la misma razón por la que el contrato separa `hasBudget` de `assignedCents`.

---

### `/sobres` — Sobres de la quincena

**Endpoint:** `GET /categories?periodId=<actual>`
**Escritura:** `PUT /periods/{id}/allocations/{categoryId}` — **nunca** el `POST` de delta (§18 del contrato).

Cada tarjeta: nombre · Asignado · Gastado · Disponible · estado con su color · campo para fijar el asignado.

| Estado vacío | Condición | Texto | Acción | Tono |
|---|---|---|---|---|
| Cero sobres | `total: 0` | "No tienes sobres" · "Un sobre es una bolsa de dinero con nombre: Comida, Transporte, lo que uses." | Crear sobre · Usar los sugeridos | pendiente |
| Sin quincena | `period === null` | "Necesitas una quincena abierta para repartir" | Crear quincena | pendiente |
| Sobre `no_budget` | `status === "no_budget"` | "Sin presupuesto" — gris, **sin monto de disponible** | Asignar | pendiente |
| Sobre `depleted` | `status === "depleted"` | "Agotado" · "$0.00 disponible de $X asignados" | Mover dinero aquí | neutral |
| Sobre `overspent` | `status === "overspent"` | "Sobregiro de $X" | Cubrir | pendiente |
| Sobre `overspent` con `spentCents: "0"` | `status === "overspent"` **y** `spentCents === "0"` | "Sobregiro de $X" · "Es un gasto de la quincena pasada, ya cerrada. Se cubre con esta." | Cubrir | pendiente |

> La última fila es el caso del §11.12: lo gastado está en la quincena anterior, lo que hay que cubrir está en esta. La explicación va **en la tarjeta**, no en un tooltip — si hay que buscarla, no sirve.

**Cubrir un sobregiro:** de la misma respuesta, filtra `availableCents > 0`, ordena descendente, ofrece esos sobres como origen → `POST /periods/{id}/allocations/move`.

---

### `/sobres/[categoryId]` — Detalle de sobre

**Endpoints:** `GET /categories/{id}` · `GET /categories/{id}/ledger` (cursor)
**Escritura:** `PATCH` (nombre, `rolloverType`) · archivar

| Estado vacío | Condición | Texto | Acción | Tono |
|---|---|---|---|---|
| Sin gastos, con presupuesto | ledger vacío, `hasBudget: true` | "Nada gastado en este sobre" | ninguna | **éxito** |
| Nunca usado | ledger vacío, `hasBudget: false` | "Este sobre no se ha usado" | Asignar dinero | neutral |

**Archivar:** falla con `409 CATEGORY_HAS_ALLOCATIONS` si tiene presupuesto en un periodo abierto → el mensaje dice "Quita primero su presupuesto de la quincena actual".

---

### `/movimientos` — Historial

**Endpoint:** `GET /transactions` (cursor, orden fijo: más reciente primero)
**Filtros:** `from`/`to`, `accountId`, `categoryId`.

Cada fila: fecha · descripción · monto · cuentas tocadas (aplicando `formatBalance` con `accountKind`).

**Transacciones corregidas** — visibles ambas, sin filtro para ocultarlas:
- La original con `reversedByTransactionId !== null` → **tachada**, etiqueta "Corregida"
- La reversa con `reversesTransactionId !== null` → etiqueta "Corrección"

| Estado vacío | Condición | Texto | Acción | Tono |
|---|---|---|---|---|
| Nada registrado | sin filtros, `data: []` | "Aún no registras nada" · "Captura tu primer gasto y aquí va a quedar el historial." | Capturar gasto | pendiente |
| Nada con estos filtros | `data: []` con filtro activo | "Ningún movimiento con estos filtros" | Quitar filtros | neutral |
| Nada en la quincena | filtro = rango del periodo actual | "Sin gastos todavía" | ninguna | **éxito** |

---

### `/movimientos/[transactionId]` — Detalle

**Endpoints:** `GET /transactions/{id}` · `PATCH` (solo `description`) · `POST /transactions/{id}/reversal`

Muestra los `movements` traducidos a lenguaje de usuario — **nunca la palabra "movimiento contable"**: "Salió de TDC BBVA", "Se cargó a Comida", "Fer te debe".

**Corregir:** `POST /transactions/{id}/reversal` con `Idempotency-Key` y **sin `bookedAt`**. Si el original fue captura tardía, mandarlo devuelve `422 REVERSAL_DATE_LOCKED`.
Después de la reversa, se ofrece capturar la versión correcta — con **otra** llave.

**Bloqueos:** `409 ALREADY_REVERSED` ("Este movimiento ya está corregido") · `409 CANNOT_REVERSE_REVERSAL` ("Una corrección no se corrige; registra un movimiento nuevo").

---

### `/capturar/gasto` — El camino corto

**Destino del FAB.** Full-screen, sin tab bar.
**Endpoint:** `POST /transactions/expenses` con `Idempotency-Key`.

**Campos:** monto · sobre (recuerda el último usado) · cuenta de pago (recuerda la última usada) · fecha (default: hoy en la zona de `/me`) · descripción · repartir entre varios sobres (colapsado) · parte prestada (colapsado).

**Antes de guardar:** si `bookedAt` cae en una quincena cerrada, **avisar** (§18). No después.

**Después de guardar,** según `budgetImpact.status`:

| `status` | Mensaje |
|---|---|
| `in_open_period` | nada, se cierra y vuelve |
| `compensated` | "Se descontó de {categoryName} en la quincena actual, porque esa quincena ya está cerrada." |
| `uncompensated` | "El gasto afectó tu saldo pero ninguna quincena." → Crear quincena actual |
| `no_period` | "Este movimiento no cae en ninguna quincena." → Ver pendientes |

**Repartir entre sobres:** usa `splitEvenly` — el residuo va a la primera parte, nunca se descarta.

**Vacío:** cero sobres → "Necesitas al menos un sobre para registrar un gasto" → Crear sobre. Con el guard de onboarding, cuentas siempre hay.

---

### `/capturar/otro` — Las otras seis intenciones

Selector de seis destinos: Ingreso · Transferencia · Préstamo · Cobro · Dar por perdido · Saldo inicial.

| Ruta | Endpoint | Vacío |
|---|---|---|
| `/capturar/ingreso` | `POST /transactions/incomes` | Sin fuentes de ingreso → "Crea una fuente de ingreso" |
| `/capturar/transferencia` | `POST /transactions/transfers` | Menos de 2 cuentas → "Necesitas dos cuentas" |
| `/capturar/prestamo` | `POST /transactions/loans` | Sin cuentas `receivable` → "Crea una cuenta de 'te deben'" |
| `/capturar/cobro` | `POST /transactions/loan-repayments` | Sin `receivable` con saldo → "Nadie te debe nada" (**éxito**) |
| `/capturar/perdida` | `POST /transactions/loan-write-offs` | Sin `receivable` con saldo → igual |

**Transferencia** incluye el atajo "Pago de tarjeta": origen `cash`, destino `credit`. **Llama a `/transfers`, jamás a `/expenses`.**

**Dar por perdido** exige elegir un sobre; la API no crea una categoría de "Pérdidas" (§15.5). La UI sugiere crear una la primera vez.

---

### `/cuentas` y `/cuentas/[accountId]`

**Endpoints:** `GET /accounts` · `GET /accounts/{id}/ledger` · `POST /accounts` · `PATCH` · archivar/desarchivar · `POST /transactions/opening-balances`

| Estado vacío | Condición | Texto | Acción | Tono |
|---|---|---|---|---|
| Cuenta nueva sin saldo | `balanceCents === "0"` **y** ledger vacío | "Sin saldo inicial" · "¿Cuánto hay en esta cuenta hoy?" | Capturar saldo inicial | pendiente |
| Saldo cero real | `balanceCents === "0"` **y** ledger no vacío | "$0.00", sin mensaje | ninguna | neutral |
| Sin archivadas | `includeArchived=true` no agrega nada | "No tienes cuentas archivadas" | ninguna | neutral |

> Las dos primeras se ven idénticas en el saldo y son cosas opuestas. La condición incluye el ledger, no solo el monto.

**Archivar** exige saldo exactamente cero → `409 ACCOUNT_NOT_EMPTY` = "Salda o transfiere el dinero antes de archivar".

---

### `/quincenas` y `/quincenas/[periodId]/cerrar`

**Endpoints:** `GET /periods` · `POST /periods` · `PATCH` · `DELETE` · `GET /periods/{id}/close-preview` · `POST /periods/{id}/close`

**Lista:** cronológica. Las vencidas sin cerrar, arriba y destacadas. **Solo la más antigua ofrece "Cerrar"** — la API rechaza el cierre desordenado (§15.2) y ofrecer las otras sería ofrecer un botón que falla.

**Pantalla de cierre** (`close-preview`, no escribe nada): por sobre, `action` traducida —

| `action` | Texto |
|---|---|
| `carry_forward` | "Se arrastra $X a la siguiente" |
| `release` | "Se liberan $X para asignar" |
| `carry_deficit` | "Se arrastra un déficit de $X" |
| `none` | "Sin cambios" |

⚠️ **Aviso obligatorio, prominente:** *"Al cerrar, las asignaciones de esta quincena quedan congeladas para siempre. Es el último momento para editarlas."* No hay reapertura en v1 (§15.1).

Si `canClose === false`, el botón se deshabilita y se muestran los `blockers` traducidos. `NEXT_PERIOD_REQUIRED` ofrece crear el periodo siguiente ahí mismo.

**Borrar un periodo:** si su rango contiene transacciones, avisar antes — esos movimientos van a aparecer como "sin quincena".

**Borrar una asignación que es ajuste de captura tardía** (`note` con el prefijo de §14 de la arquitectura): confirmación **distinta**, con enlace a la transacción que lo originó: *"Este ajuste cubre un gasto de una quincena ya cerrada. Si lo borras, ese gasto queda sin cubrir."*

| Estado vacío | Texto | Acción | Tono |
|---|---|---|---|
| Cero periodos | "Aún no creas ninguna quincena" · "Una quincena es el rango donde vive tu presupuesto. Puedes usar 1–15 y 16–fin, o el rango que te acomode." | Crear la primera | pendiente |
| Nada por cerrar | "Todo al día" · "No tienes quincenas vencidas sin cerrar." | ninguna | **éxito** |

---

### `/recordatorios` y `/recordatorios/nuevo`

**Endpoints:** `GET /recurring-templates` · `POST /recurring-templates` · `POST /recurring-templates/{id}/confirm`
**Fuera de v1:** editar y borrar plantillas.

Cada uno: nombre · monto estimado · sobre · cuenta sugerida · próxima fecha. Los `isDue: true`, arriba.

**Confirmar** abre un formulario prellenado (monto, cuenta y fecha sobreescribibles) → `POST .../confirm` con `Idempotency-Key`. El monto real **no** cambia el estimado de la plantilla.

| Estado vacío | Texto | Acción | Tono |
|---|---|---|---|
| Cero plantillas | "No tienes recordatorios" · "Sirven para lo que pagas cada mes: renta, wifi, suscripciones." | Crear recordatorio | pendiente |
| Ninguno vencido | "Nada por confirmar" | ninguna | **éxito** |

---

### `/mas` — Ajustes

Perfil (`GET`/`PATCH /me`, zona horaria) · Fuentes de ingreso · Cuentas · Quincenas · Recordatorios · Archivadas · Cerrar sesión.

⚠️ Cambiar la zona horaria cambia cómo se resuelve "hoy" y, con ello, en qué quincena caen los gastos capturados. Se avisa antes de guardar.

| Estado vacío | Texto | Tono |
|---|---|---|
| Sin fuentes de ingreso | "No tienes fuentes de ingreso" · "Sirven para saber de dónde viene tu dinero." | pendiente |

---

## Parte 3 — Estados que nunca se pintan como error

| Situación | Cómo se ve |
|---|---|
| `404 NO_CURRENT_PERIOD` | Estado vacío con acción "Crear quincena" |
| `409 IDEMPOTENCY_IN_FLIGHT` | **Invisible.** Reintento automático a 1s |
| `unbudgetedTransactions: []` | El banner no se pinta. La ausencia es el estado |
| Sobre `no_budget` | "Sin presupuesto", gris. Ni error ni cero |
| Sobre `overspent` con `spentCents: "0"` | Sobregiro **con explicación**, no un bug |
| `budgetImpact: "compensated"` | Mensaje informativo, tono neutro |
| `unassignedCents: "0"` con asignaciones | **Celebración.** "Todo repartido" |
