# Council Review — Tarjeta de sobre (`CategoryCard`)

> Invocación: 3 agentes (Product & UX Thinker, UI & Critical Thinker, Technical Context Reviewer).
> Justificación: Es un componente de presentación y control presupuestal, sin decisiones estructurales de ruteo; los roles de producto/UX y visual/crítico se unifican para evitar redundancia.

---

## A. Diagnóstico del componente original

* **Aciertos:**
  * Respeta la distinción entre `no_budget` y `depleted`: un sobre sin presupuesto no muestra `$0.00 disponible` como si se hubiera gastado, sino que indica su estado de ausencia.
  * Captura el caso borde de sobregiro por captura tardía (`spentCents === '0'` con `status === 'overspent'`).
* **Debilidades principales:**
  * **Tres cifras sin forma gráfica:** Asignado, Gastado y Disponible se muestran como una cuadrícula plana de números. El usuario tiene que hacer la resta mental para evaluar la velocidad de gasto (`BRIEF-UX.md` §6.4).
  * **Dependencia exclusiva del color:** El estado `overspent` se distingue únicamente por el color rojo del número y del badge, violando la regla dura de que el color nunca es lo único que distingue un estado (`BRIEF-UX.md` §7, Regla 10).
  * **Concordancia rota en captura tardía:** El texto actual dice *"Se cubre con esta"*, residuo del término femenino "quincena". Al migrar a "Periodo", quedó gramaticalmente desalineado.
* **Decisiones que faltaban:**
  * Cómo unificar la visualización de la tarjeta entre `/sobres` (modo gestión con input de asignación) e Inicio (modo lectura/progreso rápido) sin duplicar código de renderizado de la barra.
  * Tratamiento visual de `depleted` vs. `no_budget` para que no se lean como el mismo gris.

---

## B. Mejoras propuestas

| Aspecto | Propuesta original | Propuesta mejorada | Justificación |
|---|---|---|---|
| **Barra de consumo presupuestal** | Cuadrícula de 3 números sin elemento visual de avance. | **Barra horizontal delgada integrada:** Con color semántico (`bg-state-available`, `bg-state-depleted`, `bg-state-overspent`) y porcentaje del presupuesto consumido. | Resuelve `BRIEF-UX.md` §6.4: lectura instantánea sin comparar mentalmente tres cifras. |
| **Diferenciación no cromática de estados** | Solo el color del badge y del texto disponible distingue el estado. | **Diferenciación por forma y estructura:**<br>- `no_budget`: Borde punteado/discreto y sin barra de progreso.<br>- `available`: Borde sólido y barra proporcional.<br>- `depleted`: Barra llena al 100% en tono ocre y disponible en `$0.00`.<br>- `overspent`: Borde reforzado de alerta, barra al 100% roja y botón directo de acción *"Cubrir"*. | Cumple la Regla 10 de accesibilidad y diseño: el color nunca es el único indicador de estado. |
| **Explicación de captura tardía** | *"Es un gasto del periodo pasado, ya cerrado. Se cubre con esta."* | *"Gasto registrado con fecha de un periodo ya cerrado. Se cubre con el presupuesto de este periodo."* | Corrige la concordancia de género y aclara de dónde sale el dinero sin tecnicismos contables. |
| **Variantes de uso (Compact vs. Full)** | Solo existe la versión completa con `AmountInput` en `src/features/envelopes/components/CategoryCard.tsx`. | **Soporte de variante compacta:** La misma tarjeta puede renderizarse en modo resumen (para Inicio) o modo interactivo completo (para `/sobres`). | Reutilización directa según `INVENTARIO.md`, evitando divergencias visuales entre pantallas. |

---

## C. Brief mejorado del componente: Tarjeta de sobre

### 1. Propósito
* Representar la bolsa de dinero de una categoría, permitiendo al usuario saber en un vistazo cuánto le queda, a qué ritmo ha gastado y si requiere atención inmediata.

### 2. Estructura visual
1. **Fila superior:** Nombre del sobre (enlace al detalle `/sobres/[id]`) + Badge de estado (`EnvelopeStatusBadge`).
2. **Barra de progreso (si `hasBudget`):**
   * Track: `bg-muted-background` de 6px de alto con bordes redondeados.
   * Relleno:
     * `available`: `bg-state-available` con ancho `% = (spent * 100) / assigned`.
     * `depleted`: `bg-state-depleted` al 100%.
     * `overspent`: `bg-state-overspent` al 100%.
3. **Métricas clave:**
   * Si `hasBudget`: Gastado de Asignado a la izquierda; Disponible destacado a la derecha.
   * Si `no_budget`: Texto sutil indicando *"Sin presupuesto asignado este periodo"*.
4. **Mensaje de advertencia contextual:**
   * Si `overspent` con `spentCents === '0'`: Aviso contextual de ajuste por fecha anterior.
5. **Zona de acción (Modo interactivo en `/sobres`):**
   * Input para editar asignación + botón *"Guardar"*.
   * Si está en `overspent`: Botón de acción prioritaria *"Cubrir"*.

### 3. Textos literales (`lib/i18n/es.ts`)
* `es.envelopeCard.noBudgetPrompt`: `"Sin presupuesto asignado este periodo"`
* `es.envelopeCard.lateCaptureNotice`: `"Gasto registrado con fecha de un periodo ya cerrado. Se cubre con el presupuesto de este periodo."`
* `es.envelopeCard.saveAction`: `"Guardar"`
* `es.envelopeCard.coverAction`: `"Cubrir"`
* `es.envelopeCard.spentOf`: `" gastados de "`

### 4. Criterios de aceptación (Las Tres Pruebas)
1. **Prueba del número solo:** El usuario sabe si el sobre está saludable mirando la barra y el monto disponible, sin tener que restar el gastado del asignado en su cabeza.
2. **Prueba de la pregunta:** Si el sobre está en sobregiro, no se pregunta qué hacer; tiene el botón *"Cubrir"* en la tarjeta para traspasarle dinero desde otro sobre.
3. **Prueba de la palabra:** No menciona *"rollover"*, *"carry_forward"*, *"asiento"* ni concordancias rotas.

---

## D. Decisiones y dudas pendientes

* **Mecánica:** Unificar el componente `CategoryCard` para que acepte tanto la forma de `Category` (de `GET /categories`) como de `InsightCategoryBalance` (de `GET /insights/dashboard`), o una interfaz común normalizada.
* **Riesgo:** Evitar que los inputs de asignación en `/sobres` ocupen demasiado espacio en dispositivos de 360px de ancho. Se resuelve apilando el input y botón en pantallas muy angostas.

---

## E. Resultado del Council

* **Tres mejoras clave:**
  1. Barra de consumo proporcional con tokens accesibles.
  2. Estado `overspent` y `no_budget` diferenciados por borde y estructura, no solo por color.
  3. Redacción clara y con concordancia corregida para el sobregiro por fecha de periodo cerrado.
* **Regla vinculante del campo de asignación:**
  * El campo trae el asignado actual del sobre (`period.assignedCents`), **salvo cuando es negativo** (ajuste automático por captura tardía), donde **trae `0` (`0.00`)**.
  * *Justificación:* Evita presentar un presupuesto negativo en un campo editable y, al guardar `0`, envía el delta positivo que normaliza el sobre a `$0.00` disponible.
* **Confianza:** **Alta.** El componente queda listo para su integración tanto en `/sobres` como en Inicio.
