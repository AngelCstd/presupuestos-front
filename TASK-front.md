# TASK-front.md

> **Destinatario: un agente autónomo.** Este documento se ejecuta sin supervisión turno por turno.
> **Fuentes de verdad, en este orden:** `API-CONTRACT.md` (contrato del backend, solo lectura) → `ARCHITECTURE-front.md` (decisiones de diseño) → `SCREENS-front.md` (pantallas, textos, estados vacíos) → este documento (orden de ejecución).
>
> ## ⛔ Regla transversal, por encima de todo lo demás
>
> **Ante cualquier decisión que no esté documentada en los cuatro archivos de arriba: DETENTE Y PREGUNTA.**
>
> No elijas "lo razonable". No inventes un endpoint. No supongas un campo. No renombres nada. Una ambigüedad resuelta en silencio es exactamente el fallo que este formato existe para evitar. Preguntar nunca es un error; decidir solo, sí.

---

## 1. Condición de paro

Binaria y verificable por comando. El loop termina **cuando los cinco comandos salen con código 0** y no antes:

```bash
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint --max-warnings=0
pnpm verify:suite     # ver §1.1 — reemplaza a `pnpm test` como puerta
pnpm build            # next build
pnpm verify:tests-untouched   # ver §1.2
```

### 1.1 `pnpm verify:suite` — por qué no basta `vitest run`

**Vitest sale con código 0 aunque haya tests saltados.** Un `it.skip` no rompe el comando, así que "0 skipped, 0 todo" sería una intención sin mecanismo. Y `vitest run` tampoco nota que falten tests: si la suite declaraba 187 y corren 184, sale verde.

```bash
# scripts/verify-suite.mjs — lo entrega la sesión de tests, NO el implementador
vitest run --reporter=json --outputFile=.vitest-report.json
```

El script lee el reporte y **falla si cualquiera de estas no se cumple**:

| Comprobación | Falla si |
|---|---|
| `numFailedTests === 0` | hay tests rojos |
| `numPendingTests === 0` | hay `it.skip` o `describe.skip` |
| `numTodoTests === 0` | hay `it.todo` |
| `numTotalTests === EXPECTED.totalTests` | el conteo no cuadra: se borró, se comentó o se agregó un test |
| cada archivo de `EXPECTED.files` existe y corrió | falta un archivo entero |

`tests/EXPECTED.json` lo escribe la sesión de tests junto con la suite:

```json
{ "totalTests": 0, "files": ["money.test.ts", "..."] }
```

*(`totalTests` lo llena la sesión de tests con el número real; queda en 0 aquí a propósito.)*

### 1.2 `pnpm verify:tests-untouched` — el diff no basta solo

```bash
git diff --exit-code -- '**/*.test.ts' '**/*.test.tsx' 'tests/' 'scripts/verify-suite.mjs'
test -z "$(git status --porcelain -- '**/*.test.ts' '**/*.test.tsx' 'tests/' 'scripts/')"
```

Las dos líneas son complementarias y ninguna sobra:

- El **`git diff`** atrapa modificar o comentar un test existente, y borrarlo.
- El **`git status --porcelain`** atrapa lo que el diff no ve: **un archivo de test nuevo sin trackear**, agregado por el agente para fabricar evidencia de que "pasa".
- El **conteo de §1.1** atrapa el resto: un test agregado *y* commiteado sube el total y no cuadra con `EXPECTED.json`.

Los tres juntos cierran el hueco. Cualquiera solo lo deja abierto.

**Si un test falla, el código está mal, no el test.** Modificar un test, el script de verificación o `EXPECTED.json` para salir en verde es la falla más grave posible en este task.

**No hay criterio de "se ve bien".** Lo visual lo revisa el humano después; no es condición de paro y el agente no lo evalúa.

---

## 2. Alcance

### 2.1 Dentro

- Las 12 pantallas de `SCREENS-front.md`, con sus estados vacíos exactos.
- BFF completo: catch-all con allowlist + los 9 handlers dedicados idempotentes.
- Las 4 primitivas de dominio (`money`, `dates`, `envelopes`, `late-capture`).
- Capa de traducción al español, archivo único.
- Manejo de errores por `code`, con catálogo completo del §7.2 del contrato.
- Borradores en `sessionStorage` + flujo de re-login del `401`.
- Los 7 endpoints de transacción + reversas.
- Presupuesto: crear/editar/borrar periodos, asignar con `PUT`, mover, `close-preview` y cierre.
- Recurrentes: listar, crear (`POST`) y confirmar.
- Los 19 puntos del checklist del §18 del contrato. **Ese checklist es el criterio de completitud funcional**, no algo a redescubrir.

### 2.2 Fuera — no implementar, aunque parezca fácil

| Fuera de alcance | Por qué |
|---|---|
| Offline / cola de envíos | Decisión explícita. El reintento manual con la misma llave alcanza |
| Editar o borrar plantillas recurrentes | Solo `POST` y `confirm` en v1 |
| Tests de render, snapshot o e2e | Caros, frágiles, y no atrapan lo que rompe |
| Conversión de moneda o totales consolidados | La API no da tipo de cambio (§15.4) |
| Cualquier endpoint que no esté en `API-CONTRACT.md` | No existe |
| Push, polling, websockets | §15.7: no hay tiempo real |
| Dirección visual (paleta, tipografías) | Pendiente. Trabajar contra nombres de token |
| Modo oscuro | No pedido |

---

## 3. Grafo de dependencias

**No es una lista de tareas: es un orden forzado.** Una unidad no arranca hasta que **todas** sus dependencias tienen sus tests en verde.

```
U0 setup
 ├─→ U1 tipos del contrato
 │    ├─→ U2 money ─────────┐
 │    ├─→ U3 dates ─────────┤
 │    ├─→ U4 envelopes ─────┼─→ U10 query-keys + providers ─┐
 │    ├─→ U5 late-capture ──┤                                │
 │    └─→ U6 i18n ──────────┘                                │
 ├─→ U7 cliente HTTP + ApiError ──┐                          │
 ├─→ U8a política de sesión ──────┤                          │
 │    └─→ U8b adaptador Supabase ──┼─→ U9 BFF ────────────────┤
 └─→ U13 componentes ui/states ───┘                          │
                                                             ↓
                                      U11 servicios por feature
                                                             ↓
                                      U12 draft store + useDraft
                                                             ↓
                                      U14 layouts, tab bar, FAB, banners, guard
                                                             ↓
        ┌──────────────┬──────────────┬─────────────┬────────┴──────┬──────────────┐
        ↓              ↓              ↓             ↓               ↓              ↓
   U15 onboarding  U16 inicio    U17 sobres   U18 capturar     U19 movimientos  U20 cuentas
                                                    ↓
                                             U21 quincenas
                                                    ↓
                                             U22 recordatorios
                                                    ↓
                                             U23 más / ajustes
```

