# PROGRESS.md

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
