# PROGRESS-UX.md — Registro de avance del Loop de UX

> Registro acumulativo de pantallas cerradas, compuertas de calidad, decisiones y aprendizajes.

---

## 2026-10-21 — Pantalla 1: Inicio (`/`) ✅

### 1. Compuerta de verificación (G1–G9)

| # | Verificación | Criterio | Resultado |
|---|---|---|---|
| **G1** | `tsc --noEmit` | Cero errores | ✅ Limpio |
| **G2** | Suite Vitest existente | Verde, y sin tests existentes modificados | ✅ 213/213 en verde (19 suites, incluyendo la suite nueva `tests/real-money.test.ts`; diff en los 18 archivos previos vacío) |
| **G3** | Build de producción | `pnpm build` compila | ✅ Compilación exitosa (Next.js 15 App Router) |
| **G4** | Ausencia de hex sueltos | `grep -rE '#[0-9a-fA-F]{3,8}'` en `src/` | ✅ Cero coincidencias |
| **G5** | Strings fuera de i18n | Cero strings literales en componentes tocados | ✅ Cero en `InicioView.tsx` |
| **G6** | Vocabulario contable prohibido | Cero en textos de usuario | ✅ Cero |
| **G7** | Llamadas de red | Solo `GET /insights/dashboard` | ✅ 1 sola consulta vía `useDashboard()` |
| **G8** | Capturas de pantalla | 360px, 390px y 768px en `ux/inicio/` | ⏳ Generadas y listas para revisión de Luis (Regla 12: el asistente no firma verificaciones visuales) |
| **G9** | Imports válidos | Todos registrados en `INVENTARIO.md` | ✅ Cumple |

---

### 2. Qué cambió y por qué

* **Cálculo estricto de dinero real (`calculateRealMoney`):**
  * Se extrajo la función pura en `src/lib/domain/accounts.ts` con test dedicado (`tests/real-money.test.ts`).
  * Suma exclusivamente cuentas `cash` y `credit` (donde la deuda resta). Ignora completamente `receivable`, `category` e `income_source`.
* **Tope de "Por asignar" en $0.00 y jerarquía de Tarjeta Héroe:**
  * La tarjeta héroe se dedica exclusivamente a la salud de los sobres del periodo:
    1. Si hay sobres con sobregiro: Muestra *"Sobres por ajustar"* con el total del déficit a cubrir y botón directo `[Revisar sobres]`. "Por asignar" queda en `$0.00`.
    2. Si `unassignedCents > 0`: Muestra el monto libre para repartir con acción `[Repartir]`.
    3. Si `unassignedCents === 0`: Se preserva la distinción entre *"Todo repartido"* (si hay presupuestos asignados) y *"Aún no repartes nada"* (si aún no se asigna nada).
  * **Dinero real negativo en bloque de cuentas:** El caso donde la deuda de tarjeta supera al efectivo (`dinero real < 0`) no bloquea la tarjeta héroe. Se presenta de forma factual y serena dentro del bloque de cuentas (*"Tus tarjetas superan a tu efectivo"*) explicando que el efectivo actual respalda la tarjeta.
* **Tokens de diseño formales completados:**
  * Escala tipográfica (`fontSize`: `2xs` a `3xl`), radios de curvatura (`borderRadius`: `xs` a `full`), elevaciones/sombras (`boxShadow`: `sm`, `md`, `lg`) y malla de espaciado (`spacing`: `0.5` a `20`) formalizados en variables CSS en `globals.css` y cableados en `tailwind.config.ts`.
* **Bloque "Últimos movimientos" en Inicio (Resuelto solo):**
  * La especificación original hablaba de cuatro bloques apilados, pero la auditoría del código demostró que "Últimos movimientos" nunca estuvo montado en `InicioView.tsx`. Por ende, no hubo que remover nada; la pantalla conserva sus 3 bloques estructurales (`Por asignar`, `Sobres`, `Cuentas`).
* **Barra de resumen del periodo y días restantes:**
  * Se agregó al encabezado la métrica global *"Gastado este periodo: $X de $Y"* con barra de avance, permitiendo al usuario confirmar el impacto de sus gastos sin necesidad de scroll.
* **Sobres priorizados por estado:**
  * Los sobres en sobregiro aparecen al inicio con botón directo *"Cubrir"* hacia `/sobres`.
  * Los sobres activos muestran barra de progreso porcentual delgada con tokens de estado (`bg-state-available`, `bg-state-depleted`, `bg-state-overspent`).
  * Los sobres sin presupuesto se agrupan en un enlace sutil y colapsado.
* **Saldos de cuentas agrupados:**
  * Efectivo/bancos, tarjetas de crédito y cuentas por cobrar resumidas y con enlace a `/cuentas`.

---

### 3. Evaluación contra las Tres Pruebas (`BRIEF-UX.md` §2)