**Por qué U18 (capturar) va antes que U21 (quincenas):** capturar es el caso de uso central y ejercita el borrador, la llave de idempotencia y `budgetImpact` completos. Si algo de esa cadena está mal, quiero que reviente ahí y no doce unidades después.

**U15 a U20 son independientes entre sí** y pueden hacerse en cualquier orden dentro del nivel. U21 depende de U17 porque el cierre reusa la tarjeta de sobre.

---

## 4. Unidades

Cada unidad: qué entrega, de qué depende, y su criterio de aceptación en dado–cuando–entonces. **Los tests de cada unidad ya existen** y están listados en §5.

---

### U0 — Setup

**Entrega:** proyecto Next.js (App Router) + TypeScript `strict` + Tailwind + Vitest + ESLint + Prettier. `pnpm` como gestor. Scripts `typecheck`, `lint`, `test`, `build`.

**Depende de:** nada.

- **Dado** un checkout limpio, **cuando** se corre `pnpm install && pnpm typecheck && pnpm lint && pnpm build`, **entonces** los cuatro salen 0.
- **Dado** el proyecto, **cuando** se inspecciona `tsconfig.json`, **entonces** `strict: true` y `noUncheckedIndexedAccess: true`.

---

### U1 — Tipos del contrato

**Entrega:** `src/types/api.ts` — tipos TypeScript de **todas** las formas de `API-CONTRACT.md`.

**Depende de:** U0.

**Reglas duras:**
- Todo campo que termina en `Cents` es `string`. **Sin excepción, sin `number`, sin uniones.**
- Las fechas de calendario son `string` con marca de tipo: `type CalendarDate = string & { readonly __brand: 'CalendarDate' }`.
- Los enums salen del contrato tal cual, en inglés: `AccountKind`, `EnvelopeStatus`, `RolloverType`, `BudgetImpactStatus`, `AllocationSource`, `PeriodStatus`.
- **Cero `any`.** Si un campo no está en el contrato, no existe.

- **Dado** `types/api.ts`, **cuando** se busca `: number` en campos que terminan en `Cents`, **entonces** no hay ninguna coincidencia.
- **Dado** el tipo `AccountKind`, **cuando** se inspecciona, **entonces** incluye `system` pero marcado con un comentario de que la API nunca lo devuelve en listados y la UI lo filtra.

---

### U2 — `lib/domain/money.ts`

**Depende de:** U1. **Tests:** `money.test.ts` (ya escritos).

**Entrega las cuatro funciones de §8.1 de la arquitectura**, con las firmas exactas de §6 de este documento.

- **Dado** `"70000"`, **cuando** se llama `formatMoney`, **entonces** devuelve `"$700.00"`.
- **Dado** `"-250000"`, **cuando** se llama `formatMoney`, **entonces** el signo se conserva: `"-$2,500.00"`.
- **Dado** `"0"`, **entonces** `"$0.00"` — nunca cadena vacía ni guión.
- **Dado** `"9007199254740993"` (2^53 + 1), **cuando** se formatea, **entonces** el resultado es exacto. **La aritmética usa `BigInt`; `Number` en cualquier punto de este archivo es un defecto.**
- **Dado** que no se pasa `currency`, **entonces** se usa `"MXN"` y el resultado es `"$700.00"`.
- **Dado** `currency: "USD"`, **entonces** el símbolo lo produce `Intl.NumberFormat("es-MX", { style: "currency", currency })` — resultado `"US$700.00"`. **El símbolo nunca se escribe a mano ni se concatena un `"$"` literal.**
- **Dado** un `currency` que no es ISO 4217, **entonces** se cae a `"MXN"` **sin lanzar**. Un throw aquí tumbaría la pantalla completa por un dato malo.

**Regla de multi-moneda, decidida aquí y no en el componente:** cada monto se pinta con la moneda del recurso al que pertenece (`account.currency`, `category.currency`). Los agregados sin moneda propia —`unassignedCents`— usan el default. **Montos de monedas distintas nunca se suman**; si aparecen varias, se listan por separado. No hay tipo de cambio (§15.4 del contrato).
- **Dado** `"-250000"` y `kind: "credit"`, **cuando** se llama `formatBalance`, **entonces** devuelve `{ amount: "$2,500.00", suffix: "debes" }` — **siempre, en cualquier pantalla**.
- **Dado** el mismo monto con `kind: "cash"`, **entonces** devuelve `{ amount: "-$2,500.00", suffix: null }`. La transformación depende **solo** del `kind`.
- **Dado** `formatBalance`, **cuando** se inspecciona su firma, **entonces** no recibe nombre de cuenta, ni pantalla, ni contexto. **Si alguna vez lo necesita, detente y pregunta.**
- **Dado** `("10000", 3)`, **cuando** se llama `splitEvenly`, **entonces** devuelve `["3334","3333","3333"]` y su suma es exactamente `"10000"`.
- **Dado** cualquier `(total, n)`, **entonces** `sum(splitEvenly(total, n)) === total`. Invariante sin excepción.

---

### U3 — `lib/domain/dates.ts`

**Depende de:** U1. **Tests:** `dates.test.ts`. **Es la unidad de mayor riesgo del proyecto.**

- **Dado** un instante que en `America/Mexico_City` son las 23:00 del día D, **cuando** se llama `todayInTimeZone("America/Mexico_City")`, **entonces** devuelve **D**, no D+1.
- **Dado** un instante que en esa zona son las 00:30 del día D, **entonces** devuelve D.
- **Dado** cualquier fecha, **cuando** se inspecciona el archivo, **entonces** **no aparece `toISOString()` en ninguna parte**. Es el bug exacto que esta unidad existe para evitar.
- **Dado** un `createdAt` en UTC, **cuando** se llama `formatInstant` con la zona del usuario, **entonces** se pinta en hora local.
- **Dado** cualquier función de este archivo, **entonces** recibe la zona como **parámetro explícito**. Nunca lee `Intl.DateTimeFormat().resolvedOptions().timeZone` — la zona sale de `GET /me` (§4.2 del contrato).

---

### U4 — `lib/domain/envelopes.ts`

**Depende de:** U1. **Tests:** `envelopes.test.ts`.

