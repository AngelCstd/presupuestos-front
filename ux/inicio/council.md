# Council Review — Inicio (`/`)

> Invocación: 6 agentes (Product Thinker, UX Expert, UI/Visual Expert, Critical Thinker, Technical Context Reviewer, Synthesizer).
> Justificación: Pantalla nuclear del producto, con máxima visibilidad diaria y riesgo crítico de interpretación errónea de montos.

---

## A. Diagnóstico del brief original

* **Aciertos:**
  * Delimita con precisión los tres momentos de uso (§3) y reconoce que la gran mayoría de las visitas son pasivas ("¿voy bien?" en 10 segundos).
  * Identifica la trampa central (§6.1): `unassignedCents < 0` mezcla dos realidades contables incompatibles (déficit de asignación en sobres vs. números rojos de liquidez real).
  * Plantea la computabilidad en cliente a partir de `accounts[]` y `categories[]` sin pedir cambios al backend.
* **Debilidades principales:**
  * **Falta de resolución en el caso crítico:** El brief detecta los dos tipos de números negativos, pero no fija la interacción ni el copy exacto para cada uno.
  * **Sobrecarga de "Últimos movimientos":** Proponer una segunda llamada (`GET /transactions?limit=5`) en la pantalla de aterrizaje compite contra el propósito de "¿voy bien?" y satura el espacio vertical en móvil; esa información ya tiene su propio tab (`/movimientos`).
  * **Ambigüedad en el cálculo de "Dinero real vs. Déficit":** Decir que "la diferencia es computable" no define cómo se le muestra al usuario sin forzarlo a hacer aritmética mental.
* **Decisiones que faltaban:**
  * Definir qué pasa con el número grande si hay sobregiro en sobres pero la liquidez en cuentas de efectivo es positiva.
  * Jerarquía clara: qué se muestra primero cuando todo va bien vs. cuando algo requiere atención inmediata.
* **Riesgos:**
  * Que el usuario sienta pánico injustificado al ver números rojos tras registrar compras normales con tarjeta de crédito.

---

## B. Mejoras propuestas

| Aspecto | Propuesta original | Propuesta mejorada | Justificación |
|---|---|---|---|
| **Tratamiento de "Por asignar" negativo** | `unassignedCents < 0` muestra *"Te pasaste por $X"* en rojo, intentando distinguir entre falta de liquidez y déficit de sobres en el mismo número. | **"Por asignar" nunca baja de $0.00.** Si hay déficit en sobres pero dinero real positivo, "Por asignar" se muestra en `$0.00` y se activa inmediatamente abajo un bloque de acción prioritario: *"Atención en X sobres"* con el monto faltante a cubrir y botón directo para reacomodar. Si las cuentas líquidas están en negativo (números rojos reales), se indica como aviso de saldo bancario en cuentas. | Pasa la **Prueba del número solo** y la **Prueba de la palabra** (`BRIEF-UX.md` §2). "Dinero por repartir" no puede ser conceptualmente menor a cero: o tienes dinero en la mesa para repartir, o no tienes nada ($0). El sobregiro es un problema del sobre, no de la mesa de asignación. |
| **Bloque "Últimos movimientos"** | Incluir los últimos 5 movimientos vía `GET /transactions?limit=5` al fondo del Inicio. | **Eliminar "Últimos movimientos" del Inicio.** En su lugar, el tab bar (`/movimientos`) se encarga del historial, y el Inicio se enfoca 100% en salud presupuestal y saldos. | `BRIEF-UX.md` §1 señala que se usa parado en la fila del súper. Meter una lista transaccional crea un scroll infinito que diluye la respuesta a "¿voy bien?". Reduce latencia (1 llamada en vez de 2, `API-CONTRACT.md` §14). |
| **Jerarquía y orden de bloques** | Cuatro bloques estáticos del mismo peso apilados: Por asignar → Sobres → Cuentas → Movimientos. | **Jerarquía dinámica orientada a la acción:**<br>1. Estado del Periodo y Días restantes.<br>2. Tarjeta principal de Estado (Por asignar o Llamado de atención si hay sobregiro).<br>3. Resumen de salud de Sobres (priorizando los que requieren acción).<br>4. Saldos de Cuentas (resumido por tipo: Disponible real vs. Tarjetas). | Guía la vista según el momento: si algo requiere atención (sobregiro o periodo vencido), toma el primer plano; si todo está en orden, domina la confirmación visual de tranquilidad. |
| **Presentación de Sobres** | Lista completa de sobres con 3 números sueltos por tarjeta. | **Agrupación por estado con barra de progreso:** Sobres en sobregiro arriba (con botón *"Cubrir"*), seguidos de los sobres activos con barra visual de porcentaje consumido. | Resuelve `BRIEF-UX.md` §6.4. El usuario no tiene que comparar tres cifras mentalmente; la barra delgada y el estado contextual le dicen si va bien. |
| **Tratamiento de Banners** | Banners persistentes con peso de error al tope de la pantalla. | **Tarjetas de aviso integradas en el flujo:** Presentadas como tareas pendientes ("Cierre de periodo listo", "Movimientos por clasificar") con tono neutral/informativo, no como alertas de falla del sistema. | Cumple `SCREENS-front.md` §2 (`/` Inicio) y `BRIEF-UX.md` §6.7: son pendientes operativos, no roturas. |

