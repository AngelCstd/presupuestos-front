# Brief de Pantalla: `/periodos/[periodId]/cerrar` (Cierre de Periodo)

## 1. Propósito y Contexto
La pantalla de cierre de periodo es la operación más crítica e irreversible del ciclo presupuestal en v1. Al cerrar un periodo (`POST /periods/{id}/close`), las asignaciones presupuestales de ese intervalo temporal quedan congeladas de forma permanente (no existe reapertura en v1, §15.1 de la arquitectura). La pantalla presenta una previsualización estricta (`GET /periods/{id}/close-preview`) del destino de cada sobre (fondos arrastrados al siguiente periodo, fondos liberados para asignar o arrastre de déficits) y los bloqueadores que impiden el cierre (como la obligatoriedad de que exista el periodo subsiguiente).

---

## 2. Decisiones de Diseño y Solución al Cierre Irreversible (Sin Modales Falsos)

### 2.1. El problema de fondo: Por qué no hay modal de confirmación
La regla 9 prohíbe esconder decisiones en diálogos emergentes para parchar la falta de diseño en el layout. Un modal con un botón "Aceptar" no hace que el usuario comprenda el congelamiento; solo añade un clic inconsciente.
Todo el peso recae en lo que el usuario comprende **antes** de pulsar el botón, viendo con claridad absoluta qué queda congelado y en qué estado.

### 2.2. Dos alternativas al modal de confirmación
Presentamos dos propuestas de diseño completas para resolver la decisión de cierre antes del botón:

#### Alternativa A (Recomendada): "Hoja de balance final de cierre con desglose de congelamiento y compromiso directo"
* **Estructura en pantalla:**
  1. **Tarjeta de Impacto Global:**
     - Resumen consolidado: *"Al cerrar este periodo: se congelan $X asignados en N sobres. $Y se arrastran al siguiente periodo. $Z se liberan para asignar."*
  2. **Desglose transparente por sobre:**
     - Cada sobre muestra su tríada contable: `Asignado $A` · `Gastado $G` · `Remanente $R`.
     - Flecha visual hacia su destino en el periodo siguiente:
       - `carry_forward`: *"Se arrastra $R al siguiente periodo"*
       - `release`: *"Se liberan $R para asignar"*
       - `carry_deficit`: *"Se arrastra un déficit de $R (deuda para el siguiente periodo)"*
       - `none`: *"Sin cambios"*
     - Si hay asignaciones del periodo que el usuario desea corregir antes del sellado, se listan en un bloque editable previo, permitiendo eliminar una asignación errónea in situ.
  3. **Botón de Acción Directa con Compromiso Explícito:**
     - En lugar de un diálogo modal, el botón de cierre vive al final del formulario y lleva una leyenda de compromiso clara:
       **"Sellar asignaciones y cerrar periodo"**
       con nota inferior fija: *"Esta acción no se puede deshacer. El periodo siguiente pasará a ser el actual."*
* **Lo que gana:**
  - Cero interrupciones. El usuario toma la decisión con todos los números frente a él.
  - La relación causa-efecto de cada sobre es transparente antes de hacer clic.
* **Lo que cede:**
  - Mayor densidad vertical de información por tarjeta de sobre en pantallas pequeñas.

#### Alternativa B: "Cierre en dos fases en la misma página: Auditoría de Alertas vs. Sellado Definitivo"
* **Estructura en pantalla:**
  1. **Sección 1: Auditoría de sobres que requieren decisión:**
     - Si hay sobres con déficit (`carry_deficit`), se destacan en una sección superior de aviso: *"Estos sobres cerrarán en números rojos y restarán presupuesto al periodo siguiente."*
     - Ofrece atajo inmediato para compensar o borrar asignaciones antes de sellar.
  2. **Sección 2: Sobres listos para traspaso:**
     - Sobres con remanente positivo o saldo exacto.
  3. **Sección 3: Cláusula de cierre con interruptor de confirmación previa:**
     - Un checkbox / switch interactivo explícito:
       `[ ] He revisado los gastos y saldos finales de este periodo.`
     - El botón **"Cerrar periodo y abrir siguiente"** permanece deshabilitado hasta marcar la casilla de verificación.
* **Lo que gana:**
  - Obliga a una lectura activa y consciente sin necesidad de ventanas emergentes molestas.
  - Separa visualmente los sobres con problemas de los que están en orden.