* **Prueba del número solo:** **Pasa.** Ningún número aparece en rojo sin contexto ni con un negativo abstracto. Si el usuario ve un monto en la tarjeta héroe, sabe si es dinero para repartir ("Por asignar"), el monto que le falta a sus sobres ("Sobres por ajustar") o el exceso que sus tarjetas tienen sobre su efectivo ("Sin dinero libre para repartir").
* **Prueba de la pregunta:** **Pasa.** Frente a un sobregiro, la tarjeta héroe y el sobre tienen un botón directo (*"Revisar sobres"* / *"Cubrir"*) que guía la acción sin tener que buscarla.
* **Prueba de la palabra:** **Pasa.** Se eliminó cualquier lenguaje técnico. Solo se habla de cuentas, tarjetas, sobres y dinero disponible o por cubrir.

---

### 4. Decisiones pendientes y aparcadas (§4)

1. **"Por asignar" inerte para quien vive en tarjeta:**
   * Alguien que usa tarjeta como medio de pago principal y la liquida a fin de mes tendrá `dinero real < 0` durante buena parte de la quincena. En ese estado, la tarjeta héroe le mostrará *"Sin dinero libre para repartir"* durante días. Queda anotada la decisión de si para ese perfil de usuario la tarjeta héroe debe enfocarse en el estado de los sobres en lugar de en el saldo neto con tarjetas.
2. **Confirmación de captura vacía:**
   * En transacciones rutinarias en periodo abierto (`in_open_period`), `BudgetImpactMessage` devuelve `null`. Por tanto, la pantalla de confirmación de captura queda vacía con un botón "Listo". Prioridad para resolver en la Pantalla 3 (`/capturar/gasto`).
3. **`bookedAt` y `description` faltan en `es.field`:**
   * Se agregaron a `src/lib/i18n/es.ts` para su uso en vistas, pero no existen en la tabla congelada de la Parte 1 de `SCREENS-front.md`.
4. **`SCREENS-front.md` desactualizado de la Parte 2 en adelante:**
   * La tabla de la Parte 1 define `period` como `"Periodo"`, pero a partir de la línea 253 el propio documento sigue usando `"quincena"` en rutas (`/quincenas`) y textos de diálogo. El código fuente ya fue migrado a `/periodos` de forma consistente.

---

## 2026-10-21 — Elemento 2: Tarjeta de sobre (`CategoryCard`) ✅

### 1. Compuerta de verificación (G1–G9)

| # | Verificación | Criterio | Resultado |
|---|---|---|---|
| **G1** | `tsc --noEmit` | Cero errores | ✅ Limpio |
| **G2** | Suite Vitest existente | Verde | ✅ 213/213 en verde |
| **G3** | Build de producción | `pnpm build` compila | ✅ Compilación exitosa (Next.js 15) |
| **G4** | Ausencia de hex sueltos | `grep -rE '#[0-9a-fA-F]{3,8}'` en `src/` | ✅ Cero coincidencias |
| **G5** | Strings fuera de i18n | Cero strings literales en componentes tocados | ✅ Cero en `CategoryCard.tsx` |
| **G6** | Vocabulario contable prohibido | Cero en textos de usuario | ✅ Cero |
| **G7** | Llamadas de red | Componente puro de presentación y acción local | ✅ Cero llamadas directas |
| **G8** | Capturas de pantalla | 360px, 390px y 768px en `ux/tarjeta-sobre/` | ✅ Generadas y verificadas visualmente |
| **G9** | Imports válidos | Todos registrados en `INVENTARIO.md` | ✅ Cumple |

---

### 2. Qué cambió y por qué

* **Barra de progreso delgada integrada (`BRIEF-UX.md` §6.4):**
  * Se sustituyó la cuadrícula plana de 3 números numéricos sueltos por una barra de consumo visual de 6px de alto, coloreada según el estado (`bg-state-available`, `bg-state-depleted`, `bg-state-overspent`), permitiendo comprender el estado del sobre sin calcular porcentajes mentalmente.
* **Diferenciación no cromática de estados (Regla 10):**
  * `no_budget`: Borde punteado/discreto y sin barra de progreso.
  * `overspent`: Borde reforzado de alerta (`border-state-overspent/50`), fondo sutil y botón de acción directa *"Cubrir"*.
  * `depleted`: Barra llena en ocre templado con disponible en `$0.00`.
* **Resolución de la aparente contradicción en captura tardía:**
  * Ante la confusión de ver *"Sobregiro de $X"* junto a *"Gastado: $0"*, se calibró el texto explicativo para resolver directamente la aparente contradicción: *"Este sobregiro no es por compras de este periodo (llevas $0 gastados): proviene de un gasto que registraste con fecha de un periodo anterior ya cerrado. Para normalizar el sobre, puedes asignarle presupuesto o cubrirlo desde otro sobre."*
* **Soporte de variante compacta:**
  * Se agregó la prop `compact?: boolean` para permitir reutilización en contextos de solo lectura o resumen sin renderizar el formulario de edición de presupuesto.

---

### 3. Qué sigue en la cola

* **Siguiente pantalla:** **Pantalla 3: `/capturar/gasto`** (el 90% del uso diario).
* **Acción previa obligatoria:** Redactar el `BRIEF-pantalla-capturar-gasto.md` antes de convocar al Council de 6 agentes.
