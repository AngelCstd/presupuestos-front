# Brief de Pantalla: `/recordatorios` (Recordatorios y Gastos Recurrentes)

## 1. Propósito y Contexto
La pantalla `/recordatorios` permite gestionar los compromisos financieros recurrentes del usuario (renta, internet, suscripciones mensuales, etc.). Prioriza aquellos que ya están vencidos o próximos a vencer (`isDue: true`), permitiendo confirmarlos rápidamente mediante una hoja modal (`ConfirmRecurringForm`) con datos precargados y editables, sin alterar el estimado de la plantilla base.

## 2. Decisiones de Diseño y Jerarquía
1. **Encabezado y Acciones:**
   - Título: **Recordatorios** con subtítulo descriptivo de gastos fijos y recurrentes.
   - Botón superior "Nuevo recordatorio" para dar de alta plantillas en `/recordatorios/nuevo`.
2. **Priorización de Recordatorios (`isDue: true` arriba):**
   - Las plantillas pendientes de pago se ordenan en la parte superior con un badge de tono pendiente (`Pendiente`).
   - Si no hay ningún recordatorio pendiente de confirmación, se muestra un estado asistencial positivo ("Nada por confirmar").
3. **Tarjeta de Fila de Recordatorio:**
   - Nombre de la suscripción/servicio en negrita.
   - Metadatos esenciales: sobre de gasto, cuenta de pago sugerida, y próxima fecha de vencimiento (`nextDueOn`).
   - Monto en formato `<Money>` con centavos en escala reducida.
   - Botón de acción rápida "Confirmar", que abre el modal `ConfirmRecurringForm`.
4. **Estados Vacíos Asistenciales:**
   - Cero plantillas: "No tienes recordatorios · Sirven para lo que pagas cada mes: renta, wifi, suscripciones." con botón "Crear recordatorio".
   - Todo confirmado: "Nada por confirmar" en estado de éxito sin ruido.
5. **Ergonomía Móvil y Despeje (G8 / G10):**
   - Contenedor con `pb-36` garantizando que la última tarjeta o botón quede por encima de la `TabBar` fija y el botón central `+`.
   - Cero desbordamiento horizontal en 360px, 390px y 768px.

## 3. Red y Dependencias
- `GET /recurring-templates` (mediante `useRecurringTemplates`, para obtener las plantillas y su estado `isDue`).
- `POST /recurring-templates/{id}/confirm` (mediante `useConfirmRecurringTemplate`, con `Idempotency-Key` y registro de transacción).
- `GET /accounts` (para el selector de cuenta en el modal de confirmación).