---

## C. Brief mejorado de la pantalla: Inicio (`/`)

### 1. Propósito y problema del usuario
* **Propósito:** Responder en menos de 5 segundos la pregunta: *"¿Voy bien con mi dinero o tengo que atender algo hoy?"*.
* **Problema:** El usuario necesita saber si tiene dinero libre para gastar o asignar, sin confundir el saldo disponible en banco con la deuda de su tarjeta de crédito ni con el dinero que ya prometió a sus gastos fijos.

### 2. Usuario y contexto
* Persona mirando el móvil en la calle o tras hacer un pago. Entra con una mano, busca confirmación inmediata y no quiere descifrar términos contables.

### 3. Jerarquía y estructura conceptual
La pantalla se organiza en 4 niveles visuales descendentes:

1. **Barra de contexto del Periodo:**
   * Muestra las fechas del periodo actual (ej. *"1 al 15 de agosto"*) y los días restantes (*"Quedan 4 días"*).
   * Si no hay periodo abierto, se muestra el estado pendiente con acción directa a crearlo (`API-CONTRACT.md` §14).
2. **Tarjeta Héroe (Salud Financiera):**
   * **Caso A: Todo en orden o dinero disponible (`unassignedCents >= 0` y cero sobregiros):**
     * Título: `"Por asignar"`
     * Cifra grande: `<Money cents={unassignedCents} />`
     * Subtexto si es `$0.00` y hay presupuesto asignado: *"Todo repartido. Cada peso tiene un sobre."*
     * Subtexto si es `> $0.00`: *"Listo para repartir en tus sobres."* Con botón: `[Repartir]` → navega a `/sobres`.
   * **Caso B: Sobres sobregirados (`categories.some(c => c.status === 'overspent')`):**
     * Título: `"Sobres por ajustar"`
     * Cifra grande: Monto total necesario para cubrir los sobregiros (suma en cliente de `abs(availableCents)` de sobres en `overspent`).
     * Subtexto: *"{N} sobres gastaron más de lo asignado."*
     * Botón de acción: `[Revisar sobres]` → enfoca los sobres en conflicto.
     * *(Nota: El monto "Por asignar" se coloca abajo en tamaño secundario indicando "$0.00").*
3. **Resumen de Sobres del Periodo:**
   * Encabezado con métrica global: *"Gastado: $X de $Y"* (suma en cliente de `spentCents` y `assignedCents`, `BRIEF-UX.md` §5).
   * **Lista priorizada:**
     * Primero: Sobres con estado `overspent` (destacados con borde de advertencia, indicando *"Pasado por $X"* y botón *"Cubrir"* que abre el selector de traspaso).
     * Segundo: Sobres con estado `available` o `depleted`, mostrando nombre, disponible y barra horizontal de consumo (`spentCents / assignedCents`).
     * Ocultos o colapsados: Sobres con `no_budget` bajo un indicador sutil (*"{N} sobres sin presupuesto este periodo"*).
4. **Resumen de Cuentas (Dinero Real):**
   * Agrupado y etiquetado claramente respetando `SCREENS-front.md` Parte 1:
     * **Cuentas de débito y efectivo (`kind === 'cash'`):** Total acumulado bajo el rótulo *"Efectivo y bancos"*.
     * **Tarjetas de crédito (`kind === 'credit'`):** Total adeudado bajo el rótulo *"Debes en tarjetas"* (valor absoluto de saldos de crédito).
     * **Te deben (`kind === 'receivable'`):** Si existen saldos a favor.

### 4. Textos literales del sistema (`lib/i18n/es.ts`)
* Cabecera con dinero libre: `"Por asignar"`
* Todo asignado: `"Todo repartido"` · `"Cada peso tiene un sobre."`
* Cero asignaciones iniciales: `"Aún no repartes nada"` · `"Cuando registres un ingreso vas a ver aquí cuánto tienes por asignar."`
* Sobregiro en sobres: `"Sobres por ajustar"` · `"Pasado por {monto}"`
* Botón de resolver sobregiro: `"Cubrir sobregiro"`
* Periodo: `"Periodo actual"` · `"Quedan {días} días"`
* Sin periodo: `"No hay periodo abierto"` · `"Tus gastos se siguen registrando, pero no cuentan en ningún presupuesto."` · Botón: `"Crear periodo"`

