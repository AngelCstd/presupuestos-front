# PROGRESS.md

## 2026-08-24 — Sesión de implementación (U23 — `/mas`, cierre del grafo)

Los seis en verde (207/207, sin tocar tests salvo la excepción ya autorizada
de `i18n.test.ts`). `ARCHITECTURE-front.md` §2 es explícito: `mas/page.tsx`
es **una sola página**, sin subrutas — "perfil, zona horaria, fuentes de
ingreso, archivadas" todo ahí. Nada de `/mas/perfil` ni `/mas/archivadas`.

**Perfil y zona horaria:** `Intl.supportedValuesOf('timeZone')` — nativo de
ECMA-402, sin agregar ninguna dependencia — da la lista real de zonas IANA
para el `<select>`. Cambiarla pasa por `ConfirmDialog` (U21) con el aviso
exacto que pide `TASK-front.md` antes de guardar; `400 INVALID_TIMEZONE` usa
el catálogo (ya estaba desde U6).

**Descubrimiento no documentado en ningún lado — vale la pena que quede
aquí:** `TimezoneProvider` se siembra **una sola vez**, en el layout raíz
(Server Component), leyendo `GET /me` server-side (`app/layout.tsx`). Un
`PATCH /me` desde el cliente no toca ese Context — invalidar `qk.me()` en
TanStack Query no alcanza, porque nada bajo `useTimezone()` lee de ahí.
Hace falta `router.refresh()` después de guardar para que el layout raíz
vuelva a correr server-side y reparta la zona nueva. Sin esto, capturar un
gasto inmediatamente después de cambiar la zona seguiría resolviendo "hoy"
con la zona vieja hasta el siguiente refresh completo — un bug silencioso,
no uno que tronara.

**`useArchiveCategory` cambió de forma:** antes solo archivaba
(`mutate(undefined)`); ahora es un toggle (`mutate(archive: boolean)`),
mismo patrón que `useArchiveAccount` desde U20. Necesario para "Reactivar"
en Archivadas. Su único llamador (`CategoryDetailView.tsx`) se actualizó a
`mutate(true)`.

**"Archivadas" necesita listas que ninguna vista pedía hasta ahora** (cuentas,
sobres y fuentes de ingreso, cada uno con `includeArchived: true`, filtrados
por `archivedAt !== null`). Sin tocar el comportamiento de las vistas
existentes: `useAccounts`, `useCategories` y `useIncomeSources` ganaron un
parámetro `includeArchived` opcional, y `qk.categories`/`qk.incomeSources`
solo agregan un marcador `'archived'` a la key cuando `includeArchived` es
`true` — con el default (`{}`), la key sale idéntica a antes
(`tests/query-keys.test.ts` sigue en verde sin tocarlo, confirma que la
extensión es compatible hacia atrás).

**Barrido de navegación, pedido explícitamente por el humano tras el patrón
que ya apareció tres veces (Cuentas ayer, Recordatorios ayer, y de nuevo
aquí):** revisé cada `page.tsx` bajo `(app)/` y `capturar/` y confirmé su
punto de entrada:
- `/movimientos/[transactionId]` y `/sobres/[categoryId]` **ya estaban bien**
  — `TransactionRow.tsx` y `CategoryCard.tsx` ya envolvían la fila en un
  `Link`. No eran parte del patrón, solo parecía que sí a primera vista.
- `/cuentas` y `/recordatorios`: el enlace temporal de ayer se reemplazó por
  las filas de navegación reales dentro de `/mas` (`Cuentas` · `Periodos` ·
  `Recordatorios`).
- `/capturar/otro` y las cinco intenciones detrás de él: confirmadas,
  entran desde Inicio → `/capturar/otro` → cada una.
- Todo lo demás (tab bar, FAB, `/empezar`, `/login`) ya tenía su entrada.

**Fuga de glosario encontrada por el propio grep, no a mano:** el enlace de
navegación a `/periodos` con la etiqueta `"Periodos"` escrita directo violaba
el checker (contiene "Periodo"). Se cambió a `` `${es.entity.period}s` `` —
mismo patrón de composición ya usado para "sobres sugeridos" en onboarding,
en vez de agregar una entrada nueva a `es.nav` solo para esto.

**`ARCHITECTURE-front.md` §2 (solo lectura) sigue mostrando `quincenas/` en
su árbol de carpetas** — quedó desactualizado por el rename de ayer y no se
puede tocar. Mismo trato que el resto de su prosa en "quincena": aceptado
como texto no normativo, no un contrato que el código deba igualar
literalmente.

**Con esto, el grafo completo de `TASK-front.md` (U0–U23) está construido.**
Quedan pendientes solo las piezas explícitamente diferidas y documentadas en
sesiones anteriores: la fase de revisión de lenguaje ("Por asignar" negativo,
etc.), `PATCH /periods/{id}`, y los tres archivos de test pendientes de una
sesión de tests (`bff-routes.test.ts`, `isDateInClosedPeriod`,
`isRealAccountKind`).

## 2026-08-24 — Sesión de implementación (U22 — `/recordatorios`)

Los seis en verde (207/207, sin tocar tests salvo la excepción ya autorizada
de `i18n.test.ts`). `/recordatorios` (lista, `isDue: true` arriba, confirmar
inline con `ConfirmRecurringForm`) y `/recordatorios/nuevo` (página propia,
no Sheet — a diferencia de cuentas/periodos, `SCREENS-front.md` nombra
`/recordatorios/nuevo` como ruta explícita).

**Sin `MutationName` propio para crear una plantilla:** el más cercano
(`confirmRecurring`) invalida `dashboard`/`accounts`/`transactions`/etc., que
no cambian al crear una plantilla, solo al confirmarla. En vez de forzar una
reutilización que invalida de más, `useCreateRecurringTemplate` invalida el
prefijo `['recurring-templates']` directamente, sin pasar por
`invalidationFor` — documentado en el propio hook. `confirmRecurring` sí
tenía fila en la matriz desde U10 y se usó tal cual.

**Sin `Idempotency-Key` en la creación de la plantilla, sí en la
confirmación:** `POST /recurring-templates` no es uno de los 9 endpoints
idempotentes (los 9 son las 7 intenciones + reversa + confirmar recurrente),
así que el formulario de creación usa estado de formulario simple, sin
`useDraft` — mismo criterio que `CreateAccountForm`/`CreatePeriodForm`. La
confirmación sí pasa por `useDraft` (`confirm-recurring:<templateId>`),
prellenado con el monto/cuenta/fecha de la plantilla y sobreescribible, tal
como pide `SCREENS-front.md`.