- **Dado** `hasBudget: false` con cualquier monto, **entonces** el resultado es `"no_budget"`. Se evalúa **primero**, antes de mirar montos.
- **Dado** `assignedCents: "0"`, `hasBudget: true`, `availableCents: "0"`, **entonces** `"depleted"` — **no** `"no_budget"`. Es "hubo presupuesto y quedó en cero".
- **Dado** `availableCents: "-30000"` con `hasBudget: true`, **entonces** `"overspent"`.
- **Dado** `availableCents: "-30000"`, `spentCents: "0"`, `hasBudget: true`, **entonces** `"overspent"` — el caso de captura tardía del §11.12, y es correcto.
- **Dado** `availableCents > 0` con `hasBudget: true`, **entonces** `"available"`.

---

### U5 — `lib/domain/late-capture.ts`

**Depende de:** U1. **Tests:** `late-capture.test.ts`.

⚠️ **Este archivo está acoplado a un detalle de implementación del backend, no al contrato.** Ver §14 de la arquitectura. Todo el acoplamiento vive aquí y en ningún otro archivo.

- **Dado** `"Ajuste por captura tardía — tx 47e2117a-…, fecha 2026-08-12"`, **cuando** se llama `isLateCaptureNote`, **entonces** `true`.
- **Dado** una nota que empieza con el prefijo pero con el resto malformado, **entonces** `isLateCaptureNote` sigue devolviendo `true` — se detecta **por prefijo**, nunca por la cadena completa.
- **Dado** esa misma nota malformada, **cuando** se llama `extractTransactionIdFromNote`, **entonces** devuelve `null` **sin lanzar**. La confirmación se muestra sin enlace; nunca al revés.
- **Dado** una nota con guión ASCII (`-`) en vez de raya larga (`—`, U+2014), **entonces** `isLateCaptureNote` devuelve `false`. El prefijo es literal.
- **Dado** `note: null`, **entonces** `false`.

---

### U6 — `lib/i18n/`

**Depende de:** U1. **Tests:** `i18n.test.ts`, `errors.test.ts`.

**Entrega:** `es.ts` (glosario de la Parte 1 de `SCREENS-front.md`) y `errors.ts` (catálogo completo del §7.2 del contrato).

- **Dado** cualquier `code` del §7.2, **cuando** se llama `errorMessageFor`, **entonces** devuelve un texto en español que no es el fallback.
- **Dado** `"CODIGO_QUE_NO_EXISTE"`, **entonces** devuelve el fallback genérico **sin lanzar**.
- **Dado** todo el `src/`, **cuando** se busca cualquier término del glosario escrito a mano en un componente (`"Sobre"`, `"Quincena"`, `"Por asignar"`…), **entonces** solo aparece en `lib/i18n/es.ts`.
- **Dado** el `message` de una respuesta de error, **entonces** nunca se pinta en la UI. Solo se loguea.

---

### U7 — `lib/api/client.ts` + `errors.ts`

**Depende de:** U0, U1. **Tests:** `api-client.test.ts`, `idempotency.test.ts`.

- **Dado** cualquier respuesta no-2xx, **cuando** pasa por el cliente, **entonces** se convierte en un `ApiError` con `code`, `statusCode` y `details`.
- **Dado** un `409 IDEMPOTENCY_IN_FLIGHT`, **entonces** el cliente espera ~1s y reintenta **con la misma llave**, hasta 3 veces, **sin que el error llegue al componente**.
- **Dado** un cuarto `IDEMPOTENCY_IN_FLIGHT`, **entonces** sí sube como `ApiError`.
- **Dado** un `200` y un `201` con el mismo cuerpo, **entonces** el cliente los trata **idénticamente** (§5.2 del contrato).
- **Dado** cualquier request, **entonces** el body nunca incluye `userId`. El backend lo saca del token y un `userId` da `400`.

---

### U8 — Sesión: política y adaptador

**Depende de:** U0. **Tests:** `session-policy.test.ts`.

La unidad se parte en dos porque **solo una mitad necesita credenciales**. Testear la que sí es testeable no es opcional: es lógica que decide si el usuario entra o no.

#### U8a — Política de sesión (lógica pura, con tests)

**Entrega:** `lib/supabase/session-policy.ts`. **Cero llamadas a Supabase, cero I/O.** Decide *qué hacer* dado el estado de las cookies; no lo ejecuta.

- **Dado** un request sin cookie de sesión, **cuando** se llama `readSessionState`, **entonces** devuelve `"none"`.
- **Dado** una cookie con `expiresAt` posterior a `now`, **entonces** `"valid"`.
- **Dado** una cookie con `expiresAt` anterior o igual a `now`, **entonces** `"expired"`.
- **Dado** una cookie malformada o no parseable, **entonces** `"none"` — **nunca lanza**. Un throw en el middleware tumba todas las rutas.
- **Dado** `"none"` y una ruta protegida, **cuando** se llama `sessionActionFor`, **entonces** `"redirect-login"`, y el destino conserva la ruta original como `next`.
- **Dado** `"none"` y una ruta pública (`/login`), **entonces** `"allow"`.
- **Dado** `"expired"` en cualquier ruta protegida, **entonces** `"refresh"` — **no** `"redirect-login"`. Redirigir en vez de refrescar mandaría al login a un usuario cuyo refresh token sigue vigente, en cada visita.
- **Dado** `"valid"`, **entonces** `"allow"`.
- **Dado** cualquier función del archivo, **entonces** recibe `now: Date` como parámetro. Nunca llama a `Date.now()` internamente.

#### U8b — Adaptador de Supabase (sin tests, verificación humana)

**Entrega:** `lib/supabase/{client,server,middleware}.ts` + `middleware.ts` en la raíz, con el patrón estándar de `@supabase/ssr`. **Su única lógica es ejecutar lo que U8a decidió.** Todo `if` que no sea llamar a Supabase pertenece a U8a.

Lo que no se puede testear es la llamada real, no la lógica alrededor. Un mock de Supabase aquí probaría el mock.

- **Dado** el bundle del cliente, **cuando** se busca el `access_token`, **entonces** no aparece. **Nunca** se pasa a un Client Component, ni en props, ni en el estado inicial.
- Verificación real: acción humana #4 y #6 de §8.

### U9 — El BFF

**Depende de:** U7, U8b. **Tests:** `allowlist.test.ts`, `bff-forward.test.ts`.

**Entrega:** `lib/bff/allowlist.ts`, `lib/bff/forward.ts`, `app/api/bff/[...path]/route.ts` y los 9 handlers dedicados de §4.3 de la arquitectura.

