# Council de Diseño y Arquitectura: `/movimientos`

Consejo técnico reducido a tres perspectivas especializadas para la pantalla de Historial de Movimientos.

---

### Perspectiva 1: Diseño y UX (Jerarquía y Responsividad)
- **Filtros en pantallas móviles (360px / 390px):**
  - Los filtros (`from`, `to`, `cuenta`, `sobre`) deben fluir de forma compacta y natural sin provocar desbordamiento horizontal (`scrollWidth <= innerWidth`).
  - El botón "Quitar filtros" debe aparecer solo cuando haya al menos un filtro activo, permitiendo restablecer todo en un toque.
- **Visualización de movimientos y cuentas tocadas:**
  - El monto principal y la descripción deben ser los elementos de mayor contraste.
  - Las cuentas tocadas deben desplegarse como un detalle secundario pero legible (ej. "TDC BBVA", "Comida"), con su impacto usando `<Balance>` y la regla de signos por `accountKind`.
  - Las transacciones corregidas deben tener un trato visual claro: tachado suave y badge `Corregida`, mientras que la reversa lleva badge `Corrección`, permitiendo auditar ambos lados sin confusión.
- **Espaciado y despeje inferior:**
  - Respetar el margen inferior con respecto a la TabBar fija para pasar G10 mecánicamente.

---

### Perspectiva 2: Arquitectura Frontend y Rendimiento
- **Paginación infinita por cursor:**
  - Consumo directo de `useInfiniteQuery` mediante `useTransactions(filters)`.
  - Botón "Cargar más" con estado de carga (`loading={isFetchingNextPage}`) si `hasNextPage` es verdadero.
- **Alineación con tokens y compuerta G4:**
  - Cero valores arbitrarios (`text-[...]`, `w-[...]`). Uso estricto de las utilidades de diseño: `text-xs`, `text-sm`, `text-base`, `text-cents`, etc.
  - Cero colores hexadecimales directos en el código.
- **Garantía de compuerta G2 y single layer de i18n:**
  - Todos los textos de interfaz (labels, estados vacíos, nombres de filtros) deben provenir de `src/lib/i18n/es.ts`.

---

### Perspectiva 3: Reglas de Negocio y Criterios de Aceptación
- **Traducción de movimientos (G6 / Glosario):**
  - Prohibido cualquier término contable ("movimiento contable", "asiento", "partida doble", "ledger").
  - Si una fila muestra impacto en cuenta, usa las etiquetas del glosario: "Cuenta", "Tarjeta", "Sobre", "Te deben".
- **Comportamiento estricto de estados vacíos (SCREENS-front.md §4):**
  1. *Nada registrado:* Sin filtros y lista vacía → Tono `pendiente` con botón a `/capturar/gasto`.
  2. *Periodo actual:* Si el filtro de fechas coincide con el periodo actual abierto y la lista está vacía → Tono `exito` con título "Sin gastos todavía" (sin botón).
  3. *Otros filtros:* Filtros activos con lista vacía → Tono `neutral` con botón "Quitar filtros".
- **Banner de desajuste:**
  - Muestra movimientos huérfanos sin periodo si `unbudgeted.transactions.length > 0`.

---

### Conclusión y Consenso del Council
Se procede con la implementación de `MovimientosView.tsx`, extendiendo los filtros a cuenta y sobre, detallando las cuentas tocadas en cada `TransactionRow`, conectando los 3 estados vacíos de `SCREENS-front.md`, y asegurando cumplimiento total de G1 a G11.