**`budgetImpact` en la confirmación:** el JSON de ejemplo de
`API-CONTRACT.md` §13 no lo muestra en `transaction`, pero la prosa de §11.12
sí lo exige explícitamente ("presente... dentro de `transaction` en la
confirmación de un recurrente") — confirmado antes de asumir que el tipo
`ConfirmRecurringResult.transaction: TransactionMutationResult` (ya existente
desde una sesión anterior) estuviera mal. No lo estaba; el ejemplo del
contrato solo estaba abreviado. Se reusa `BudgetImpactMessage` (mismo
componente de U18) tras confirmar.

**Hallazgo, no arreglado — mismo patrón que `/cuentas` de ayer:** `/recordatorios`
tampoco tiene ningún enlace de entrada dentro de la app todavía (`/mas` sigue
siendo el placeholder de U23). A diferencia de `/cuentas`, no agregué un
enlace temporal sin preguntar — lo anoto aquí para que se decida explícitamente.

## 2026-08-24 — Cambio de glosario ("Quincena" → "Periodo") + dos bugs de U20

### 1. Cambio de glosario: "Quincena" → "Periodo"

Decisión del humano: la app admite cualquier rango de fechas (no solo
quincenal), y `API-CONTRACT.md` §17 ya sugería exactamente esto — `| period |
**Quincena** (o "Periodo" si el usuario define rangos no quincenales) |`.
Precisión sobre calidez.

**Alcance del cambio:**
- `lib/i18n/es.ts`: `entity.period`, `budgetImpact.*`, comentarios; se agregó
  `periodStatus` (usado por U21) en género correcto (`Abierto`/`Cerrado`, no
  `Abierta`/`Cerrada` — concordaba con "Quincena", no con "Periodo").
- Ruta `/quincenas` → `/periodos` (carpeta renombrada). Todo identificador que
  mencionaba "Quincena" en su nombre, actualizado (mismo patrón que
  `SobresView` → `EnvelopesView`).
- Todo texto en español bajo `src/` que decía "quincena", actualizado — **con
  concordancia de género revisada a mano**: "quincena" es femenino, "periodo"
  es masculino, y un reemplazo de texto ciego deja "esta periodo", "ninguna
  periodo", "la quincena" → "la periodo" (debería ser "el periodo"), etc. Se
  revisó cada ocurrencia después del reemplazo automático — encontré y corregí
  ~15 casos de concordancia rota (artículos, demostrativos, adjetivos como
  "cerrada"/"abierta"/"vencida", y dos casos de elipsis: "la más antigua" →
  "el más antiguo", "Crear la primera" → "Crear el primero").
- `SCREENS-front.md` y `TASK-front.md`: mismo cambio, misma revisión de
  género. Nota agregada en la fila `period` del glosario (Parte 1 de
  `SCREENS-front.md`) documentando el cambio y su razón. `TASK-front.md` §6.4
  tenía literalmente `"Periodo", no "Periodo"` después del reemplazo ciego —
  era `"Quincena", no "Periodo"` (la regla vieja, recomendando el término que
  ahora se abandona); corregido a `"Periodo", no "Quincena"`.
- `API-CONTRACT.md` y `ARCHITECTURE-front.md` **no se tocaron** — son
  solo lectura. Su prosa sigue diciendo "quincena" en varios lugares (es
  ilustrativa, no normativa: el propio §17 delega el mapeo al frontend).

**Excepción de test autorizada por el humano:** `tests/i18n.test.ts`
(`GLOSSARY_TERMS`) traía `'Quincena'` hardcodeado como el término que debe
vivir dentro de `es.ts`. Cambiarlo a `'Periodo'` sin tocar el test lo dejaba
en rojo (1/207) — no porque el mecanismo del test esté mal, sino porque el
dato que refleja (el glosario vigente) cambió. Autorizado explícitamente,
mismo patrón que el símbolo de USD y el bug de mock-storage: se cambió solo
la entrada de la lista, no la lógica de la suite. 207/207 en verde después.

### 2. 🔴 Cuenta archivada seguía apareciendo en `/cuentas` — diagnosticado, no lo que se sospechaba

Ninguna de las dos hipótesis del reporte era la causa real:
- **No faltaba invalidar.** `useArchiveAccount` ya invalida `qk.account(id)` +
  `invalidationFor('archiveAccount')` (`accounts`, `dashboard`) — matching por
  prefijo cubre `qk.accounts({})` correctamente.
- **`GET /accounts` no pasaba `includeArchived=true`.** `useAccounts({})` y
  `listAccounts({})` arman el query string desde un objeto vacío —
  `buildQueryString({})` devuelve `''`. La petición confía en el default del
  servidor, tal como se documentó.

**Causa real (la más probable, dado que el código de invalidación es
correcto):** no había ningún enlace de vuelta a `/cuentas` desde el detalle —
la única forma de "regresar" era el botón atrás del navegador. Next.js 15
(`staleTimes.dynamic: 0` por default, sin overrides en `next.config.ts`) no
cachea rutas dinámicas en navegación hacia adelante, pero la navegación
atrás/adelante del navegador sí puede restaurar la Router Cache del segmento
para dar sensación de instantaneidad — sirviendo el RSC prefetch de
`/cuentas` capturado **antes** de archivar. La invalidación de TanStack Query
en el cliente es correcta; lo que se veía servido era el árbol de Server
Components de una visita anterior.

**Arreglo:** `AccountDetailView.tsx` ahora tiene un enlace real "Volver a
cuentas" (que no existía — el archivo no tenía ningún `Link`), forzando
navegación hacia adelante en vez de depender del botón atrás. Además,
`router.refresh()` en el `onSuccess` de archivar, para que la propia pantalla
de detalle no se quede con datos viejos si el usuario se queda ahí.

### 3. 🟠 Detalle de cuenta sin punto de entrada visible

El detalle sí existe (`/cuentas/[accountId]`, construido en U20) y las filas
de `CuentasView` ya eran `<Link>` — pero el `<Link>` envolvía una fila sin
ninguna señal visual de que fuera interactiva (mismo estilo que una fila
estática). Agregado: `hover:bg-muted-background` y un `›` al final de cada
fila, junto al saldo.

**Hallazgo adicional, confirmado con el humano:** hasta este punto no existía
**ningún** enlace dentro de la app hacia `/cuentas` (grep de `href="/cuentas"`
en `src/`: cero resultados) — la única forma de llegar era escribiendo la URL
a mano, que es como yo la probé en los boot-checks. `/mas` (placeholder de
U23) ahora tiene un enlace temporal a "Cuentas", con comentario explicando
que U23 lo reemplaza por el menú completo. No se tocó nada más del
placeholder — sigue pendiente para U23 tal cual estaba.

## 2026-08-23 — Sesión de implementación (U21 — `/quincenas` y el cierre)

Los seis en verde (207/207, sin tocar tests). `/quincenas` (lista, cronológica,
solo la más antigua vencida ofrece "Cerrar" — reusa `selectClosablePeriod`, ya
existente desde el banner de U18) y `/quincenas/[periodId]/cerrar` (alimentada por
`GET .../close-preview`, que no escribe nada).

**Renombre por fuga de glosario, mismo patrón que `SobresView` → `EnvelopesView`:**
`QuincenasView`/`QuincenasPage`/`CerrarQuincenaView`/`CerrarQuincenaPage` contenían
"Quincena" como substring del identificador — el grep de los 7 términos lo detectó
antes de correr los gates. Renombrados a `PeriodsView`/`PeriodsPage`/
`ClosePeriodView`/`ClosePeriodPage` (archivos incluidos, porque la ruta de import
también cuenta como contenido). Se agregó `es.closeAction` (textos de `action`
partidos en `before`/`after` alrededor de un `<Money>`, para no interpolar el monto
como string) y `es.periodStatus` al único traductor.

**Nuevo componente genérico:** `components/ui/ConfirmDialog.tsx` — no existía
ningún patrón de confirmación en el proyecto (archivar cuenta ejecuta directo con
manejo de error después, no antes). Lo usan: borrar una quincena con transacciones
en su rango, y borrar una asignación de captura tardía. `message` es `ReactNode`,
no `string` — el segundo caso necesita un enlace a `/movimientos/[transactionId]`
dentro del propio diálogo.

**`NEXT_PERIOD_REQUIRED` y el hueco de invalidación de `createPeriod`:**
`invalidationFor('createPeriod')` (matriz de U10) invalida `periods`, `dashboard`,
`unassigned-funds` y `qk.openPeriods()`, pero **no** `close-preview` —
correctamente, según `tests/invalidation.test.ts`, que fija esas categorías
exactas y es intocable. Crear la quincena siguiente inline en la pantalla de
cierre no revalida sola el `close-preview` que acaba de dejar de estar
bloqueado por ese blocker. Solución: la propia vista invalida
`qk.closePreview(periodId)` a mano en el `onCreated` del formulario, fuera de la
matriz — no es un hueco de la matriz, es una invalidación de pantalla específica
que la matriz nunca pretendió cubrir (no toca ningún `MutationName`).

**Decisión de alcance, no implementada — confirmada por el humano (2026-08-24):**
`PATCH /periods/{id}` (editar fechas) está en el listado de endpoints de
`/periodos` en `SCREENS-front.md`, y `MutationName` ya trae `editPeriod` desde
U10, pero ningún dado/cuando/entonces de U21 lo pide. Razón, tal como la dio el
humano: mover el rango de un periodo cambia qué transacciones le pertenecen, lo
cual cambia `spentCents`/`availableCents` de cada sobre — y si el periodo ya se
cerró, el rollover que ya se materializó queda sin correspondencia. La API
bloquea esto en periodos cerrados (`409 PERIOD_CLOSED`), pero en uno abierto lo
permite, y el efecto sigue siendo real: no es como renombrar una cuenta. No hay
UI para editar fechas todavía. `editPeriod` sigue sin consumidor. Si se retoma,
va como pieza propia, con su propio aviso de consecuencias — no como un campo
más en un formulario de edición.

**Borrar un periodo con transacciones en su rango:** se resuelve con un chequeo
puntual (`GET /transactions?from=&to=&limit=1`, vía `bffFetch` directo dentro del
handler del botón, mismo patrón ya usado en `EnvelopesView.tsx` para las
categorías sugeridas) antes de abrir el `ConfirmDialog` — no hay hook dedicado
porque es una comprobación de un solo uso, no un estado que valga la pena cachear.

## 2026-08-17 — Sesión de implementación (U20 — `/cuentas` y `/cuentas/[accountId]`)

Los seis en verde (207/207, sin tocar tests). Lista de cuentas reales (`GET
/accounts`, ya acotado a `cash`/`credit`/`receivable` desde el servidor — sin el
riesgo de `insights` que causó el bug de "Cuentas" en Inicio) + creación inline.

**El detalle absorbe "Capturar saldo inicial"**, como se decidió al corregir
`SCREENS-front.md`: la condición de "cuenta nueva sin saldo" usa el ledger, no solo
`balanceCents === "0"` — las dos se ven idénticas por el monto y son cosas opuestas.
El formulario de captura reusa `useDraft` con la intención `opening-balance:<id>`,
mismo patrón de idempotencia que el resto de `/capturar/*`.

**Archivar** muestra el mensaje de `409 ACCOUNT_NOT_EMPTY` vía `errorMessageFor` — ya
estaba en el catálogo de U6, ningún mensaje especial hizo falta, mismo patrón que
`CATEGORY_HAS_ALLOCATIONS` en U17.

**Mismo hueco de invalidación que `updateCategory` (U17), mismo arreglo:**
`useUpdateAccount` reusa `invalidationFor('createAccount')` en vez de un
`MutationName` nuevo — ARCHITECTURE §5.2 tampoco tiene fila para "editar cuenta", y
extender el tipo rompe el typecheck de `invalidation.test.ts` por la misma razón ya
documentada (su fixture está tipado `Record<MutationName, string[]>`, exhaustivo).

## PENDIENTE — fase posterior de revisión de lenguaje y jerarquía (no implementar todavía)

Confirmado en pantalla por el humano (2026-08-17): el bug de "Cuentas" quedó resuelto
(solo aparece "Cuenta de nu") y el punto 2 ("total doblado") se resolvió solo — el
$70,000 era correcto, no había doble conteo. Pero revisar ese número destapó un
problema de diseño real, distinto de un bug: **queda anotado aquí a propósito, sin
tocar código, para cuando el humano decida abrir esa fase.**

### El problema, tal como lo planteó el humano

`unassignedCents` negativo en Inicio ("Por asignar") suma dos cosas de naturaleza
distinta:
1. **Dinero que le debo al banco** (deuda real de una tarjeta de crédito) — se
   resuelve pagando.
2. **Déficit de sobres sin presupuesto** (hueco que se cubre asignando) — se resuelve
   repartiendo dinero, no pagando nada.

Son dos acciones diferentes sobre el mismo número. Presentarlas juntas obliga al
usuario a entender contabilidad para interpretar la pantalla — y el estándar de esta
app es que alguien sin conocimientos técnicos ni financieros pueda moverse sola. Ese
número, tal como está, no lo cumple.

### Dirección para cuando llegue el momento (no es la implementación, es la brújula)

- En Inicio, "Por asignar" muestra **solo dinero real disponible** y **nunca baja de
  cero**.
- El déficit de sobres se presenta **aparte**, como "Necesitas cubrir $X", con la
  lista de sobres en sobregiro y su acción (cubrir / asignar).
- La deuda de tarjeta se queda donde ya está: en el saldo de la cuenta `credit`. No
  se mueve a ningún lado nuevo.

### Alcance de esa fase futura — no es solo este número

El humano fue explícito en que esta revisión no se limita a "Por asignar". Otros tres
puntos ya construidos están **técnicamente correctos** pero "suenan a contabilidad" y
deberían revisarse con el mismo criterio cuando llegue esa fase:

1. El sobregiro por captura tardía (la explicación "Es un gasto de la quincena
   pasada, ya cerrada. Se cubre con esta." en `CategoryCard.tsx`).
2. El aviso de quincena vencida (`OverduePeriodBanner.tsx`).
3. El mensaje de `budgetImpact: "compensated"` (`BudgetImpactMessage.tsx`).

Ninguno de los tres se toca ahora — quedan correctos contra lo que TASK-front.md y
SCREENS-front.md piden hoy. Esto es una nota para una revisión de lenguaje y
jerarquía posterior, con su propio criterio de aceptación, no una corrección
pendiente de este momento.

## 2026-08-17 — Revisión manual U16–U19: un fix de discoverabilidad, dos verificaciones

El humano probó la app a mano contra la API local y reportó 6 puntos. El bug de
"Cuentas" (punto 1) ya estaba corregido de la vuelta anterior — el reporte lo incluía
de todos modos como parte de una revisión más completa. Repaso de cada punto:

**1. "Cuentas" mostrando sobres** — ya arreglado (ver la entrada anterior). Confirmé
de nuevo que `AccountsBlock` filtra con `isRealAccountKind` antes de listar.

**2. Total que se ve doblado ($35,000 capturados, $70,000 en pantalla) — verificado,
no asumido.** Grep de `.reduce(`, sumas con `BigInt` y cualquier consumo de
`dashboard.accounts` en todo `src/`: no existe **ningún** cálculo que sume montos de
`dashboard.accounts` o `dashboard.categories` en el frontend. Cada número en pantalla
sale directo de un valor propio de la API (`unassignedCents`) o del `balanceCents` /
`availableCents` de un solo recurso vía `formatBalance`/`Money` — nunca combinados.
Un bug de suma queda descartado por revisión de código, no por creencia. La
explicación más probable es la misma del punto 1: antes del fix, "Cuentas" mostraba
la cuenta real y el sobre "Comida" como dos líneas separadas del mismo evento, y a
simple vista eso puede leerse como "el total se duplicó" sin que ningún código
sumara nada. Vale la pena que el humano confirme el punto 2 en un reintento, ahora
que el filtro está aplicado.

**3 y 4.** Confirmados por el humano, sin acción — el aviso de quincena cerrada y el
mensaje de `compensated` funcionan como se documentó.

**5. "Pago de tarjeta" no se encontraba — corregido.** Existía funcionalmente (mismo
formulario que Transferencia, origen `cash` destino `credit`) pero sin ninguna
etiqueta que lo hiciera descubrible — exactamente el problema que API-CONTRACT.md
§11.3 advierte como "el error más común del dominio". `SimpleTransactionForm` ahora
acepta un `title` que puede ser función del estado actual; `/capturar/transferencia`
lo usa para mostrar "Pago de tarjeta" en cuanto la cuenta destino elegida es
`credit`, y "Transferencia" en cualquier otro caso. De paso, ninguno de los 6
formularios de captura tenía encabezado — se agregó a los 6 (los 5 simples con
`es.intent.*`, gasto con `es.intent.expense`) mientras estaba ahí, no antes.

**Confirmación de que llama a `/transfers` y no a `/expenses`:** no puedo abrir la
pestaña Network (sin navegador), pero sí puedo trazarlo por código de forma
determinista: `intent="transfers"` → `useCreateTransaction('transfers')` →
`BFF_DEDICATED_ROUTES.transfers` = `/tx/transfers` → `forward.ts` reenvía a
`/transactions/transfers` en la API real. Nunca toca `/expenses` en ningún punto de
esa cadena.

**6. Idempotencia real (apagar wifi a la mitad) —** pendiente de que el humano la
pruebe; nada que verificar de mi lado todavía.

### Tests pendientes acumulados — consolidado, para que no se pierdan

Ninguno de estos lo escribe el implementador; quedan para una sesión de tests:

| Función / archivo | Por qué falta | Desde |
|---|---|---|
| `bff-routes.test.ts` (archivo nuevo) | Verificaría que cada uno de los 9 handlers dedicados existe en disco y que su ruta del contrato no está en `ALLOWLIST` — nada lo prueba hoy | Bug de `opening-balances` 404 |
| `isDateInClosedPeriod` (`lib/domain/dates.ts`) | Nombrada en ARCHITECTURE §8, nunca fijada en TASK §6.1 hasta ahora | U18 |
| `isRealAccountKind` (`lib/domain/accounts.ts`) | Lógica de filtrado que nació inline en un componente, sin test posible sin renderizar | Bug de "Cuentas" mostrando sobres |

## 2026-08-17 — Bug reportado por el humano: "Cuentas" en Inicio mostraba sobres

Confirmado con SQL por el humano: con una sola cuenta real ("Cuenta de nu"), el
bloque "Cuentas" de Inicio también listaba "Ahorro" y "Comida" — sobres, no cuentas.

**Causa:** `GET /insights/dashboard` y `GET /insights/account-balances` devuelven
`accounts` con **todos** los kinds mezclados — cash, credit, receivable, category e
income_source juntos en el mismo arreglo (API-CONTRACT.md §14 lo dice explícito:
`fn_account_balances` solo filtra `is_system`). Filtrar a cuentas reales para una
sección específica es responsabilidad del frontend, y `AccountsBlock` en
`InicioView.tsx` no lo hacía — pintaba `dashboard.accounts` completo, sin filtro.

**Revisé el resto de consumidores, no solo el que reportaste:** grep de
`InsightAccountBalance` / `dashboard.accounts` / `getAccountBalances` en todo `src/`.
`InicioView.tsx` era el único lugar que de verdad renderizaba ese arreglo — los otros
dos resultados eran la definición del tipo y el servicio, no consumidores. **U20
(`/cuentas`, todavía sin construir) no va a heredar este bug**: SCREENS-front.md lo
especifica contra `GET /accounts`, que es un endpoint distinto y ya viene
correctamente acotado a `cash`/`credit`/`receivable` desde el contrato (§9) — nunca
mezcla sobres ni fuentes de ingreso. El riesgo era específico de los endpoints de
`insights`, no genérico de "cualquier lista de cuentas".

**Arreglo:** `lib/domain/accounts.ts` nuevo, con `isRealAccountKind` — un predicado
puro, agregado a `TASK-front.md` §6.1 como forma fijada (mismo patrón que
`isDateInClosedPeriod` de U18). **Sin test propio todavía — pendiente para una sesión
de tests**, no lo escribo yo.

### ¿Faltaba un test que lo detectara?

Sí, en el mismo sentido que el hueco de U18: la lógica de filtrado vivía inline
dentro de un componente, y "cero tests de render" significa que nada iba a ejercitar
ese componente para atraparlo. La diferencia con `isDateInClosedPeriod` es que ahí la
falta de test era una omisión heredada (la función ya estaba nombrada en
ARCHITECTURE, solo nunca se fijó); aquí la lógica ni siquiera existía como función
aparte — nació como un `.map()` sin filtro, directo en el JSX. Extraerla a
`isRealAccountKind` es lo que la vuelve testeable sin renderizar nada: una vez que
exista el test, cualquier regresión futura (otro bloque que vuelva a olvidar el
filtro) se atrapa ahí, no visitando la pantalla a mano.

## 2026-08-17 — Documentos corregidos por decisión del humano (previo a U19)

Confirmada la hipótesis de la sesión anterior sobre "Saldo inicial": **razón de
fondo, no solo consistencia entre documentos** — un saldo inicial siempre es sobre
una cuenta concreta ("¿cuánto hay en esta cuenta hoy?"), nunca una intención suelta
como un gasto o una transferencia. Vivir en el selector obligaría a elegir la cuenta
desde cero; vivir en el detalle ya la da por contexto. Misma lógica que la decisión
de onboarding (ARCHITECTURE-front.md, tabla de decisiones: "Saldos iniciales por
cuenta, no en el onboarding").

- `SCREENS-front.md`: `/capturar/otro` corregida a 5 destinos (era 6, con "Saldo
  inicial" que nunca tuvo ruta ni en su propia tabla ni en ARCHITECTURE §2). Nota de
  corrección con el porqué, y una nota simétrica en `/cuentas` señalando que ese es
  el único punto de entrada real a `POST /transactions/opening-balances` fuera del
  onboarding.
- `TASK-front.md` §6.1: `isDateInClosedPeriod` agregada como forma fijada (antes solo
  vivía en el código, extraída pero no documentada donde el implementador —o una
  sesión de tests futura— la busca).

## 2026-08-17 — Sesión de implementación (U19 — `/movimientos` y `/movimientos/[transactionId]`)

Los seis en verde (207/207, sin tocar tests). Lista con cursor vía `useInfiniteQuery`
— el cursor vive solo en `pageParam`, nunca en la query key ni en almacenamiento.
Ambas mitades de una corrección visibles siempre, sin filtro para ocultarlas: la
original tachada con "Corregida", la reversa con "Corrección". Reversal sin
`bookedAt` nunca — hereda la fecha del original, que es lo que neutraliza el ajuste
de una captura tardía sin dejarlo huérfano.

**Otro hueco real en `qk` (ARCHITECTURE §5.1), mismo patrón que `updateCategory`
pero sin el problema de tipo esta vez:** `GET /insights/unbudgeted-transactions` es
un endpoint propio del contrato (§14) que nunca tuvo query key asignada — Inicio lo
resolvía gratis porque venía incluido en `GET /insights/dashboard`, pero Movimientos
no llama al dashboard. Agregada `qk.unbudgetedTransactions()`. Verifiqué primero que
`query-keys.test.ts` e `invalidation.test.ts` no tipan `qk` de forma exhaustiva en
ningún lado (a diferencia de `MutationName`, que si lo rompe) — sin eso confirmado no
lo hubiera tocado sin preguntar.

**Bug de tipos encontrado al usar `qk.transactions()` con una interfaz nombrada:**
mismo patrón que ya había resuelto en `buildQueryString` (U11) — pasar una interfaz
con propiedades opcionales (`TransactionFilters`) a un parámetro tipado
`Record<string, unknown>` choca con TypeScript por la falta de firma de índice,
aunque un objeto literal en el mismo lugar compile bien. Cambié `accounts`,
`transactions` y `recurringTemplates` en `query-keys.ts` de `Record<string,
unknown>` a `object` — no afecta a `query-keys.test.ts`, que solo pasa literales.

**Traducción de `movements` a lenguaje de usuario:** sin ejemplos para cada
combinación de `kind`/signo en los documentos, así que diseñé una plantilla
razonable por `accountKind` ("Salió de X" / "Entró a X" para cash/credit, "Se cargó
a X" / "Se liberó de X" para sobres, "X te debe" / "X te pagó" para receivable,
"Vino de X" para fuentes de ingreso) en vez de replicar literal los tres ejemplos de
SCREENS-front.md, que no cubren todos los casos. Simplificación anotada, no
inventada en silencio.

## 2026-08-17 — Sesión de implementación (U18 — `/capturar/*`, la unidad crítica)

Los seis en verde (207/207, sin tocar tests). `TASK-front.md` corregido: la mención a
`expense-form.test.ts` (que nunca existió — no está en §5.2, no en `EXPECTED.json`, no
en el repo) se quitó con nota de por qué, confirmado con el humano antes de tocar el
documento.

### Función pura extraída, pendiente de test — como se pidió, sin escribirlo

`isDateInClosedPeriod` en `lib/domain/dates.ts`: ya estaba nombrada en el árbol
original de ARCHITECTURE-front.md §8 pero nunca se fijó en TASK-front.md §6.1, así que
la sesión de tests nunca le escribió test. La extraje para que `/capturar/gasto` avise
ANTES de guardar si la fecha cae en una quincena cerrada, en vez de enterrar esa
lógica dentro del componente. **Sin test propio — pendiente para una sesión de tests.**
El otro candidato que se discutió (el cálculo del split) no se extrajo aparte: el
formulario ya usa `splitEvenly` (U2, con test) directo, no reimplementa nada.

### Lo construido

- `features/capture/hooks/useDraft.ts` — primera vez que las funciones puras de
  `draft-store.ts` (U12) se conectan a `sessionStorage` real. Con `useState`/
  `useEffect` en vez de Zustand + `persist`, que es lo que sugiere el comentario del
  propio archivo: ningún formulario necesita que otro componente reaccione al mismo
  borrador todavía, así que Zustand no añade nada que este hook no resuelva ya, y
  evita instalar una dependencia nueva sin que cambie el comportamiento que
  `draft-store.test.ts` prueba (las funciones puras, no el hook). Desviación
  documentada, no enterrada.
- `/capturar/gasto` completo: fecha por default de `todayInTimeZone(timezone de /me)`,
  aviso antes de guardar si cae en quincena cerrada, reparto entre sobres con
  `splitEvenly` editable, parte prestada opcional, `budgetImpact` solo tras la
  respuesta (nunca optimista), "Pago de tarjeta" nunca llama a `/expenses` (el
  atajo vive en `/capturar/transferencia`, nunca aquí).
- `features/transactions/components/SimpleTransactionForm.tsx` — las 5 intenciones
  restantes (ingreso, transferencia, préstamo, cobro, pérdida) comparten la misma
  forma: monto, fecha, descripción, dos selectores. Justificado por duplicación real
  y presente, no hipotética — las 5 páginas solo configuran labels/opciones/
  `buildBody`.
- `/capturar/otro` — selector de intenciones.

### Contradicción entre SCREENS y ARCHITECTURE, encontrada al construir el selector

SCREENS-front.md dice que `/capturar/otro` tiene **6** destinos: "Ingreso ·
Transferencia · Préstamo · Cobro · Dar por perdido · **Saldo inicial**" — pero su
propia tabla de rutas justo abajo solo documenta 5 (nunca le da una ruta a "Saldo
inicial"), y el árbol de rutas de ARCHITECTURE-front.md §2 tampoco reserva ninguna:
lista exactamente `gasto, otro, ingreso, transferencia, prestamo, cobro, perdida` — 7
carpetas, ninguna para saldo inicial.

Construí el selector con los 5 que sí tienen ruta asignada en ambos documentos.
**No inventé una ruta nueva** — ARCHITECTURE es la fuente de mayor autoridad para
estructura de archivos (TASK-front.md §6.3: "las de ARCHITECTURE-front.md §2,
literales") y su árbol simplemente no la incluye.

Hipótesis de por qué la mención de SCREENS no es un hueco real: la propia
SCREENS-front.md, en la tabla de `/cuentas`, ya asigna la acción "Capturar saldo
inicial" al estado vacío de una cuenta sin saldo — es decir, el punto de entrada
real para un saldo inicial capturado después del onboarding parece ser el detalle de
cuenta (U20), no un formulario aparte en `/capturar/otro`. Si es así, la mención en el
selector de seis es un residuo, igual que "Últimos movimientos" en Inicio. **No lo
decidí solo** — queda para cuando el humano lo confirme, análogo al caso de U16.

## Recordatorio para U21

El humano revisó `/` y `/sobres` a mano: funcionan. Encontró que sin `/quincenas`
todavía no hay forma de crear la primera quincena desde la app (lo hizo por curl para
poder probar) — no es un bug de esta unidad, es la consecuencia esperada de construir
en el orden del grafo. Los links "Crear quincena" en `InicioView.tsx` y
`EnvelopesView.tsx` ya apuntan a `/quincenas` (`href="/quincenas"`), así que no
necesitan ningún cambio de código cuando esa ruta exista — **pero verificar
explícitamente al terminar U21** que esos dos links quedan funcionales de verdad (el
usuario puede completar el flujo de crear una quincena desde ahí), no solo que la
ruta responde con algo. Ahora mismo son botones muertos con el mensaje correcto.

## 2026-08-17 — Sesión de implementación (U17 — `/sobres` y `/sobres/[categoryId]`)

Los seis en verde (207/207, sin tocar tests). `PUT .../allocations/{categoryId}`
optimista (ARCHITECTURE §5.3), reusando `deriveEnvelopeStatus` (U4) para calcular el
estado previsto antes de que responda el servidor, con rollback en `onError`. Cubrir
sobregiro vía `POST .../allocations/move`, ofreciendo como origen los sobres del mismo
periodo con `availableCents > 0` ordenados descendente. El detalle de sobre trae
`PATCH` (nombre, `rolloverType`) y archivar, con el mensaje de `409
CATEGORY_HAS_ALLOCATIONS` saliendo de `errorMessageFor` — ya estaba en el catálogo de
U6, no hizo falta un mensaje especial aparte.

### Bug real encontrado a mitad de construcción: `GET /categories/{id}` no existe

Al construir el detalle de sobre me di cuenta de que estaba a punto de usar
`GET /categories/{id}` — y ese endpoint **no está en el contrato**. Lo verifiqué con
grep directo sobre `API-CONTRACT.md`: solo existen `GET /categories` (lista),
`PATCH`, `archive`/`unarchive` y `GET .../ledger`. Confirmé que `/accounts/{id}` e
`/income-sources/{id}` sí están documentados — el hueco era exclusivo de categories,
no un patrón repetido.

Este endpoint inventado ya llevaba dos unidades viviendo sin que nadie lo ejerciera:
`ALLOWLIST` lo traía desde U9, y `features/envelopes/services/categories.ts` tenía un
`getCategory(id)` desde U11 — ninguno de los dos tiene test que lo cubra
(`ALLOWLIST` nunca tuvo test de completitud, ver la sesión del bug de
opening-balances), así que nada lo iba a atrapar hasta que alguien intentara usarlo de
verdad. Corregido: se quitó de `ALLOWLIST` y de los servicios; el detalle de sobre
ahora pide `GET /categories?periodId=<actual>` (la misma lista que ya usa `/sobres`) y
busca el id ahí — que además resuelve de paso un problema que iba a tener de todas
formas: `GET /categories/{id}` sin `periodId` habría devuelto `period: null` siempre,
y el detalle necesita `hasBudget` con alcance de periodo para distinguir sus dos
vacíos ("nada gastado" vs. "nunca usado").

### Otro caso de fuga de glosario — esta vez desde un identificador, no un string

`i18n.test.ts` volvió a fallar, ahora con una variante que no había visto: el
componente `SobresView` y la página que lo importaba (`import { SobresView } from
'./SobresView'`) contenían "Sobre" como **substring de un nombre de archivo/símbolo**,
no de un texto visible. El grep del test no distingue identificadores de strings de
usuario — cualquier ocurrencia de la palabra en el código fuente cuenta. Renombrado a
`EnvelopesView` (el nombre en inglés, consistente con la carpeta `features/envelopes/`
que ya existía). También aparecieron dos fugas más de texto real: un comentario
citando "Disponible" casi textual de SCREENS-front.md, y un `"Sin presupuesto"`
escrito a mano en vez de `es.envelopeStatus.no_budget`. Los cuatro corregidos; los
seis en verde después.

**Patrón para lo que sigue:** cualquier componente/página cuyo nombre en español
contenga un término del glosario (Sobres, Quincenas, etc.) necesita un identificador
en inglés — no solo el texto visible. `EnvelopesView`, no `SobresView`; el nombre de
ruta (`app/(app)/sobres/`) sí puede quedarse en español porque las rutas no se leen
como contenido de archivo por el test, solo lo que hay dentro de cada archivo.

## 2026-08-16 — Sesión de implementación (U16 — `/` Inicio)

Los seis en verde (207/207, sin tocar tests). `app/(app)/page.tsx` pasó de placeholder
a Server Component real: precarga con `serverApi.getDashboard()`
(ARCHITECTURE-front.md §5, la misma llamada que el ejemplo del documento) e hidrata
`InicioView`, que vive de `useDashboard()` en el cliente para cuando una mutación
invalide `qk.dashboard(...)` más adelante.

**Los 3 bloques implementados, en el orden de SCREENS-front.md:** Por asignar (con
las 3 variantes — sobregiro en rojo, "Todo repartido" en éxito, "Aún no repartes
nada" en pendiente, distinguidas por el conteo de `hasBudget`, nunca por el monto,
como exige TASK-front.md U16) · Sobres de la quincena (con sus propios vacíos: sin
quincena, ninguno presupuestado, sin gastos) · Cuentas. Más el banner de movimientos
sin quincena (solo aquí y en Movimientos cuando exista, por diseño de U14).

**Un bloque que SCREENS lista pero no construí: "Últimos movimientos".** Implementarlo
de verdad pediría `GET /transactions?limit=N` — una segunda llamada, que choca
directo con el criterio de aceptación explícito de U16 ("usa una sola llamada a GET
/insights/dashboard"). El endpoint del dashboard no trae transacciones.

**Decisión del humano (2026-08-16), no solo anotada — resuelta:** el bloque se queda
fuera, permanentemente, no como omisión temporal. Razones: el dashboard existe para
resolver la pantalla principal en un solo round-trip, que importa en un arranque en
frío de Vercel; y el historial completo ya vive en su propia tab, a un tap de
distancia — un bloque de "últimos movimientos" en Inicio duplicaría información por
el costo de una llamada extra en la pantalla que más se abre. **Acción pendiente para
cuando llegue U19:** corregir SCREENS-front.md para quitar ese bloque de la lista de
Inicio, con nota de por qué — no dejar la contradicción entre lo que SCREENS pide y lo
que U16 prohíbe para que alguien la "resuelva" mal después. SCREENS-front.md no está
en la lista de solo-lectura de CLAUDE.md (esa es API-CONTRACT.md y
ARCHITECTURE-front.md únicamente), así que ese ajuste es válido cuando llegue el
momento.

**Componente nuevo fuera de `components/ui`:** `EnvelopeStatusBadge`
(`features/envelopes/components/`), no el `Badge` genérico — ese no conoce los cuatro
tonos de sobre y no tenía forma de aceptar un className externo sin tocarlo (y tocar
componentes seguía sin ser el objetivo de esta vuelta). Reusa el patrón de contraste ya
verificado en la sesión de la paleta: color de estado como texto, sobre un tinte muy
claro del mismo tono — no un fill sólido, que habría necesitado un segundo tono por
estado solo para el contraste.

No probé visualmente. Sí confirmé que "/" sin sesión sigue redirigiendo a `/login`
limpio (curl + log del servidor), que es todo lo que se puede verificar sin
credenciales reales y sin Playwright.

## 2026-08-16 — Cambio a U15, posterior a su construcción: onboarding resumible

**No es un bug nuevo — es el rediseño que salió de investigar el bug anterior.**
Probando `/empezar` a mano, el humano encontró una cuenta huérfana ("Cajitas de NU")
creada justo cuando `opening-balances` falló por el bug del BFF de antes. La causa
raíz de fondo: el onboarding hace 4 llamadas independientes sin ninguna transacción
real detrás — si cualquiera falla después de crear la cuenta (un bug, o simplemente
red intermitente en el celular, sin bug de por medio), el usuario queda con cuenta
pero sin sobres, **y el guard ya no lo regresa a `/empezar`** porque su única señal es
"cero cuentas cash" (API-CONTRACT.md §15.3 — no hay flag de onboarding, y no me toca
inventar uno).

### Tres caminos evaluados, decisión: hacer `/empezar` idempotente + puerta manual en Más

1. **Señal de "incompleto" más rica que "cero cuentas"** — descartada. El formulario
   deja los 7 sobres y "Sueldo" opcionales; un usuario que los desmarcó todos a
   propósito termina con la misma foto de datos que uno que quedó a medias. Sin un
   flag real en el contrato, esas dos situaciones son indistinguibles — inventar una
   señal más rica solo cambia CUÁL caso se clasifica mal, no elimina la ambigüedad.
2. **Formulario reanudable guardando valores en `sessionStorage`** (como el borrador
   de U12) — insuficiente por sí solo: el problema no es que se pierdan los valores
   que el usuario escribió, es que reintentar la creación de la cuenta con el mismo
   nombre choca con `409 DUPLICATE_ACCOUNT_NAME`. Recordar el nombre no evita
   recrearlo.
3. **Puerta manual de vuelta a `/empezar`** — necesaria pero no suficiente sola: sin
   arreglar el punto 2, solo relocaliza el mismo choque una pantalla después.

**Implementado: idempotencia por consulta de estado real (una versión del punto 2,
pero contra el servidor, no `sessionStorage`) + la puerta del punto 3.**
`app/empezar/page.tsx` pasó de un `page.tsx` de una línea a un Server Component que
consulta qué ya existe antes de pintar el formulario: `GET /accounts?kind=cash`, el
ledger de esa cuenta si existe, `GET /categories`, `GET /income-sources`. El
formulario (`OnboardingForm.tsx`) recibe ese estado como props y solo pide lo que
falta — cada paso se vuelve "crear si falta", no "crear siempre".

**Las dos precisiones que pidió el humano, con su decisión:**

- **La cuenta se empareja por existencia, nunca por nombre.** Si ya hay una cuenta
  `cash`, es esa — el campo de nombre en pantalla se vuelve de solo lectura, mostrando
  la que ya existe, y el formulario **nunca** intenta crear una segunda aunque el
  usuario escriba algo distinto. Emparejar por nombre sería frágil porque el nombre lo
  escribe el usuario y puede variar entre intentos; emparejar por "¿existe alguna?" es
  la misma señal que ya usa el guard, así que no hay una segunda regla que pueda
  desalinearse de la primera.
- **El saldo inicial se decide por el ledger de la cuenta, no por `balanceCents`.**
  Una cuenta con saldo cero real y una que nunca capturó saldo se ven idénticas por el
  monto — es exactamente la distinción que SCREENS-front.md ya traza para `/cuentas`
  ("Cuenta nueva sin saldo" vs. "Saldo cero real"), reusada aquí en vez de inventar una
  regla nueva. `getAccountLedger(id, { limit: 1 })`: si trae algo, el paso de saldo se
  salta por completo.
- **Los sobres y "Sueldo" sí se emparejan por nombre**, y ahí no es frágil: son las
  constantes fijas de `SUGGESTED_CATEGORIES`/`SUGGESTED_INCOME_SOURCE`, no texto libre
  del usuario — no hay ambigüedad posible entre intentos.

**La puerta manual:** un link "Terminar configuración inicial" en el `/mas` mínimo
(junto al botón de cerrar sesión de la entrada anterior). No necesitó tocar el guard
de `(app)/layout.tsx` — sigue exactamente como lo pide el contrato — porque
`/empezar` ahora es seguro de revisitar en cualquier estado.

Los seis en verde. No probé visualmente (seguimos sin Playwright); sí verifiqué con
`build` que compila y con lectura de código que la secuencia condicional es correcta.

## 2026-08-16 — Bug reportado por el humano: opening-balances 404 en /empezar

El humano probó `/empezar` a mano y encontró que el envío truena: `POST
/api/bff/transactions/opening-balances` → `404 ROUTE_NOT_FOUND`.

**Diagnóstico** (los tres casos que pidió descartar, en orden):
1. ¿Falta el handler? No — los 9 `route.ts` dedicados existen en las rutas correctas
   (`tx/expenses`, `tx/incomes`, ..., `tx/opening-balances`, `tx/[id]/reversal`,
   `recurring/[id]/confirm`), verificado con `find`.
2. ¿Falta en el allowlist? No — y no debería estar: los 9 endpoints idempotentes se
   excluyen del catch-all a propósito (ARCHITECTURE §4.3), verificado con `grep`.
3. **¿La petición cae en el catch-all? Sí, y es la causa real.** `OnboardingForm.tsx`
   llamaba `bffFetch({ path: '/transactions/opening-balances' })` — la ruta del
   **contrato**, no la del BFF. El handler dedicado vive en
   `/api/bff/tx/opening-balances` (prefijo `tx/`, no `transactions/`). Al no coincidir
   ninguna ruta específica, Next.js la resuelve contra el catch-all, que revisa el
   allowlist, no la encuentra (correctamente — esa ruta no debe ser alcanzable ahí), y
   devuelve 404.

**Alcance del bug:** revisé los 9 endpoints. Ningún otro código de navegador llama a
ninguno de los otros 8 todavía (`bffFetch` solo se usa en `OnboardingForm.tsx` y
`useOpenPeriods.ts`; los servicios de U11 que sí usan las rutas del contrato
`/transactions/...` llaman `apiRequest`, no `bffFetch` — van directo a la API real,
donde esa sí es la ruta correcta, sin pasar por el BFF). Así que hoy solo hay un bug
vivo, pero el riesgo era real y sistémico: quien construyera U18 (capturar) iba a
escribir `bffFetch({ path: '/transactions/expenses' })` por instinto — es la ruta que
está en todos los documentos — y se iba a topar con el mismo 404.

**Arreglo, en dos partes:**
1. `lib/bff/dedicated-routes.ts` — nuevo, `BFF_DEDICATED_ROUTES`: mapea cada uno de
   los 9 a su ruta real de BFF (`tx/...` / `recurring/.../confirm`), con la historia
   de este bug en el comentario para que no se repita al construir U18/U19/U22.
2. `OnboardingForm.tsx` usa `BFF_DEDICATED_ROUTES.openingBalances` en vez del string
   del contrato a mano.

**Verificado sin Playwright** (curl + log del servidor, la lección de la sesión
anterior): la ruta rota sigue dando `404 ROUTE_NOT_FOUND`; la ruta corregida
(`/api/bff/tx/opening-balances`) ahora da `401 UNAUTHORIZED` — la del handler
dedicado, no la del catch-all, prueba de que la petición ya llega adonde debe.
Probé también `/api/bff/tx/expenses` como control: mismo `401`, confirma que los
otros 8 dedicados están bien conectados. Los seis en verde después del fix.

### El test que falta — nombrado, no escrito (pedido explícito del humano)

`allowlist.test.ts` prueba el **mecanismo** de emparejamiento (`isAllowedRoute` contra
una tabla de prueba pequeña) — nunca la **completitud** de la `ALLOWLIST` real ni la
correspondencia entre las rutas que un caller debería usar y las que de verdad
existen en disco. Por diseño (documentado en la sesión donde llené `ALLOWLIST`): el
contenido real de la tabla no es una forma fijada, así que ningún test la verifica
contra el contrato.

Un archivo nuevo — algo como `bff-routes.test.ts` — cerraría el hueco si:
1. Codifica los 9 pares (ruta del contrato → ruta esperada del BFF) **a mano, desde
   API-CONTRACT.md §5 y ARCHITECTURE-front.md §4.3**, no importados de
   `dedicated-routes.ts` (si el test lee la misma constante que se rompió, no prueba
   nada — el error se replicaría en ambos lados).
2. Para cada uno, verifica que existe un `route.ts` en disco en la ruta esperada del
   BFF (análisis estático de archivos, como ya hacen `dates.test.ts` e `i18n.test.ts`
   — no hace falta levantar el servidor).
3. Verifica que la ruta del contrato correspondiente **no** aparece en `ALLOWLIST`
   (import directo del array real, no de una tabla de prueba).

Eso hubiera atrapado el bug antes de que llegara a `/empezar`: el paso 2 falla en
cuanto un handler dedicado no existe donde debería, y (si se quisiera ir más lejos)
un cuarto punto podría verificar que `BFF_DEDICATED_ROUTES` coincide con el mismo
mapeo — eso sí habría atrapado el error de esta sesión específicamente, no solo la
clase general. No lo escribo — es una decisión de la sesión de tests, no mía.

## 2026-08-16 — Sesión 5 de implementación (U15 — /empezar)

Los seis en verde (207/207, sin tocar tests). No probé visualmente — ver la corrección
de la sesión anterior sobre Playwright/e2e. Sí verifiqué que no truena: `curl` contra
`/empezar` sin sesión da `307` a `/login` (correcto — no está en las rutas públicas de
`session-policy.ts`, y no tiene por qué estarlo: onboarding es para un usuario ya
autenticado que simplemente no tiene cuentas todavía), log del servidor limpio.

**Construido:** `app/empezar/page.tsx` + `OnboardingForm.tsx`. Un solo formulario:
nombre de cuenta + saldo de hoy (`AmountInput`), los 7 sobres sugeridos con checkbox
preseleccionado, "Sueldo" preseleccionado. Al confirmar, en el orden de
API-CONTRACT.md §16.1 recortado como dice SCREENS-front.md ("no crea la primera
quincena ni asigna presupuesto"): `POST /accounts` → `POST
/transactions/opening-balances` (una sola llamada, con `Idempotency-Key`, **omitida
si el saldo es "0"** — mandarla con un único saldo en cero da `422
EMPTY_OPENING_BALANCE`, así que se salta la llamada en vez de dejarla fallar) → `POST
/categories` × sobres elegidos → `POST /income-sources` si "Sueldo" quedó marcado.

**Otra fuga de glosario, atrapada de nuevo por la propia suite:** "Sobres sugeridos"
como encabezado — mismo patrón que "Sobres" en el tab bar. Esta vez, en vez de
agregar una entrada nueva a `es.ts`, compuse el texto desde una ya existente:
`{es.kind.category}s sugeridos` en vez de un string nuevo. Como patrón para lo que
sigue: cualquier plural/variación de un término del glosario se compone desde `es.ts`
en vez de escribirse aparte — evita que la lista de entradas crezca sin necesidad.

**Simplificación consciente, no una regla de arriba:** la llave de idempotencia del
saldo inicial se genera con `crypto.randomUUID()` inline (no vía el patrón de
`draft-store` de U12). Onboarding es un flujo de una sola vez, no repetible como
capturar un gasto — si la página se recarga a la mitad de un envío fallido, se genera
una llave nueva en el reintento. Riesgo aceptado: es un caso de baja probabilidad para
un flujo de configuración inicial, y ningún test ni documento exige lo contrario.

## 2026-08-16 — Sesión 4 de implementación (U14b + dirección visual)

Dos decisiones del humano que cerraron huecos reales, no tomadas por esta sesión:

### U14b — `/login`, agregada a TASK-front.md

No existía como unidad — hueco del documento original (ver nota en la sesión
anterior). El humano decidió correo + contraseña (`signInWithPassword`), sin
registro/recuperación/verificación (se administran desde el dashboard de Supabase).
Agregada a `TASK-front.md` §3 (grafo, antes de U15) y §4 (unidad con
dado-cuando-entonces), marcada explícitamente como hueco cerrado, no decisión de
implementación.

Construido: `app/(auth)/login/page.tsx` + `LoginForm.tsx` (client component, separado
para poder envolver en `Suspense` sin volver todo el archivo cliente). Error de
`invalid_credentials` (código real de `@supabase/auth-js`, verificado en el paquete
instalado antes de escribirlo, no inventado) → mensaje en español; cualquier otro
error → mensaje genérico. Respeta `?next=`.

### Dirección visual — aplicada solo en `globals.css` y `tailwind.config.ts`

Crema (`#FAF7F0` fondo, `#F0EAD9` superficie) + negro suave (`#262420`) + sage
(`#5B6B4A`). El sage final es más oscuro que los tonos de ejemplo del humano
(`#8A9A7B`/`#9CAF88`): esos dan 2.2–2.8:1 contra el fondo crema como texto —no pasan
AA—, así que oscurecí dentro de la misma familia hasta pasar (5.38:1 fondo/texto,
5.76:1 blanco/botón). Está documentado en el comentario de `globals.css`, con la
tabla completa de contrastes verificados.

**Los cuatro estados de sobre, con racional** (pedido explícito: "propón los cuatro
con su racional, no solo los hex"):
- `no_budget` `#8F8974` — gris cálido, el menos saturado de los cuatro. Lee ausencia,
  no "otro estado". Nivel de contraste UI-component (3.27:1), no de texto de párrafo
  — se usa con `text-foreground` encima (como ya hace `Badge`), no como color de texto
  suelto.
- `available` `#3B6E91` — azul apagado, frío. Deliberadamente NO el sage de marca: el
  acento ya vive en botones/nav/FAB, y "disponible" en el mismo verde confundiría un
  sobre con dinero con la interfaz misma. 5.13:1, pasa AA como texto.
- `depleted` `#8A5F35` — ocre/café templado. Ni la alarma del rojo ni la calma del
  azul; el más neutro de los cuatro a propósito. 5.21:1.
- `overspent` — reusa `--color-danger` (`#B91C1C`, 6.05:1): sobregiro y error de
  formulario comparten lenguaje visual a propósito, no es un descuido.

**Números tabulares:** `font-variant-numeric: tabular-nums` global en `body`, no una
clase en `Money`/`Balance` — ninguno de los dos tiene una clase propia que targetear
sin tocar el componente (la condición era no tocarlos), y aplicarlo global es seguro
(no afecta texto no numérico, ayuda a cualquier lista de números).

**Tipografía:** pila de sistema (`-apple-system, ... sans-serif`), no una fuente
custom — "tipografía sencilla" más el hecho de que cargar un webfont hubiera
significado tocar `app/layout.tsx` para inyectar `next/font`, que está en el límite
de "no tocar componentes" aunque no sea uno estrictamente.

### Corrección del humano: nada de Playwright/e2e, ni transitoriamente

Intenté instalar Playwright (`npx playwright install chromium`) para tomar una
captura de `/login` y confirmar la paleta a ojo. El humano lo paró de inmediato:
`TASK-front.md` §2.2 excluye e2e/render/snapshot **por decisión explícita**, y
`npx playwright install` es agregar una dependencia sin preguntar, aunque nunca
llegara a `package.json`. Lo visual lo revisa el humano (§8, acción #6/#7) — no es
algo que se automatice, ni siquiera "rápido, solo para revisar yo mismo".

Verificación que sí hice, y que sí corresponde: build limpio, `curl` contra `/login`
confirmando que el HTML sirve con el contenido esperado, cero errores en el log del
servidor de desarrollo, contraste calculado con la fórmula de luminancia relativa de
WCAG (no a ojo). Ahí es donde termina lo que me toca verificar a mí.

## 2026-08-16 — Sesión 3 de implementación (U13 + U14)

Los seis en verde otra vez (207/207, sin tocar ningún test). Además del build/lint/
typecheck, arranqué el servidor de verdad (`pnpm dev`) contra Supabase real y probé a
mano: `GET /` sin cookies → `307` a `/login?next=%2F` (correcto); `GET /login` → `404`
limpio (la pantalla todavía no existe, pero no truena); `GET /api/bff/me` sin sesión →
`401 UNAUTHORIZED` real; `GET /api/bff/not-a-real-route` → `404 ROUTE_NOT_FOUND` sin
tocar la API. Cero stack traces en el log del servidor. `build` que compila no prueba
que el middleware corra bien contra Supabase real — esto sí.

### Paleta placeholder — condición del humano cumplida

`src/app/globals.css` trae los tokens de color; `tailwind.config.ts` los cablea. Todo
gris/neutro **excepto** los cuatro estados de sobre, que son colores realmente
distintos entre sí a propósito (pedido explícito): gris para `no_budget`, azul para
`available`, ámbar oscuro para `depleted`, rojo para `overspent`. Cuando se decida la
dirección visual de verdad, es un solo archivo el que cambia.

### U13 — componentes base

- `components/ui/`: `Button`, `Input`, `Field` (label + error + `aria-describedby`),
  `Checkbox`, `Badge`, `Sheet` (sobre `<dialog>` nativo — foco atrapado y Escape
  gratis), `Spinner`.
- `components/money/`: `Money`, `Balance` (delega en `formatBalance`, no aplica la
  regla de signo por su cuenta), `AmountInput` (el valor del formulario son centavos
  string; la conversión pasa por `parseAmountInput`, nunca a mano).
- `components/states/`: `EmptyState` (tres tonos, pintan distinto de verdad),
  `ErrorState` (recibe `code`, nunca `message` — no hay prop para el mensaje del
  servidor, a propósito, para que sea imposible pintarlo por accidente), `Skeleton`.
- `components/layout/`: `TabBar`, `Fab`, `Banner` (genérico), `OverduePeriodBanner`
  (el que sí sabe de dominio: quincenas vencidas).

### U14 — layouts, providers, avisos

- `providers/QueryProvider.tsx` y `providers/TimezoneProvider.tsx` — le faltaban a U10
  (la entrega original solo traía `query-keys.ts` e `invalidation.ts`; los providers
  quedaron pendientes hasta que algo los necesitó de verdad).
- `lib/api/browser-client.ts` (`bffFetch`) — nuevo: es el punto desde el que el
  navegador habla con `/api/bff/*`. Necesario porque los servicios de U11 son
  server-only (`next/headers`), y un hook que corre en el navegador no los puede
  importar — ver la pregunta abierta de la sesión anterior, ya resuelta en la práctica
  por `useOpenPeriods` (`features/periods/hooks/`).
- `app/layout.tsx` — session check, `QueryProvider` + `TimezoneProvider` (con
  `GET /me` si hay sesión, `America/Mexico_City` de fallback si no — ahí no hay a quién
  preguntarle), el banner de quincena vencida (solo si hay sesión).
- `app/(app)/layout.tsx` — el guard de onboarding (cero cuentas `cash` → `/empezar`),
  `TabBar` + `Fab`.
- `app/(app)/page.tsx` — placeholder deliberado: U16 (Inicio real) no se construye
  todavía, esto solo existe para que el layout tenga algo que envolver y sea
  revisable. Reemplazó al `app/page.tsx` de U0 — la ruta "/" real vive dentro de
  `(app)/`, no fuera.

### Dos veces la propia suite atrapó una fuga real del glosario — mientras construía, no al final

`i18n.test.ts` (ya verde desde la sesión de tests) pasó a fallar dos veces distintas
apenas empecé a escribir componentes reales, ambas por texto mío:

1. El label del tab "Sobres" contiene literalmente "Sobre" — `TabBar.tsx` lo tenía
   escrito a mano. Se movió a `lib/i18n/es.ts` (sección nueva `nav`, con su propia nota
   de por qué existe) y `TabBar` lo importa de ahí.
2. Un comentario en `app/(app)/page.tsx` decía "bloques de Por asignar" — ni siquiera
   era texto de usuario, era un comentario explicando qué va a traer U16, pero
   contiene el término literal. Reescrito para no usarlo.

Ninguno de los dos era un bug del test — el test hace exactamente lo que
TASK-front.md §5 pide ("cualquier término del glosario escrito a mano... solo aparece
en lib/i18n/es.ts"), y en ambos casos encontró una fuga real antes de que llegara a
revisión humana. Vale la pena que quien siga construyendo pantallas sepa que esto va a
seguir pasando — es la señal de que la suite está haciendo su trabajo, no un fallo que
arreglar evadiendo el patrón.

### Lo que sigue, en orden del grafo

U15–U23 (pantallas), todas independientes entre sí salvo U21 (depende de U17). Voy a
seguir el orden del §3 y avisar al terminar cada bloque para revisión visual, como se
pidió. `/login` sigue sin construirse — no es una unidad del grafo de §3 (no aparece
en la lista U15–U23), y el método de inicio de sesión (contraseña vs. magic link vs.
proveedor OAuth) no está documentado en ningún archivo fuente. Lo voy a necesitar
pronto para probar cualquier pantalla de verdad con sesión — lo señalo aquí para no
inventarlo solo cuando llegue el momento.

## 2026-08-16 — Sesión 2 de implementación

U8b, U9 completa y U11, con credenciales reales de Supabase ya en `.env.local`. Los
seis, por separado: **los seis en verde** (`typecheck`, `lint`, `test -- --run`
207/207, `build`, `verify:tests-untouched`, `verify:suite`). No se tocó ningún test.

### Verde

- **U8b** — `lib/supabase/{client,server,middleware}.ts`, `src/middleware.ts`. Sin
  tests propios (verificación humana, TASK-front.md §8). Ver "Inferencia de más
  riesgo" abajo — esto necesita el smoke test humano de §8.1–§8.7 antes de darlo por
  bueno de verdad.
- **U9 completa** — los 9 handlers dedicados bajo `app/api/bff/tx/*` y
  `app/api/bff/recurring/[id]/confirm`, más el catch-all
  `app/api/bff/[...path]/route.ts`. Los 9 validan con Zod
  (`features/transactions/schemas/*`, `features/recurring/schemas/confirm.ts`) antes
  de salir a la red. `ALLOWLIST` quedó poblado con las ~45 rutas no-idempotentes del
  contrato (antes vacío, como stub de la sesión de tests).
- **U11** — un servicio por endpoint, en `features/<dominio>/services/`. Cobertura
  completa de API-CONTRACT.md: profile, accounts, income-sources, categories,
  allocations, transactions (las 7 + reversa + lectura), periods, recurring-templates,
  insights. Más `lib/api/server-api.ts` (el agregador `serverApi` que
  ARCHITECTURE-front.md §5 muestra usando en el prefetch de RSC).

### Dos bugs reales que encontré construyendo, no en un test

**1. `forwardToApi` y `apiRequest` trataban un `204 No Content` como si fuera un
cuerpo vacío inválido.** Los DELETE del contrato (`DELETE /periods/{id}`, `DELETE
.../allocations/{allocationId}`) responden `204` sin cuerpo por diseño — es la forma
correcta, no una falla. Antes de este fix, `.json()` sobre ese cuerpo vacío lanzaba, y
el `catch` de "JSON inválido" lo convertía en un `500 INTERNAL_ERROR` fantasma. Lo
encontré al escribir `deleteAllocation` (U11) y darme cuenta de que la iba a romper en
cuanto alguien la llamara. Arreglado en los dos archivos; ningún test existente lo
cubría porque ninguno usaba status 204, así que el fix no tocó nada verde.

**2. Un comentario JSDoc con `` `features/*/schemas/` `` cerraba el bloque de
comentario antes de tiempo.** El texto contiene literalmente `*/`  (de "/\*/"), que
termina un comentario `/** ... */` a la mitad — el resto del comentario se parseaba
como código, y TypeScript reportaba "Unterminated template literal" en una línea sin
ninguna. Cuesta encontrarlo porque el error apunta a donde el parser se atoró, no a
donde está la causa real. Ninguna otra ocurrencia en el resto del código (revisado con
grep). Moraleja para cualquier sesión futura: nunca escribir un patrón con `*` seguido
de `/` dentro de un comentario de bloque — usar `<algo>` en vez de `*` para wildcards
en prosa.

### Inferencia de más riesgo de esta sesión: el puente Supabase ↔ session-policy.ts

`readSessionState` (U8a, con test ya verde, no se toca) espera una cookie sintética
`sb-session` con `{ expiresAt: <ISO 8601> }` — una convención inventada por la sesión
de tests, no el formato real de la cookie de Supabase (que es interno, versionado, y no
pensado para parsearse a mano).

`lib/supabase/middleware.ts` resuelve esto así: llama a `supabase.auth.getSession()`
(lectura local, sin red, de la sesión ya en cookies), saca `session.expires_at`
(segundos Unix, API pública y estable de `@supabase/auth-js`), y arma el mapa sintético
de una sola entrada que `readSessionState` espera. Esa lectura local decide la ACCIÓN
(`allow`/`refresh`/`redirect-login`), nunca autoriza por sí sola: si la acción es
`refresh`, siempre se llama después a `supabase.auth.getUser()`, que sí valida contra
el servidor de Supabase y refresca si el refresh token sigue vigente.

Evité deliberadamente parsear el formato interno de la cookie de Supabase — solo uso
`getSession()`/`getUser()`, la API pública documentada. Pero esto es una construcción
mía, no algo verificado contra Supabase real corriendo. **Necesita el smoke test humano
de TASK-front.md §8, puntos 6.4 y 6.7 en particular** — son justo los dos casos que
"ninguna suite de lógica pura puede probar de verdad, porque dependen de la red y del
ciclo real de sesión" (TASK-front.md §8.6).

### Otras inferencias de esta sesión

- **`income-sources.ts` vive en `features/accounts/services/`**, no en una carpeta
  propia — ARCHITECTURE-front.md §15 no lista `income-sources/` como feature aparte.
  Se agrupó con cuentas por ser, igual que ellas, dinero/origen de dinero direccionable.
- **`allocations.ts` vive en `features/envelopes/services/`**, no en `periods/` — esto
  sí está dicho explícitamente en ARCHITECTURE §15 ("envelopes: sobres: categories +
  allocations"), no es invención mía, solo lo dejo anotado porque es fácil intuir lo
  contrario (las allocations cuelgan de un periodo en el contrato).
- **`code: 'ROUTE_NOT_FOUND'`** para el 404 del catch-all cuando la ruta no está en el
  allowlist — no es un código del catálogo de API-CONTRACT.md §7.2 (ninguno de los
  404 documentados aplica; son todos "recurso específico no encontrado", esto es "ruta
  no expuesta"). Inventado, documentado aquí, fácil de cambiar si alguien ya tiene una
  convención distinta para 404 sintéticos del BFF.
- **Los servicios de U11 son exclusivamente de servidor** (`getAccessToken()` usa
  `next/headers`, que no corre en el navegador). Esto deja abierta una pregunta para
  cuando se construyan los hooks de feature (no es una unidad propia del grafo de §3 —
  aparecen implícitos dentro de U14+): un hook de TanStack Query que corre en el
  navegador no puede importar estos servicios directo (no tienen acceso a cookies
  httpOnly desde el cliente) — va a necesitar `fetch('/api/bff/...')` en su lugar. No
  lo resolví ahora porque construir hooks es trabajo de UI que esta sesión tiene
  instrucción explícita de no tocar todavía.

### `pnpm typecheck` con caché corrupto — no es un bug de esta sesión

Un error read "Unterminated template literal" apuntando a una línea vacía cuadra con
`tsconfig.tsbuildinfo` (compilación incremental) quedando obsoleto — pero en este caso
específico el error era real (ver arriba), no de caché. Vale la pena, ante cualquier
error de `tsc` que apunte a una línea que se ve inocente, probar `rm
tsconfig.tsbuildinfo` primero para descartar caché, y si persiste, sospechar de
comentarios con secuencias raras antes que de un bug del compilador.

## 2026-08-16 — Sesión 1 de implementación

**207/207 tests en verde.** Quedaron implementadas todas las unidades que tienen
tests propios en el grafo de §3, hasta donde el grafo lo permite sin bloquear en U8b
(que exige credenciales reales de Supabase, acción humana pendiente) o en trabajo de
UI (que no tiene test dedicado, por decisión explícita de "cero tests de render").

### Verde

| Unidad | Archivo(s) | Tests |
|---|---|---|
| U2 | `lib/domain/money.ts` | `money`, `sign-rule`, `split` — 23 |
| U3 | `lib/domain/dates.ts` | `dates` — 7 |
| U4 | `lib/domain/envelopes.ts` | `envelopes` — 5 |
| U5 | `lib/domain/late-capture.ts` | `late-capture` — 9 |
| U6 | `lib/i18n/{es,errors}.ts` | `errors`, `i18n` — 73 |
| U7 | `lib/api/client.ts` | `api-client` — 5 |
| U8a | `lib/supabase/session-policy.ts` | `session-policy` — 9 |
| U9 | `lib/bff/{allowlist,forward}.ts` | `allowlist`, `bff-forward` — 13 |
| U10 | `lib/query-keys.ts`, `lib/query/invalidation.ts` | `query-keys`, `invalidation` — 42 |
| U12 | `features/capture/stores/draft-store.ts` | `draft-store`, `idempotency`, `unauthorized-recovery` — 15 |
| U14 (parcial) | `lib/domain/periods.ts` | `overdue-periods` — 6 |

Los seis comandos de la condición de paro, por separado:

- `pnpm typecheck` ✓
- `pnpm lint` ✓ (después de agregar `next-env.d.ts` a `ignores` — ver más abajo)
- `pnpm test -- --run` ✓ 207/207
- `pnpm build` ✓
- `pnpm verify:tests-untouched` ✗ — **por una razón correcta**: hay dos ediciones de
  test autorizadas explícitamente por el usuario, sin comitear todavía (ver abajo). En
  cuanto se comiteen, esta puerta cierra.
- `pnpm verify:suite` ✓ — cero saltados, cero todo, cero fallidos, conteo y archivos
  correctos.

### Rojo — qué sigue y por qué

- **U8b** (adaptador de Supabase) — bloqueado por acción humana: necesita
  `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` reales (TASK-front.md §8,
  puntos 1–4). Sin tests propios; verificación humana.
- **U11** (servicios por feature), **U13** (componentes base) — sin tests propios,
  dependen de U9/U10 (ya verdes) pero son trabajo de UI/wiring que esta sesión no iba a
  tocar sola sin más contexto de dónde seguir.
- **U14 completa** (layouts, tab bar, FAB, banners, guard) — la lógica pura
  (`selectClosablePeriod`) ya está verde; falta el layout real, que depende de U11-U13.
- **U15–U23** (pantallas) — sin empezar. Dependen de U14 completa, y la dirección
  visual sigue "Pendiente" por decisión explícita (ARCHITECTURE §18.1).

### Dos ediciones de test — ambas autorizadas explícitamente, ninguna decidida por mí

**1. `money.test.ts` — el valor esperado de USD, no la lógica.**
`TASK-front.md` afirmaba que `Intl.NumberFormat('es-MX', { currency: 'USD' })`
produce `"US$700.00"`. En este runtime (Node v22.14, ICU actual) produce
`"USD 700.00"` (con espacio de no separación, U+00A0) — verificado probando
`symbol`, `narrowSymbol` y `code` como `currencyDisplay`; ninguno da `"US$"`. Forzarlo
habría exigido escribir el símbolo a mano, que es justo lo que la regla prohíbe.
Reporté el hallazgo, el usuario confirmó que el test estaba mal y autorizó corregir
esa única aserción. `formatMoney` quedó implementado fiel al contrato (BigInt para
toda la aritmética; `Intl.formatToParts` solo para aprender símbolo y separadores,
nunca para formatear el número). `TASK-front.md` §4/U2 sigue sin corregirse — vale la
pena que alguien lo revise, porque el ejemplo que trae ahí ya no es reproducible.

**2. `bff-forward.test.ts` — el mock, no la aserción.**
La prueba "un cuarto 409 IN_FLIGHT consecutivo sí sube" reusaba el mismo objeto
`Response` en las 4 llamadas simuladas (`mockResolvedValue(inFlightResponse())`), y el
body de un `Response` solo se puede leer una vez — la segunda llamada a `forwardToApi`
fallaba al leer un body ya consumido, cortando el reintento en 2 llamadas en vez de 4.
`forwardToApi` lee el body una vez por intento, que es lo correcto contra un `fetch`
real (cada llamada trae su propio `Response`). Encontré esto al implementar el
reintento de verdad — en la sesión de tests, con todo lanzando `not implemented`, este
camino nunca se ejercitó de verdad. Se lo planteé al usuario como una corrección
mecánica de una línea (`mockResolvedValue` → `mockImplementation`) y me autorizó
proceder directamente sin forzar una pregunta de opción múltiple sin sentido.

### Cambios de configuración sin pedir permiso (autorizado de antemano por el usuario)

`eslint.config.mjs`: agregado `next-env.d.ts` a `ignores`. Ese archivo lo regenera
`next build`/`next dev` solo, con una referencia triple-slash que es el boilerplate
estándar de Next — no algo que se escriba a mano, y no estaba excluido del lint. El
usuario autorizó de antemano corregir este tipo de hueco (archivo autogenerado que
rompe una puerta de config, no de comportamiento) sin pausar a preguntar.

También: `@typescript-eslint/no-unused-vars` se ajustó a `args: 'none'` durante la
sesión de tests (no esta) porque los stubs declaraban parámetros sin usar a propósito.
Ya no hace falta — todo lo implementado en esta sesión sí usa sus parámetros — pero se
deja así porque no hay ninguna razón para endurecerlo de vuelta a mitad de un loop
todavía en curso (quedan U11, U13 y las pantallas, que van a tener la misma forma).

### Trampas que no estaban documentadas

- **`Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' })` no produce
  `"US$"` en Node/ICU actual — produce `"USD 700.00"`.** Ver la corrección de
  arriba. Si `TASK-front.md` no se actualiza, la próxima sesión que lea el §4/U2 va a
  confundirse con el mismo ejemplo desactualizado.
- **Formatear un monto exacto arriba de 2^53 con `Intl` de verdad exige no dejar que
  el número pase por `Intl.NumberFormat.format()` en absoluto.** La técnica que
  funcionó: `formatToParts(±1)` para leer solo el símbolo/separadores/orden de las
  partes, y ensamblar el número real con aritmética `BigInt` + agrupación de miles
  hecha a mano. `Intl.NumberFormat.format()` con el `BigInt` real tampoco sirve
  directamente para injertar: hay que reconstruir las `parts`.
- **Reusar el mismo objeto `Response` en un mock de `fetch` para más de una llamada es
  un bug silencioso**: el body solo se puede leer una vez (`TypeError: Body is
  unusable`), y si el código bajo prueba atrapa ese error como "JSON inválido" (como
  debe hacerlo `forwardToApi`, por diseño), el mock roto se disfraza de fallo real.
  `mockImplementation(() => new Response(...))` — una instancia nueva por llamada — es
  el patrón correcto para simular reintentos contra `fetch`.
- **`vi.useFakeTimers()` + una promesa que puede rechazar antes de que el test la
  espere** (por ejemplo, mientras se avanza el reloj falso con
  `vi.advanceTimersByTimeAsync`) dispara "Unhandled Rejection" en Vitest aunque el test
  sí la espere más adelante. `promise.catch(() => {})` inmediatamente después de
  crearla, antes de avanzar el reloj, lo evita sin cambiar el resultado de la prueba.
- **El reporter JSON de Vitest 3.x nombra cada archivo de test en
  `testResults[].name`** (ruta absoluta), no en `.testFilePath` — ese campo no existe
  en esta versión. Documentado también en la entrada anterior de este archivo.

## 2026-08-15/16 — Sesión de tests (pre-implementación)

Entregó la suite de tests completa del `TASK-front.md`, la infraestructura de
verificación que la protege, y el andamiaje mínimo de `src/` necesario para que todo
eso compile y falle por la razón correcta. **No implementó ninguna unidad real** (ni
`money.ts`, ni `dates.ts`, ni componentes, ni servicios): todo `src/` es stub.

### Quién puede tocar `tests/EXPECTED.json` y bajo qué condición

**Nadie, salvo que se agregue un test legítimamente nuevo.** `EXPECTED.json` es la
puerta (§1.1 de `TASK-front.md`): existe precisamente para que el implementador no
pueda "arreglar" un conteo que no cuadra editando el número en vez del código.

Condición para tocarlo:
1. El cambio agrega o quita un test de verdad — no es un ajuste para que la cuenta
   salga.
2. Lo hace la misma clase de sesión que escribió la suite (una sesión de tests, no el
   loop de implementación), o el humano lo pide explícitamente.
3. El nuevo total y la lista de `files` se recalculan corriendo la suite real
   (`vitest run --reporter=json`), nunca a mano.
4. Se anota aquí, en `PROGRESS.md`, qué cambió y por qué — igual que esta entrada.

Si el loop de implementación autónomo alguna ved llega a un punto donde "arreglar"
`EXPECTED.json` parece la salida más corta, esa es la señal de que algo se rompió en
otro lado. La regla dura de `TASK-front.md` §7 aplica: modificarlo para salir en verde
es la falla más grave posible en ese task.

### Los 18 archivos de test (no 17, no 16) — contra §5.2

El prompt de esta sesión decía "16archivos"; la tabla real de `TASK-front.md` §5.2
tiene 17 filas (incluye `session-policy.test.ts`, que el conteo de memoria del prompt
no contó). Además, `api-client.test.ts` — que U7 pedía en su propio texto pero que la
tabla de §5.2 no listaba — se agregó como fila 18. El usuario confirmó las tres cosas
antes de escribir nada; `TASK-front.md` §5.2 y §6.1 ya quedaron editados para
reflejarlo, así que ese documento es ahora la fuente de verdad, no este párrafo.

| Archivo | Cubre |
|---|---|
| `money.test.ts` | `formatMoney`, `parseAmountInput` |
| `sign-rule.test.ts` | `formatBalance` — los 5 `kind` reales |
| `split.test.ts` | `splitEvenly` — invariante de suma |
| `dates.test.ts` | `todayInTimeZone`, `formatInstant`, análisis estático anti-`toISOString` |
| `envelopes.test.ts` | `deriveEnvelopeStatus` — los 4 estados |
| `idempotency.test.ts` | Reuso de la llave del borrador a través de reintentos |
| `errors.test.ts` | `errorMessageFor` contra el catálogo completo del contrato §7.2 |
| `unauthorized-recovery.test.ts` | Rehidratación del borrador tras 401 |
| `draft-store.test.ts` | Ciclo completo del borrador |
| `late-capture.test.ts` | `isLateCaptureNote`, `extractTransactionIdFromNote` |
| `allowlist.test.ts` | `isAllowedRoute` — matching de `:id`, método |
| `bff-forward.test.ts` | `forwardToApi`, `contractError` — JSON garantizado, headers, reintento IN_FLIGHT |
| `api-client.test.ts` | `apiRequest` — ApiError, 200/201 iguales, userId nunca en el body |
| `invalidation.test.ts` | `invalidationFor` contra la matriz de ARCHITECTURE §5.2 |
| `query-keys.test.ts` | `qk` — cada key, estabilidad, sin cursores |
| `overdue-periods.test.ts` | `selectClosablePeriod` |
| `i18n.test.ts` | Cobertura de `es` + fuga de términos fuera de `es.ts` |
| `session-policy.test.ts` | `readSessionState`, `sessionActionFor` |

### Inferencias — nombradas explícitamente, no enterradas

El usuario aprobó estas cuatro (más la de `periods.ts`) con la condición de que las
firmas nuevas queden en `TASK-front.md` §6.1, no solo aquí. Ya están ahí. Lo que sigue
es el resto de las decisiones menores que no ameritaban una firma fijada pero sí
quedar documentadas:

1. **Convención de cookie de sesión en `session-policy.test.ts`.** `readSessionState`
   recibe `cookies: ReadonlyMap<string, string>` crudo, pero ningún documento fija el
   nombre de la cookie de Supabase ni su forma interna (es propiedad de U8b, el
   adaptador, que esta sesión no toca). El test modela una cookie `sb-session` con JSON
   `{ expiresAt: <ISO 8601> }`. **Si el implementador de U8b usa otro nombre o forma,
   es una contradicción real entre el test y la Supabase real — deténganse y
   pregunten, no editen el test.**

2. **`useDraft` (el hook de React de U12) no se escribió.** Ningún test lo ejercita
   directamente — los tres archivos de borrador prueban las funciones puras
   (`openDraft`, `updateDraft`, `loadDraft`, `clearDraft`, `draftStorageKey`) con un
   `DraftStorage` inyectable, precisamente para no depender de `sessionStorage` real ni
   de `jsdom`/`@testing-library/react` (que no están en U0 y esta sesión no los agregó
   sin preguntar). Envolver esas funciones en Zustand + `persist` + un hook es trabajo
   del implementador de U12.

3. **`MutationName` (el enum de identificadores de mutación que consume
   `invalidationFor`) es nombrado por esta sesión**, no por ARCHITECTURE ni TASK. Sus
   14 valores corresponden 1 a 1 con las 10 filas de la matriz de ARCHITECTURE §5.2
   (algunas filas, como "Crear/editar/borrar periodo", se separaron en 3 nombres
   porque `invalidationFor` recibe una mutación a la vez).

4. **`invalidationFor` y `qk` se testean por categoría de recurso (primer segmento de
   la key), no por key completa**, salvo `qk.openPeriods()`, que TASK exige verificar
   tal cual. Razón: `invalidationFor(mutation)` no recibe ids de recurso — no puede
   construir un `qk.account('a1')` de una cuenta específica sin saber cuál — así que lo
   que declara son categorías (`['account']`), no instancias. Las instancias las agrega
   el hook de la mutación real con los ids que sí tiene.

5. **`formatInstant` no tiene un formato de salida exacto documentado en ningún
   archivo** (a diferencia de `formatMoney`, que sí trae ejemplos literales). El test
   verifica comportamiento (la zona sí afecta el resultado, no es un passthrough del
   ISO crudo) en vez de una cadena exacta — inventar un formato de despliegue
   ("15:14" vs "3:14 p.m." vs "9 de agosto, 15:14") sería una decisión de UI que a esta
   sesión no le toca tomar.

6. **`lib/domain/periods.ts` es un archivo nuevo**, no listado en el árbol de
   `ARCHITECTURE-front.md` §15. `selectClosablePeriod` vive ahí por la misma razón que
   las otras primitivas de dominio: es lógica pura, testeable sin red y sin UI.

### Por qué `verify:suite` no encadena `vitest run && node scripts/verify-suite.mjs`

La primera versión sí lo hacía, y era un bug: `vitest run` sale con código distinto de
cero en cuanto hay un solo test rojo — que es el estado normal y esperado mientras la
suite no tiene implementación real — así que el `&&` nunca dejaba correr el script que
de verdad importa (el que checa saltados/todo/conteo). `scripts/verify-suite.mjs`
ahora corre vitest él mismo como subproceso, ignora su código de salida para leer el
reporte, y decide el resultado final con las cinco condiciones de `TASK-front.md`
§1.1 — incluyendo `numFailedTests === 0`, que si sigue siendo la única condición que
falla ahora mismo, es correcto: significa que las cuatro verificaciones que sí importan
en esta fase (cero saltados, cero todo, conteo correcto, archivos completos) ya pasan.

### Estado de las puertas de esta sesión

- `pnpm test -- --run` → **207 de 207 fallan, 0 pasan, 0 saltados, 0 todo.** Los dos
  tests que pasaban en el primer corrido (7 de "ningún término del glosario aparece
  fuera de es.ts" + 1 de arity de `formatBalance`) se diagnosticaron y corrigieron:
  el primero por aserción de ausencia sin afirmación positiva antes (se fusionaron en
  un solo `it` cada uno); el segundo se borró por no depender de implementación.
- `pnpm run verify:suite` → confirma cero saltados, cero todo, conteo (207) y los 18
  archivos correctos; falla solo por `numFailedTests`, que es el estado correcto ahora.
- `pnpm typecheck` → **0 errores.** No hay módulos faltantes todavía porque esta
  sesión no escribió nada que importe features/, componentes o rutas de `(app)/` que
  no existan — todo lo que los 18 tests importan, existe como stub.
- `pnpm lint` → 0 warnings (se ajustó `@typescript-eslint/no-unused-vars` a
  `args: 'none'`: los parámetros sin usar en los stubs son intencionales, no bugs).
- `pnpm build` → compila y genera las páginas estáticas del esqueleto de U0.
- `pnpm run verify:tests-untouched` → falla ahora mismo porque nada está comiteado
  todavía (`git status --porcelain` marca `tests/` y `scripts/` como sin trackear).
  Es el comportamiento correcto: la puerta necesita una línea base comiteada contra la
  cual comparar. Cuando el humano decida comitear esta entrega, esa pasa a ser esa
  línea base.

### Trampas que no estaban documentadas y habría que anotar si sorprenden después

- El reporter JSON de Vitest 3.x nombra el archivo de cada suite en `testResults[].name`
  (ruta absoluta), no en `.testFilePath` — ese campo no existe en esta versión.
- `Response.json()` de Node (fetch nativo) rechaza limpiamente con `SyntaxError` ante
  HTML o cuerpo vacío — no hace falta un mock elaborado para simular la "respuesta no-
  JSON" del BFF, un `new Response('<html>...', {...})` real alcanza.
- Con `vi.useFakeTimers()`, una promesa que rechaza antes de que el test haga `await`
  sobre ella (por ejemplo, mientras se avanza el reloj falso con
  `vi.advanceTimersByTimeAsync`) dispara "Unhandled Rejection" en Vitest aunque el test
  sí la espere más adelante. Se resuelve con un `promise.catch(() => {})` inmediato
  después de crear la promesa, antes de avanzar el reloj.