- **Dado** un método y una ruta que están en la allowlist, **entonces** se reenvía con el `Authorization` puesto.
- **Dado** `GET /accounts/abc/algo-que-no-existe`, **entonces** `404` **sin llamar a la API**.
- **Dado** el patrón `/accounts/:id`, **cuando** llega `/accounts/abc/def`, **entonces** **no casa**: `:id` cubre un segmento y no cruza `/`.
- **Dado** `DELETE` sobre una ruta registrada solo como `GET`, **entonces** `404`.
- **Dado** que la API responde HTML o un cuerpo vacío, **cuando** el BFF intenta parsear, **entonces** devuelve `500 INTERNAL_ERROR` con el formato de error del contrato. **Toda respuesta del BFF es JSON válido, siempre.**
- **Dado** un POST a un handler idempotente sin `Idempotency-Key`, **entonces** `400 IDEMPOTENCY_KEY_REQUIRED` **sin llamar a la API**.
- **Dado** un `Idempotency-Key` que no es UUID, **entonces** `400 IDEMPOTENCY_KEY_INVALID` sin llamar a la API.
- **Dado** un body que no pasa el esquema Zod, **entonces** `400 VALIDATION_FAILED` con `details`, sin llamar a la API.
- **Dado** cualquier request del navegador, **entonces** solo se reenvían los headers `content-type` e `idempotency-key`.

---

### U10 — Query keys y providers

**Depende de:** U2–U6. **Tests:** `query-keys.test.ts`, `invalidation.test.ts`.

**Entrega:** `lib/query-keys.ts` (§5.1 de la arquitectura), `lib/query/invalidation.ts` (la matriz de §5.2 como dato, no como código regado), `providers/QueryProvider.tsx`, `providers/TimezoneProvider.tsx`.

- **Dado** cualquier mutación de la matriz, **cuando** se consulta `invalidationFor(mutation)`, **entonces** devuelve exactamente las keys declaradas en §5.2 de la arquitectura.
- **Dado** cualquier mutación que cierre o cree un periodo, **entonces** su lista incluye `qk.openPeriods()`. Es la que alimenta el banner del layout raíz y la más fácil de olvidar.
- **Dado** todo el `src/`, **cuando** se busca `invalidateQueries()` sin argumentos, **entonces** no hay ninguna coincidencia.
- **Dado** cualquier query key, **entonces** no contiene un cursor. Los cursores son opacos y no se persisten (§6.1 del contrato).

---

### U11 — Servicios por feature

**Depende de:** U9, U10. **Tests:** ninguno propio (son envoltorios delgados; lo que se testea es el cliente y los hooks).

**Entrega:** una función por endpoint del contrato, en `features/*/services/`. Saben la forma del request y del response, nada más. **Cero aritmética, cero traducción, cero decisiones de UI.**

- **Dado** cualquier servicio, **cuando** se inspecciona, **entonces** no calcula saldos ni deriva estados. Toda la aritmética vive en `/insights` (§14 del contrato).
- **Dado** el servicio de sobres, **entonces** la escritura usa `PUT /periods/{id}/allocations/{categoryId}`. **El `POST` de delta no se usa desde la UI de sobres** (§18 del contrato).

---

### U12 — Borradores

**Depende de:** U10. **Tests:** `draft-store.test.ts`, `idempotency.test.ts`, `unauthorized-recovery.test.ts`.

**Entrega:** `features/capture/stores/draft-store.ts` (Zustand + `persist` sobre `sessionStorage`) y `useDraft`.

- **Dado** que se abre un formulario sin borrador previo, **entonces** se genera una llave UUID v4 y se guarda con los valores.
- **Dado** un borrador existente, **cuando** se reabre el formulario, **entonces** se reusa **la llave que traía**, no una nueva.
- **Dado** dos envíos del mismo formulario sin haber recibido `2xx`, **entonces** ambos mandan la **misma** llave.
- **Dado** un `2xx`, **entonces** el borrador se borra y la siguiente apertura genera llave nueva.
- **Dado** un error de red, un `409` o un `401`, **entonces** el borrador **no** se borra y la llave se conserva.
- **Dado** un `401` seguido de re-login, **cuando** se vuelve a `/capturar/gasto`, **entonces** los valores y la llave se rehidratan intactos.
- **Dado** el almacén, **entonces** usa `sessionStorage`. **`localStorage` está prohibido aquí**: un borrador de tres días trae una llave inútil.

---

### U13 — Componentes base

**Depende de:** U0, U2, U6. **Sin tests** (son visuales; el humano los revisa).

**Entrega:** `components/ui/` (atoms), `components/money/` (`Money`, `Balance`, `AmountInput`), `components/states/` (`EmptyState`, `ErrorState`, `Skeleton`), `components/layout/`.

- **Dado** cualquier componente, **cuando** se busca un valor hex o un px suelto, **entonces** no hay ninguno. Todo sale de tokens.
- **Dado** `<Balance />`, **entonces** recibe `cents` y `kind`, y delega en `formatBalance`. **No aplica la regla de signo por su cuenta.**
- **Dado** `<AmountInput />`, **entonces** su valor en el estado del formulario ya son centavos string. La conversión pasa por `parseAmountInput`.
- **Dado** `<EmptyState />`, **entonces** recibe `tone: 'pendiente' | 'exito' | 'neutral'` y pinta distinto cada uno. Un vacío de éxito no se ve como una carencia.

---

### U14 — Layouts, navegación y avisos

**Depende de:** U11, U12, U13. **Tests:** `overdue-periods.test.ts`.

**Entrega:** `app/layout.tsx` (providers, `TimezoneProvider`, banner de quincena vencida), `app/(app)/layout.tsx` (tab bar de 4, FAB, guard de onboarding).

- **Dado** que `GET /accounts` no trae ninguna cuenta `cash`, **cuando** se entra a cualquier ruta de `(app)`, **entonces** redirige a `/empezar` (§15.3 del contrato: es la señal, no hay flag).
- **Dado** que existe un periodo con `status: "open"` y `endsOn` anterior a hoy en la zona del usuario, **entonces** el banner de quincena vencida aparece **en todas las pantallas**, incluidas las de captura.
- **Dado** varias quincenas vencidas, **entonces** el banner ofrece cerrar **solo la más antigua**. Los cierres van en orden y la API rechaza el desordenado (§15.2).
- **Dado** el banner de quincena vencida, **entonces** **no bloquea nada**: ni capturar, ni asignar, ni navegar.
- **Dado** `unbudgetedTransactions` con elementos, **entonces** su banner aparece en Inicio y Movimientos, **y en ninguna otra pantalla**.
- **Dado** `unbudgetedTransactions: []`, **entonces** el banner no se pinta. No hay estado vacío para eso.
- **Dado** el FAB, **entonces** navega a `/capturar/gasto` directo, sin selector intermedio.

