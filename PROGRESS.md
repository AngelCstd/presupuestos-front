# PROGRESS.md

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