### 5. Estados del sistema
* **Carga:** Skeletons respetando la estructura de 3 bloques (tarjeta héroe + resumen sobres + cuentas).
* **Vacío (Sin cuentas cash):** Redirección automática a `/empezar` (Guard verificado en `SCREENS-front.md` §2).
* **Error:** Componente `ErrorState` estándar con reintento ante fallos de red (`API-CONTRACT.md` §14).

### 6. Componentes a reutilizar
* `Money` y `Balance` (`src/components/money/`) para formateo seguro de `BigInt`.
* `EnvelopeStatusBadge` (`src/features/envelopes/components/EnvelopeStatusBadge.tsx`).
* `CoverOverspendSheet` (`src/features/envelopes/components/CoverOverspendSheet.tsx`) activable directamente desde la lista de sobres sobregirados.
* `Banner` (`src/components/layout/Banner.tsx`) para avisos no bloqueantes de transacciones sin periodo.

### 7. Restricciones técnicas
* **Una sola llamada:** Todo se nutre de `GET /insights/dashboard` (`API-CONTRACT.md` §14).
* **Cero llamadas a transacciones en esta vista:** No llamar a `GET /transactions?limit=5`.
* **Aritmética BigInt:** Las sumas de totales de presupuesto y déficits se realizan con `BigInt` en centavos (`CLAUDE.md` "Trampas de este stack").

### 8. Criterios de aceptación (Las Tres Pruebas)
1. **Prueba del número solo:**
   * Si el usuario ve un número en la tarjeta héroe, sabe si es dinero que tiene en la mano para repartir ("Por asignar") o dinero que le falta meter a un sobre ("Sobres por ajustar"). Nunca verá un signo negativo confuso en "Por asignar".
2. **Prueba de la pregunta:**
   * Si un sobre se sobregira, el usuario no se pregunta "¿qué hago?", ve al lado del sobre un botón explícito que dice *"Cubrir"* y le permite mover dinero de otro sobre con saldo.
3. **Prueba de la palabra:**
   * La pantalla no menciona *"asientos"*, *"partida doble"*, *"rollover"*, *"compensated"* ni *"crédito fiscal"*. Solo habla de *"sobres"*, *"cuentas"*, *"tarjetas"* y *"lo que debes"*.

---

## D. Decisiones y dudas pendientes

* **Decisión de producto (Pregunta §4.1):** ¿Cómo tratar el número "Por asignar" cuando la fórmula de base da negativo?
* **Decisión recomendada (Cuentas vs. Sobres):** Ocultar el desglose detallado de cada cuenta bancaria en el Inicio y mostrar únicamente el total de "Efectivo disponible" y "Deuda en tarjetas". Quien quiera ver el detalle de cada banco específico puede tocar e ir a `/cuentas`.
* **Riesgo aceptado conscientemente:** Eliminar "Últimos movimientos" del Inicio requiere que el usuario use el tab inferior `/movimientos` para consultar historial. Se acepta porque agiliza la carga y mantiene el foco cognitivo en el presupuesto.
* **Pregunta para diseño visual:** Determinar la altura máxima de la lista de sobres en Inicio para evitar que empuje los saldos de cuentas fuera del viewport en pantallas móviles compactas.

---

## E. Resultado del Council

* **Las tres mejoras más importantes:**
  1. **Separación radical del sobregiro:** "Por asignar" nunca es negativo. Si hay sobregiros, se convierte en un llamado de atención separado para ajustar sobres, protegiendo al usuario de la falsa sensación de quiebra.
  2. **Eliminación de llamadas redundantes:** Descartar "Últimos movimientos" de la pantalla de inicio deja la pantalla alimentada por una sola consulta ultra-eficiente (`GET /insights/dashboard`).
  3. **Jerarquía orientada al estado:** Si hay algo urgente que arreglar, la pantalla prioriza ese sobre y su botón *"Cubrir"*; si todo va bien, refuerza la confirmación de tranquilidad con barras de avance limpias.
* **Críticas descartadas:**
  * Se descartó la idea de fusionar Cuentas y Sobres en un solo número de "Patrimonio neto": violaría la regla fundacional de la app (`BRIEF-UX.md` §1), que es presupuestar en base a sobres y no obsesionarse con balances contables.
* **Confianza general:** **Alta.** El brief resultante no requiere cambios de backend, no viola ninguna regla de `BRIEF-UX.md` §8 y resuelve de raíz la principal fuente de confusión que arrastraba el proyecto.