---

### U15 — `/empezar`

**Depende de:** U14. **Sin tests propios.**

- **Dado** un usuario sin cuentas `cash`, **cuando** entra a la app, **entonces** llega a `/empezar`.
- **Dado** el formulario, **entonces** los 7 sobres sugeridos y "Sueldo" aparecen con checkbox **preseleccionado** (§10.3 del contrato).
- **Dado** que se confirma, **entonces** las llamadas salen en el orden de §16.1 del contrato, y los saldos iniciales van en **una sola** llamada a `opening-balances` con `Idempotency-Key`.
- **Dado** que se completa, **entonces** **no** crea la primera quincena ni asigna presupuesto. Eso pasa en las pantallas normales.

---

### U16 — `/` Inicio

**Depende de:** U14.

- **Dado** cualquier carga, **entonces** usa **una sola** llamada a `GET /insights/dashboard`.
- **Dado** `period === null`, **entonces** se muestra "No hay quincena abierta" con acción de crearla. **No se pinta como error** — `NO_CURRENT_PERIOD` es un `404` en el contrato y una acción pendiente para el usuario.
- **Dado** `unassignedCents === "0"` **y** algún sobre con `hasBudget: true`, **entonces** "Todo repartido", tono **éxito**.
- **Dado** `unassignedCents === "0"` **y** ningún sobre con `hasBudget: true`, **entonces** "Aún no repartes nada", tono pendiente. **La condición es el conteo de `hasBudget`, nunca el monto.**
- **Dado** `unassignedCents` negativo, **entonces** se pinta en el color de sobregiro con el texto "Te pasaste por $X".

---

### U17 — `/sobres` y `/sobres/[categoryId]`

**Depende de:** U14.

- **Dado** que el usuario fija un monto en un sobre, **entonces** se llama `PUT /periods/{id}/allocations/{categoryId}` con `targetAssignedCents`. **Nunca el `POST` de delta.**
- **Dado** `status: "no_budget"`, **entonces** se pinta "Sin presupuesto" en gris y **sin monto de disponible**, visiblemente distinto de `depleted`.
- **Dado** `status: "overspent"` con `spentCents: "0"`, **entonces** la tarjeta incluye "Es un gasto de la quincena pasada, ya cerrada. Se cubre con esta." **En la tarjeta, no en un tooltip.**
- **Dado** un sobre en sobregiro, **cuando** se ofrece cubrirlo, **entonces** los orígenes son los sobres del mismo periodo con `availableCents > 0`, ordenados descendente, vía `POST /periods/{id}/allocations/move`.
- **Dado** `409 CATEGORY_HAS_ALLOCATIONS` al archivar, **entonces** el mensaje dice que quite primero el presupuesto de la quincena actual.

---

### U18 — `/capturar/*`

**Depende de:** U14. **Es la unidad crítica.** **Tests:** `expense-form.test.ts`, `idempotency.test.ts`, `unauthorized-recovery.test.ts`.

- **Dado** que se abre el formulario, **entonces** la fecha por default es `todayInTimeZone(timezone de /me)`, no la del navegador.
- **Dado** que la fecha capturada cae en una quincena cerrada, **entonces** se avisa **antes** de guardar. No después (§18 del contrato).
- **Dado** `budgetImpact.status === "compensated"`, **entonces** se muestra qué sobre se ajustó y por cuánto, con el nombre que viene en `compensations[]`.
- **Dado** `"uncompensated"`, **entonces** se avisa y se ofrece crear la quincena actual.
- **Dado** `"no_period"`, **entonces** se avisa que quedará en pendientes por asignar.
- **Dado** `"in_open_period"`, **entonces** no se muestra ningún mensaje de impacto.
- **Dado** un reparto entre N sobres, **entonces** el desglose se muestra **antes de guardar** con los montos ya calculados por `splitEvenly`, editables.
- **Dado** un gasto guardado, **entonces** se invalidan exactamente las keys de la matriz. **No se pinta optimista**: `budgetImpact` solo se conoce con la respuesta.
- **Dado** "Pago de tarjeta", **entonces** llama a `/transactions/transfers`. **Llamar a `/expenses` aquí cuenta el gasto dos veces y descuadra el presupuesto entero.**

---

### U19 — `/movimientos` y `/movimientos/[transactionId]`

**Depende de:** U14.

- **Dado** una transacción con `reversedByTransactionId !== null`, **entonces** se pinta tachada con la etiqueta "Corregida".
- **Dado** una con `reversesTransactionId !== null`, **entonces** lleva la etiqueta "Corrección".
- **Dado** el historial, **entonces** **no existe** ningún filtro para ocultar corregidas. Ambos registros quedan visibles.
- **Dado** que se corrige una transacción, **entonces** el `POST .../reversal` va con `Idempotency-Key` y **sin `bookedAt`**. Mandarlo devuelve `422 REVERSAL_DATE_LOCKED` si el original fue captura tardía.
- **Dado** `409 ALREADY_REVERSED`, **entonces** el mensaje es "Este movimiento ya está corregido".
- **Dado** los `movements`, **entonces** se traducen a lenguaje de usuario ("Salió de TDC BBVA", "Se cargó a Comida") aplicando `formatBalance` con `accountKind`. **Las palabras "movimiento contable", "asiento" y "ledger" no aparecen.**
- **Dado** la paginación, **entonces** usa `useInfiniteQuery` con el `nextCursor` tal cual, sin parsearlo ni persistirlo.

---

### U20 — `/cuentas` y `/cuentas/[accountId]`

**Depende de:** U14.

- **Dado** una cuenta con `balanceCents === "0"` **y ledger vacío**, **entonces** se ofrece "Capturar saldo inicial".
- **Dado** una cuenta con `balanceCents === "0"` **y ledger no vacío**, **entonces** se pinta "$0.00" sin mensaje. **La condición incluye el ledger, no solo el monto.**
- **Dado** `409 ACCOUNT_NOT_EMPTY` al archivar, **entonces** el mensaje pide saldar o transferir primero.
- **Dado** una cuenta `credit` con saldo `"-250000"`, **entonces** se pinta "$2,500.00 debes" en la lista, en el detalle y en cualquier otro lugar.

---

### U21 — `/quincenas` y el cierre

**Depende de:** U17.

