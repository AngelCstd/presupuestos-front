# CLAUDE.md

Contexto permanente del proyecto. Se lee al inicio de cada sesión.

## Qué es esto

Frontend de una app personal de presupuesto por sobres. Next.js (App Router) +
TypeScript, desplegado en Vercel.

**El backend ya está terminado, desplegado y verificado contra producción.**
Vive en otro repositorio y no se toca desde aquí. Su contrato completo está en
`API-CONTRACT.md`.

## Fuentes de verdad — jerarquía

1. **`API-CONTRACT.md`** — el contrato de la API. **Solo lectura, nunca se
   modifica.** Si algo que necesitas no está ahí, o encuentras una
   contradicción, **detente y pregunta**. No inventes endpoints ni campos.
2. **`ARCHITECTURE-front.md`** — decisiones de arquitectura del frontend.
   **Solo lectura.** Mismo criterio: si falta algo, se pregunta.
3. **`SCREENS-front.md`** — mapa de pantallas, glosario en español y el
   catálogo de estados vacíos.
4. **`TASK-front.md`** — la tarea activa: unidades, grafo de dependencias,
   condición de paro, prohibiciones.
5. **`PROGRESS.md`** — estado del trabajo. Se actualiza al final de cada sesión.

Si algo de este archivo contradice al `API-CONTRACT.md`, gana el contrato.

## Stack

- **Framework:** Next.js, App Router
- **Lenguaje:** TypeScript en modo `strict`, con `noUncheckedIndexedAccess`
- **Estado servidor:** TanStack Query, con hidratación desde Server Components
- **Estado cliente:** Zustand, **solo** para borradores de formulario
- **Estilos:** Tailwind
- **Tests:** Vitest
- **Gestor de paquetes:** `pnpm`

<!-- TODO Luis: completa las versiones exactas -->
- Node: `v__`
- Next.js: `__`
- pnpm: `__`

## Comandos

```bash
pnpm dev              # desarrollo
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint, cero warnings
pnpm test -- --run    # vitest
pnpm build            # next build
pnpm verify:tests     # los tests no fueron alterados (git diff + status + conteo)
pnpm verify:suite     # cero skipped, cero todo
```

## Reglas duras — no negociables

- **Nunca modificar un archivo de test.** Los escribe otra sesión, contra las
  formas fijadas, precisamente para que quien implementa no se califique a sí
  mismo. Un test que falla significa **código mal**, siempre. Si de verdad crees
  que un test está equivocado, detente y pregunta — no lo edites.
- **Nunca tocar `tests/EXPECTED.json` ni los scripts de verificación.** Son la
  puerta; editarlos es abrirse la puerta uno mismo.
- **Nunca modificar `API-CONTRACT.md` ni `ARCHITECTURE-front.md`.**
- **Nunca inventar un endpoint o un campo.** Si no está en el contrato, no
  existe. Detente y pregunta.
- **Nunca proponer cambios al backend.** Está cerrado y desplegado. Anótalo en
  "Huecos detectados en la API" y pregunta.
- **Nunca agregar una dependencia** que no esté en U0 del `TASK-front.md` sin
  preguntar. Cada librería es una decisión.
- **Ante cualquier decisión no documentada, detente y pregunta.** No elijas.

## Trampas de este proyecto

- **Los montos son enteros de 64 bits en centavos, como string.** `Number` los
  corrompe arriba de 2^53, en silencio. Toda aritmética de dinero usa `BigInt`.
  Ningún estado, ningún valor de formulario y ningún cálculo vive en unidades:
  la división entre 100 ocurre **solo** al pintar, en `formatMoney`.
- **`toISOString().slice(0,10)` es el bug.** Devuelve UTC. A las 23:00 en CDMX
  manda el día siguiente y el gasto cae en la quincena equivocada. `bookedAt`
  se resuelve con `Intl.DateTimeFormat('en-CA', { timeZone })`.
- **La zona horaria sale de `GET /me`, nunca del navegador.**
- **La llave de idempotencia es una por *intención del usuario*, no por intento
  HTTP.** Vive en el borrador, se reusa en todos los reintentos, y se limpia
  solo con `2xx`. Generar una por `fetch` duplica transacciones.
- **Los borradores van en `sessionStorage`, no en `localStorage`.** Un borrador
  de hace tres días trae una llave de idempotencia inútil.
- **Se programa contra `error.code`, nunca contra `error.message`.** El mensaje
  puede cambiar de redacción sin aviso; el código es contrato.
- **El signo de un monto depende exclusivamente del `kind`.** Nunca del nombre
  de la cuenta ni de la pantalla. Si `formatBalance` alguna vez necesita ese
  parámetro, el diseño se rompió.
- **`NO_CURRENT_PERIOD` no es un error**, es una acción pendiente.
- **El `access_token` nunca cruza al cliente.** Es la razón de existir del BFF.

## Convenciones

- **Organización por dominio, no por tipo de archivo.** El árbol dice qué hace
  el producto. `components/ui` guarda solo piezas sin conocimiento de dominio:
  si un componente ahí menciona "sobre" o "quincena", está en el lugar
  equivocado.
- **Una sola capa de traducción al español**, en `lib/i18n/es.ts`. Ningún
  término del glosario se escribe fuera de ahí.
- **La invalidación de caché es declarada**, nunca `invalidateQueries()` sin
  argumentos.
- **Cero tests de render, snapshot o e2e.** Lo visual lo revisa el humano.

## Cómo trabajar

- Cuando falte una decisión, **pregunta**. No elijas.
- Cambios chicos y verificables antes que refactors grandes.
- Actualiza `PROGRESS.md` antes de terminar la sesión: qué quedó hecho, qué
  falló, y qué aprendiste que no estaba documentado — trampas del entorno,
  comportamientos de Next o de las librerías que te sorprendieron. Esa última
  parte es la más valiosa: en el backend, varios de los recordatorios de arriba
  salieron de ahí.
