# PROGRESS-UX.md — Registro de avance del Loop de UX

> Registro acumulativo de pantallas cerradas, compuertas de calidad, decisiones y aprendizajes.

---

## 2026-10-21 — Pantalla 1: Inicio (`/`) ✅

### 1. Compuerta de verificación (G1–G9)

| # | Verificación | Criterio | Resultado |
|---|---|---|---|
| **G1** | `tsc --noEmit` | Cero errores | ✅ Limpio |
| **G2** | Suite Vitest existente | 207/207 en verde, `git diff --stat tests/` vacío | ✅ 207 tests pasan; diff en `tests/` vacío |
| **G3** | Build de producción | `pnpm build` compila | ✅ Compilación exitosa (Next.js 15 App Router) |
| **G4** | Ausencia de hex sueltos | `grep -rE '#[0-9a-fA-F]{3,8}'` en `src/` | ✅ Cero coincidencias |
| **G5** | Strings fuera de i18n | Cero strings literales en componentes tocados | ✅ Cero en `InicioView.tsx` |
| **G6** | Vocabulario contable prohibido | Cero en textos de usuario | ✅ Cero |
| **G7** | Llamadas de red | Solo `GET /insights/dashboard` | ✅ 1 sola consulta vía `useDashboard()` |
| **G8** | Capturas de pantalla | 360px, 390px y 768px en `ux/inicio/` | ✅ Generadas y verificadas visualmente |
| **G9** | Imports válidos | Todos registrados en `INVENTARIO.md` | ✅ Cumple |

---

### 2. Qué cambió y por qué

* **Tope de "Por asignar" en $0.00 y jerarquía de Tarjeta Héroe:**
  * Si `dinero real < 0`: Muestra *"Sin dinero libre para repartir"*, indicando el exceso de deuda de tarjeta sobre el efectivo con explicación factual y enlace a `/cuentas`. "Por asignar" queda clampeado en `$0.00`.
  * Si hay sobregiros en sobres pero dinero real positivo: Muestra *"Sobres por ajustar"* con el total del déficit a cubrir y botón directo `[Revisar sobres]`. "Por asignar" queda en `$0.00`.
  * Si `unassignedCents > 0`: Muestra el monto libre para repartir con acción `[Repartir]`.
  * Si `unassignedCents === 0`: Se preserva la distinción entre *"Todo repartido"* (si hay presupuestos asignados) y *"Aún no repartes nada"* (si aún no se asigna nada).
* **Eliminación del bloque "Últimos movimientos":**
  * Se retiró de la vista principal para centrar el espacio vertical en móvil en la salud de sobres y saldos. El historial vive en su propio tab `/movimientos`.
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

### 4. Qué aprendimos del repo (Documentación desactualizada)

1. **`tests/i18n.test.ts` audita comentarios en archivos fuente:**
   * La suite busca términos del glosario leyendo el archivo como texto plano con `readSourceFile(file).includes(term)`.
   * Un comentario como `// Sobres en sobregiro` en un archivo `.tsx` fuera de `lib/i18n/es.ts` hace tronar el test. Los comentarios en código no deben contener los 7 términos de glosario protegidos.
2. **Divergencias en `SCREENS-front.md`:**
   * La tabla de la Parte 1 define `period` como `"Periodo"`, pero a partir de la línea 253 el propio documento sigue usando `"quincena"` en rutas (`/quincenas`) y textos de diálogo. El código fuente ya fue migrado a `/periodos` de forma consistente.
   * `bookedAt` y `description` faltan en `es.field` de `es.ts` (se agregaron para Inicio).
   * "Saldo inicial" sigue en la tabla de intenciones de `SCREENS-front.md` a pesar de haber sido retirado de `/capturar/otro`.
3. **Confirmación de captura (`BudgetImpactMessage`):**
   * En transacciones rutinarias en periodo abierto (`in_open_period`), `BudgetImpactMessage` devuelve `null`. Por tanto, la pantalla de confirmación de captura queda vacía con un botón "Listo".
   * Queda anotado como hallazgo prioritario para cuando se trabaje la pantalla 3 (`/capturar/gasto`).

---

### 5. Qué sigue en la cola

* **Siguiente elemento:** **Tarjeta de sobre** (componente `CategoryCard` / `EnvelopeCard`).
* **Objetivo:** Reutilizable en Inicio y en `/sobres`, con barra de progreso, soporte visual no dependiente exclusivamente del color para los 4 estados (`no_budget`, `available`, `depleted`, `overspent`), y explicación legible del caso de sobregiro por captura tardía con spentCents en 0.