- **Dado** varias quincenas vencidas sin cerrar, **entonces** se listan en orden cronológico y **solo la más antigua ofrece "Cerrar"**.
- **Dado** la pantalla de cierre, **entonces** se alimenta de `GET /periods/{id}/close-preview`, que no escribe nada.
- **Dado** `canClose === false`, **entonces** el botón se deshabilita y se muestran los `blockers` traducidos.
- **Dado** `NEXT_PERIOD_REQUIRED`, **entonces** se ofrece crear el periodo siguiente ahí mismo y reintentar.
- **Dado** la pantalla de cierre, **entonces** incluye, visible y prominente: "Al cerrar, las asignaciones de esta quincena quedan congeladas para siempre." No hay reapertura en v1 (§15.1).
- **Dado** que se va a borrar un periodo cuyo rango contiene transacciones, **entonces** se avisa antes.
- **Dado** que se va a borrar una asignación cuya `note` pasa `isLateCaptureNote`, **entonces** la confirmación es **distinta** de la de una asignación normal, y enlaza a la transacción de origen cuando el id se pudo extraer.
- **Dado** el cierre, **entonces** **no** es optimista: se espera la respuesta. Es irreversible.

---

### U22 — `/recordatorios`

**Depende de:** U21.

- **Dado** plantillas con `isDue: true`, **entonces** aparecen arriba.
- **Dado** que se confirma una, **entonces** el formulario viene prellenado y el `POST .../confirm` lleva `Idempotency-Key`.
- **Dado** que se confirma con un monto distinto al estimado, **entonces** el estimado de la plantilla **no cambia**.
- **Dado** la pantalla, **entonces** existe crear (`POST`) pero **no** editar ni borrar plantillas.

---

### U23 — `/mas`

**Depende de:** U22.

- **Dado** que se cambia la zona horaria, **entonces** se avisa antes de guardar que eso cambia en qué quincena caen los gastos capturados.
- **Dado** `400 INVALID_TIMEZONE`, **entonces** se muestra el mensaje del catálogo.

---

## 5. Tests requeridos antes de implementar

**Estos tests los escribe otra sesión, contra las formas fijadas de §6, y existen antes de que este task arranque.** El agente que implementa **no los escribe y no los modifica**. Es lo que impide que se califique a sí mismo.

### 5.1 Regla sobre fechas — ya nos mordió dos veces en el backend

⛔ **Ningún test hardcodea "hoy", "ayer", ni una fecha de vencimiento.** Un test que congele una fecha pasa hoy y falla en tres semanas, y el fallo parece un bug del código.

Cualquier test que dependa de la fecha actual la calcula **en tiempo de ejecución**, o congela el reloj explícitamente con `vi.setSystemTime()` y lo restaura en el `afterEach`. Las fechas relativas se derivan (`hoy − 1 día`), nunca se escriben.

### 5.2 Archivos de test y qué cubre cada uno

| Archivo | Cubre |
|---|---|
| `money.test.ts` | `formatMoney`: negativos, cero, > 2^53 exacto, default `MXN`, `USD` vía `Intl`, moneda inválida → `MXN` sin lanzar. `parseAmountInput`: entradas con comas, símbolo, decimales incompletos, basura → `null` |
| `sign-rule.test.ts` | `formatBalance` para los 5 `kind`. **`credit` con `"-250000"` → `"$2,500.00 debes"` en todos los contextos.** Que la firma no admita nombre ni pantalla |
| `split.test.ts` | `splitEvenly`: `("10000",3) → ["3334","3333","3333"]`. Invariante `sum === total` sobre muchos casos. Residuo nunca descartado |
| `dates.test.ts` | 23:00 en CDMX → día en curso. 00:30 → mismo día. `formatInstant` UTC → local. **Que `toISOString()` no aparezca en el archivo fuente.** Zona siempre por parámetro |
| `envelopes.test.ts` | Los 4 estados. `hasBudget: false` gana antes que cualquier monto. `assigned "0"` + `hasBudget: true` + `available "0"` → `depleted`. `overspent` con `spent "0"` |
| `idempotency.test.ts` | **Dos envíos del mismo formulario mandan la misma llave.** Llave nueva solo tras `2xx`. Se conserva tras error de red, `409` y `401` |
| `errors.test.ts` | Cada `code` del §7.2 tiene texto en español. Código desconocido → fallback sin lanzar. El `message` del servidor nunca se pinta |
| `unauthorized-recovery.test.ts` | Tras `401` + re-login, valores y llave del borrador se rehidratan intactos |
| `draft-store.test.ts` | Ciclo del borrador: crear, persistir, rehidratar, borrar solo con `2xx`. Que use `sessionStorage` |
| `late-capture.test.ts` | Detección por prefijo. Nota malformada → `true` con id `null`. Guión ASCII → `false`. `note: null` → `false` |
| `allowlist.test.ts` | Ruta permitida pasa. Ruta ausente → `404` sin llamar a la API. `:id` no cruza `/`. Método equivocado → `404` |
| `bff-forward.test.ts` | Respuesta HTML o vacía → `500 INTERNAL_ERROR` con forma de contrato. Solo se reenvían `content-type` e `idempotency-key`. `IN_FLIGHT` reintenta 3 veces y a la cuarta sube |
| `invalidation.test.ts` | Cada mutación invalida exactamente las keys declaradas. **Cerrar y crear periodo incluyen `openPeriods`** |
| `query-keys.test.ts` | Las keys son estables y ninguna contiene un cursor |
| `overdue-periods.test.ts` | Con varias vencidas, solo la más antigua es cerrable. Fechas calculadas en runtime |
| `i18n.test.ts` | Cada `kind`, `status`, `rolloverType` y `budgetImpact` tiene traducción. Ningún término del glosario aparece fuera de `es.ts` |
| `session-policy.test.ts` | `readSessionState`: cookie ausente / válida / expirada / malformada → nunca lanza. `sessionActionFor`: `expired` → `refresh`, **no** `redirect-login`. `none` en ruta protegida → `redirect-login` conservando `next`. `now` siempre por parámetro |
| `api-client.test.ts` | **Agregado en la sesión de tests — U7 lo pedía en su propio texto y §5.2 no lo listaba; era omisión, no decisión.** Cualquier respuesta no-2xx → `ApiError` con `code`/`statusCode`/`details`. `200` y `201` tratados idénticamente. El body nunca incluye `userId` |

**Cero tests de render, snapshot o e2e.** Son caros, frágiles y no atrapan lo que rompe.

---

## 6. Formas fijadas

