# Council de Diseño y Arquitectura: `/periodos/[periodId]/cerrar`

Consejo técnico de tres perspectivas sobre la pantalla de Cierre de Periodo (Operación Irreversible).

---

### Perspectiva 1: Diseño y UX (Acción Irreversible sin Modales y Flujo Continuo)
- **Eliminación del modal de confirmación (Regla 9):**
  - Un diálogo modal superpuesto es un parche para la falta de diseño. Toda la decisión de congelamiento debe resolverse en el cuerpo de la página antes del botón.
  - La hoja de balance final (Alternativa A) permite ver con total claridad:
    1. Cuánto dinero queda asignado y congelado por sobre.
    2. Cuánto dinero exacto se traspasa al periodo siguiente o se libera para el fondo común.
    3. Cuánto déficit se arrastra como deuda al futuro.
- **Experiencia post-cierre:**
  - El usuario no debe aterrizar en un estado neutro sin saber si el cierre tuvo éxito.
  - Al completar la acción, la navegación vuelve a `/` (Inicio) con un Toast informativo y la interfaz mostrando de inmediato el periodo siguiente como el periodo activo, con sus nuevos saldos.
- **Manejo de acceso desordenado:**
  - En lugar de disparar un error 409 al pulsar un botón condenado al fallo, la interfaz detecta si hay periodos anteriores pendientes y guía con un estado asistencial al periodo más antiguo con botón directo.

---

### Perspectiva 2: Arquitectura Frontend, Estado y Reactividad
- **Sincronización reactiva del `close-preview`:**
  - Si se borra una asignación o se crea el periodo siguiente, TanStack Query invalida `qk.closePreview(periodId)`.
  - Durante el re-fetch, el botón de cierre se deshabilita y las filas muestran estado de recálculo suave (`opacity-60`), impidiendo cierres con datos desactualizados.
- **Idempotencia y Mutación:**
  - El cierre utiliza `Idempotency-Key` única en `POST /periods/{id}/close`.
  - Invalida queries clave (`qk.periods()`, `qk.openPeriods()`, `qk.categories()`, `qk.dashboard()`) antes de redirigir a Inicio.

---

### Perspectiva 3: Reglas de Negocio y Glosario (G6 / G11)
- **Glosario Estricto:**
  - Se erradica cualquier referencia a "quincena/mes"; se utiliza exclusivamente el término canónico **"periodo"**.
  - Prohibidos tecnicismos de la API (`carry_forward`, `release`, `carry_deficit`, `NEXT_PERIOD_REQUIRED`).
  - Uso estricto de las frases definidas en `es.closeAction`: *"Se arrastra $X a la siguiente"*, *"Se liberan $X para asignar"*, *"Se arrastra un déficit de $X"*, *"Sin cambios"*.
  - Detección especial de notas de captura tardía (`isLateCaptureNote`) con aviso específico sobre gasto no cubierto.

---

### Conclusión y Consenso del Council
Se somete a revisión del usuario el brief renovado con las dos alternativas al modal (recomendando la Alternativa A: Hoja de balance final de cierre con compromiso directo), el flujo post-cierre redirigiendo a Inicio con periodo siguiente activo, el refresco reactivo de la previsualización y el estado asistencial ante cierres desordenados. **Cero código de implementación ha sido tocado.**