* **Lo que cede:**
  - Introduce un paso mecánico adicional (el checkbox) que puede sentirse burocrático si el usuario ya está seguro.

---

### 2.3. Qué pasa después de cerrar (El flujo post-cierre)
Al completarse con éxito `POST /periods/{id}/close`:
1. El usuario **no** cae en una pantalla vacía ni se le deja varado en un menú.
2. Es redirigido de forma automática e inmediata a **`/` (Inicio)**.
3. El frontend actualiza TanStack Query (`qk.periods()`, `qk.openPeriods()`, `qk.dashboard()`, `qk.categories()`).
4. **Inicio refleja de inmediato la transición:**
   - El periodo siguiente se convierte en el **periodo actual activo**.
   - Se dispara un `Toast` efímero: *"Periodo cerrado con éxito. Ahora estás en [Nombre del siguiente periodo]"*.
   - Los fondos liberados se reflejan al instante en *"Por asignar"* de la tarjeta héroe, y los saldos arrastrados aparecen en sus respectivos sobres.

---

### 2.4. Refresco reactivo del `close-preview` (Prevención de datos obsoletos)
Si el usuario borra una asignación o crea el periodo siguiente desde esta pantalla:
1. Se dispara la mutación correspondiente y se invalida de inmediato la clave de query `qk.closePreview(periodId)`.
2. **Estado mientras recálculo está en vuelo (`isFetching`):**
   - El botón de cierre se deshabilita preventivamente (`disabled`).
   - Las filas del desglose entran en modo de recálculo suave (`opacity-60`) acompañadas de un indicador discreto: *"Actualizando consecuencias de cierre..."*.
3. Al recibir la nueva respuesta de la API, las consecuencias por sobre se actualizan sin saltos bruscos de scroll, garantizando que el usuario nunca cierre con números obsoletos.

---

### 2.5. Cierre desordenado: Cuando el periodo no es el más antiguo (§15.2)
Si el usuario accede directamente por URL a un periodo que tiene otros periodos previos sin cerrar:
1. La pantalla detecta que no es el periodo más antiguo elegible para cierre.
2. **No se muestra un error crudo ni se ofrece un botón que fallará con 409.**
3. Se despliega un estado asistencial estructurado (`EmptyState tone="pendiente"`):
   - **Título:** *"Este periodo no se puede cerrar todavía"*
   - **Explicación:** *"Para no dejar huecos en tu historial, debes cerrar primero tus periodos anteriores en orden cronológico."*
   - **Referencia clara:** Muestra el rango de fechas del periodo más antiguo pendiente (`[Inicio – Fin]`).
   - **Acción directa:** Botón primario *"Ir a cerrar [Periodo anterior]"* que navega a `/periodos/{olderPeriodId}/cerrar`.

---

### 2.6. Asistente para el periodo siguiente (`NEXT_PERIOD_REQUIRED`)
Si el bloqueador indica que falta el periodo siguiente:
- Se muestra un bloque asistencial integrado con el botón *"Crear el siguiente periodo"*, abriendo `CreatePeriodForm` en hoja modal sin abandonar la pantalla. Al crearse, se refresca el `close-preview` y se habilita el cierre.

---

### 2.7. Asignaciones de captura tardía
Si el usuario decide borrar una asignación dentro de la sección de revisión previa:
- Si es una asignación estándar, se borra tras confirmar.
- Si es un ajuste de captura tardía (`isLateCaptureNote`), se muestra una advertencia diferenciada:
  > *"Este ajuste cubre un gasto de un periodo ya cerrado. Si lo borras, ese gasto queda sin cubrir."*
  con enlace para ver la transacción de origen en `/movimientos/{id}`.

---

## 3. Red y Dependencias
- `GET /periods` (para comprobar orden cronológico y detectar el periodo más antiguo).
- `GET /periods/{id}/close-preview` (consulta del impacto de cierre).
- `GET /periods/{id}/allocations` (asignaciones para revisión previa).
- `DELETE /periods/{id}/allocations/{allocationId}` (eliminación preventiva con recálculo automático).
- `POST /periods/{id}/close` (cierre irreversible con `Idempotency-Key`).
- `POST /periods` (creación del periodo siguiente si falta).