**Nombres exactos. No se renombran, no se reubican, no se cambia el orden de los parámetros.** Los tests ya están escritos contra estas firmas; renombrar cualquiera rompe la condición de paro y el arreglo **no** es tocar el test.

### 6.1 Funciones

```ts
// lib/domain/money.ts
formatMoney(cents: string, currency?: string): string   // default 'MXN'; símbolo vía Intl, nunca literal
formatBalance(cents: string, kind: AccountKind): { amount: string; suffix: string | null }
splitEvenly(totalCents: string, parts: number): string[]
parseAmountInput(text: string): string | null

// lib/domain/dates.ts
todayInTimeZone(timeZone: string, now?: Date): string
formatInstant(iso: string, timeZone: string): string

// lib/domain/envelopes.ts
deriveEnvelopeStatus(p: {
  assignedCents: string; spentCents: string;
  availableCents: string; hasBudget: boolean;
}): EnvelopeStatus

// lib/domain/late-capture.ts
isLateCaptureNote(note: string | null): boolean
extractTransactionIdFromNote(note: string | null): string | null

// lib/domain/periods.ts
// NUEVO — no estaba en el árbol de archivos de ARCHITECTURE-front.md §15.
// selectClosablePeriod es lógica pura (qué periodo vencido se ofrece cerrar);
// vive junto a las otras primitivas de dominio por la misma razón que ellas: es testeable sin red y sin UI.
selectClosablePeriod(
  openPeriods: readonly { id: string; endsOn: string; status: PeriodStatus }[],
  today: string,
): { id: string; endsOn: string; status: PeriodStatus } | null

// lib/supabase/session-policy.ts
type SessionState = 'none' | 'valid' | 'expired'
type SessionAction = 'allow' | 'refresh' | 'redirect-login'
readSessionState(cookies: ReadonlyMap<string, string>, now: Date): SessionState
sessionActionFor(state: SessionState, pathname: string): SessionAction

// lib/i18n/errors.ts
errorMessageFor(code: string): string

// lib/query/invalidation.ts
invalidationFor(mutation: MutationName): readonly QueryKey[]

// lib/bff/allowlist.ts
// NUEVO — U9 solo fijaba el tipo AllowedRoute y la constante ALLOWLIST (§6.2);
// la función de emparejamiento no tenía firma. table es opcional y cae en ALLOWLIST por default —
// existe como parámetro solo para que el test pueda ejercitar la lógica de matching con tablas pequeñas controladas.
isAllowedRoute(method: HttpMethod, path: string, table?: readonly AllowedRoute[]): boolean

// lib/bff/forward.ts
// NUEVO — contractError ya aparecía nombrada en ARCHITECTURE §4.2 como snippet; forwardToApi no tenía firma.
// fetchImpl inyectable es la razón por la que esto es testeable sin red real.
// `headers` son los headers crudos del navegador; forwardToApi filtra a la lista
// blanca (content-type) antes de reenviar — idempotencyKey se maneja aparte porque
// además se valida como UUID. Sin esto, "solo se reenvían content-type e
// idempotency-key" (ARCHITECTURE §4.1) no era verificable con una llamada pura.
contractError(statusCode: number, code: string, path: string): { statusCode: number; code: string; message: string; timestamp: string; path: string }
forwardToApi(
  params: { method: HttpMethod; path: string; body?: unknown; accessToken: string; idempotencyKey?: string; headers?: Record<string, string> },
  fetchImpl?: typeof fetch,
): Promise<{ status: number; body: unknown }>

// lib/api/client.ts
// NUEVO — U7 no fijaba el nombre del cliente HTTP. Mismo patrón de fetchImpl inyectable que forwardToApi.
apiRequest<T>(
  params: { method: HttpMethod; path: string; body?: unknown; accessToken: string; idempotencyKey?: string },
  fetchImpl?: typeof fetch,
): Promise<T>
```

### 6.2 Constantes y clases

```ts
LATE_CAPTURE_NOTE_PREFIX = 'Ajuste por captura tardía'   // raya larga U+2014 en la nota real
class ApiError { code: string; statusCode: number; details?: {field: string; constraint: string}[] }
ALLOWLIST: readonly AllowedRoute[]
qk  // el objeto de query keys, exactamente con las llaves de §5.1 de la arquitectura
```

### 6.3 Rutas

Las de §2 de `ARCHITECTURE-front.md`, literales. `/capturar/gasto` no es `/capture/expense` ni `/gastos/nuevo`.

### 6.4 Nombres en español de la UI

Los de la Parte 1 de `SCREENS-front.md`. "Sobre", no "Categoría". "Quincena", no "Periodo". "Por asignar", no "Disponible".

---

## 7. Qué NO debe hacer el agente

| Prohibición | Por qué |
|---|---|
| **Modificar cualquier archivo de test** | Los escribió otra sesión para que el implementador no se califique a sí mismo. Un test que falla significa código mal, siempre |
| **Crear un archivo de test nuevo** | Aunque el diff quede limpio, `git status --porcelain` y el conteo de `EXPECTED.json` lo detectan. Si falta cobertura, detente y pregunta |
| **Modificar `scripts/verify-suite.mjs` o `tests/EXPECTED.json`** | Son la puerta, no el código bajo prueba. Tocarlos es apagar la alarma |
| **Usar `it.skip`, `describe.skip` o `it.todo`** | `verify:suite` falla con cualquiera. Un test saltado es un test que no existe |
| **Concatenar un `"$"` literal a un monto** | El símbolo sale de `Intl` con la moneda del recurso. Un `$` a mano miente en cuanto aparece una cuenta en otra moneda |
| **Sumar montos de monedas distintas** | No hay tipo de cambio (§15.4). Un total consolidado sería un número inventado |
| **Poner lógica de decisión en `lib/supabase/middleware.ts`** | Esa lógica va en `session-policy.ts`, donde sí tiene tests |
| **Modificar `API-CONTRACT.md`** | Es solo lectura y es la fuente de verdad |
| **Inventar un endpoint o un campo** | Si no está en el contrato, no existe. Detente y pregunta |
| **Proponer cambios al backend** | Está cerrado y desplegado. Anótalo en "Huecos detectados" y pregunta |
| **Usar `Number` para montos** | Enteros de 64 bits: `Number` los corrompe arriba de 2^53, en silencio (§4.1 del contrato) |
| **Usar `toISOString().slice(0,10)` para `bookedAt`** | Es UTC. A las 23:00 en CDMX manda el día siguiente y el gasto cae en la quincena equivocada |
| **Leer la zona horaria del navegador** | Sale de `GET /me`. El contrato lo dice explícitamente |
| **Generar una llave de idempotencia por intento HTTP** | Duplica transacciones. Una llave por **intención**, reusada en todos los reintentos hasta `2xx` |
| **Guardar borradores en `localStorage`** | Un borrador viejo trae una llave de idempotencia inútil |
| **Programar contra `error.message`** | Puede cambiar de redacción sin aviso. `code` es contrato |
| **Mostrar `IDEMPOTENCY_IN_FLIGHT` al usuario** | No es un error del usuario: es reintento automático a 1s |
| **Pintar `NO_CURRENT_PERIOD` como error** | Es una acción pendiente, no una falla |
| **Usar el `POST` de delta en la UI de sobres** | El `PUT` es atómico y seguro con dos pestañas abiertas (§12.2 del contrato) |
| **Mandar `bookedAt` en una reversa** | `422 REVERSAL_DATE_LOCKED` si el original fue captura tardía. Dejaría el ajuste huérfano |
| **Registrar un pago de tarjeta como gasto** | Lo cuenta dos veces y descuadra el presupuesto. Es una transferencia |
| **Mandar `userId` en cualquier request** | El backend lo saca del token. Un `userId` da `400` |
| **Pasar el `access_token` al cliente** | Es la razón de existir del BFF |
| **Persistir cursores o parsearlos** | Son opacos (§6.1 del contrato) |
| **`invalidateQueries()` sin argumentos** | La invalidación es declarada, no un martillo |
| **Optimistic UI en transacciones o cierres** | `budgetImpact` solo se conoce con la respuesta; el cierre es irreversible |
| **Bloquear la captura de un gasto con cualquier aviso** | Es el caso de uso central y la API no lo bloquea |
| **Escribir un término del glosario fuera de `lib/i18n/es.ts`** | Una sola capa de traducción (§18 del contrato) |
| **Mostrar `movement`, `entry`, `ledger`, `system` o un signo crudo** | §17 del contrato |
| **Escribir tests de render o snapshot** | Fuera de alcance por decisión explícita |
| **Agregar una librería no listada en U0** | Detente y pregunta. Cada dependencia es una decisión |
| **Implementar algo de la lista de §2.2** | Está fuera de alcance a propósito |

---

## 8. Acciones humanas requeridas, en orden

Ningún agente puede hacer estas. **Las que están antes de U8b bloquean el arranque de esa unidad.**

1. **Crear el proyecto de Supabase** (o reusar el del backend) y obtener `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. **Configurar el proveedor de auth** y crear los 3 usuarios reales.
3. **Poner las variables de entorno** en `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   API_BASE_URL=https://<host>/api/v1
   ```
   `API_BASE_URL` **sin** `NEXT_PUBLIC_`: solo la usa el servidor.
4. **Verificar que la API responde** con un token real:
   `curl -H "Authorization: Bearer <token>" $API_BASE_URL/me`
5. **Confirmar el `timezone` del perfil** en `GET /me` antes de probar U18. Si está mal, `PATCH /me`.
6. **Smoke test contra la API desplegada** — el equivalente del smoke del backend. **Es la única prueba de que el front habla con la API real y no solo con la suite**, porque los tests son de lógica pura y ninguno sale a la red.

   Se corre a mano, con sesión iniciada, en este orden. Cada paso se verifica **en la pantalla**, no en el código:

   | # | Acción en la app | Qué confirmar |
   |---|---|---|
   | 6.1 | Iniciar sesión y abrir Inicio | Carga sin `401`; los saldos coinciden con `GET /insights/dashboard` en `curl` |
   | 6.2 | Capturar un gasto de hoy | `201`; el sobre baja el monto; sin mensaje de impacto |
   | 6.3 | Capturar un gasto con fecha de una quincena **cerrada** | Avisa **antes** de guardar; al guardar muestra "se descontó de {sobre} en la quincena actual" |
   | 6.4 | Apagar la red, guardar un gasto, prenderla, reintentar | Se crea **una sola** transacción. Si aparecen dos, la llave de idempotencia está mal y **el task no está terminado** |
   | 6.5 | Corregir esa transacción | Ambas visibles; la original tachada como "Corregida" |
   | 6.6 | Fijar un monto en un sobre desde dos pestañas a la vez | Queda en el valor fijado, no en la suma |
   | 6.7 | Abrir `/capturar/gasto`, llenar el formulario, invalidar la sesión, reintentar | Tras el re-login, los valores y la llave siguen ahí |
   | 6.8 | Con una quincena vencida sin cerrar | El banner aparece en las 4 tabs y ofrece cerrar **solo la más antigua** |
   | 6.9 | Cerrar esa quincena | `close-preview` coincide con el resultado; los rollovers llegan con `source: "rollover"` |

   **6.4 y 6.7 son los que importan.** Son los dos requisitos del §18 que ninguna suite de lógica pura puede probar de verdad, porque dependen de la red y del ciclo real de sesión.

7. **Revisar lo visual** al terminar cada unidad de pantalla (U15–U23). No es condición de paro y el agente no lo evalúa.
8. **Configurar el proyecto en Vercel** con las mismas variables antes del primer despliegue.
9. **Decidir la dirección visual** (paleta, tipografías) cuando el humano quiera. Está en "Pendiente" y no bloquea nada.

---

## 9. Estructura de archivos esperada

La de §15 de `ARCHITECTURE-front.md`, literal. Resumen de lo que no se mueve:

```
src/
├─ app/                    rutas de §2 de la arquitectura
├─ features/<dominio>/     components/ hooks/ services/ schemas/ stores/
├─ components/             ui/ money/ states/ layout/
├─ lib/
│  ├─ api/                 client.ts, errors.ts, server-api.ts
│  ├─ bff/                 allowlist.ts, forward.ts
│  ├─ domain/              money.ts, dates.ts, envelopes.ts, late-capture.ts
│  ├─ i18n/                es.ts, errors.ts
│  ├─ query/               invalidation.ts
│  ├─ query-keys.ts
│  └─ supabase/            client.ts, server.ts, middleware.ts
└─ types/api.ts
```

**Organizado por dominio, no por tipo de archivo.** El árbol dice qué hace el producto. `components/ui` guarda solo piezas sin conocimiento de dominio: si un componente ahí menciona "sobre" o "quincena", está en el lugar equivocado.

---

## 10. Recordatorio final

El §18 del contrato son 19 puntos y **es el criterio de completitud funcional de este task**. Antes de declarar terminado, recórrelo entero y verifica cada uno contra el código.

Y de nuevo, porque es la regla que más importa: **ante cualquier decisión no documentada, detente y pregunta.**
