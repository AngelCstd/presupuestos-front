# Brief de Pantalla: `/movimientos` (Historial de Movimientos)

## 1. Propósito y Contexto
La pantalla `/movimientos` permite consultar el historial cronológico de todas las transacciones registradas (gastos, ingresos, transferencias, préstamos, cobros, balances iniciales y reversas), con orden fijo (más reciente primero), filtrado multidimensional (`from`/`to`, cuenta, sobre), e inspección clara de las cuentas tocadas y estados de corrección.

## 2. Decisiones de Diseño y Arquitectura
1. **Filtros rápidos y accesibles:**
   - Fechas (`from` y `to`).
   - Selector de cuenta (`accountId`).
   - Selector de sobre (`categoryId`).
   - Botón visible para "Quitar filtros" cuando alguno está activo.
2. **Filas de transacción enriquecidas:**
   - Fecha legible (`bookedAt`).
   - Descripción o concepto.
   - Cuentas tocadas descritas en frases naturales de usuario mediante `describeMovement` (ej. "Salió de Tarjeta BBVA", "Se cargó a Comida", "Fer te debe", "Volvió a Salud"), sin montos espejo ni partida doble.
   - Monto total con signo explícito (`-` para salidas, `+` para entradas) usando `<Money>` y color reforzador.
   - Distinción visual inconfundible de correcciones (ambas visibles siempre):
     - Transacción original reversada (`reversedByTransactionId !== null`): texto tachado (`line-through opacity-60`), badge "Corregida".
     - Transacción de reversa (`reversesTransactionId !== null`): badge "Corrección".
3. **Tres estados vacíos tipificados (SCREENS-front.md §4):**
   - **Nada registrado** (sin filtros): Tono `pendiente`, título "Aún no registras nada", subtítulo "Captura tu primer gasto y aquí va a quedar el historial.", acción "Capturar gasto" (`/capturar/gasto`).
   - **Nada en el periodo actual** (filtro coincide exactamente con el rango del periodo actual): Tono `exito`, título "Sin gastos todavía", sin acción adicional.
   - **Nada con otros filtros**: Tono `neutral`, título "Ningún movimiento con estos filtros", acción "Quitar filtros".
4. **Banner de advertencia (SCREENS-front.md §4):**
   - Movimientos sin periodo (`unbudgetedTransactions`): muestra aviso arriba con cantidad de movimientos huérfanos.
5. **Tipografía y Tokens:**
   - Cero hex crudos, cero clases Tailwind con corchetes `[...]`.
   - Escala tipográfica formal: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-2xl`.
   - Todos los strings centralizados en `lib/i18n/es.ts`.

## 3. Red y Dependencias
- `GET /transactions` (paginación por cursor, `from`, `to`, `accountId`, `categoryId`).
- `GET /periods?status=open` (mediante `useOpenPeriods`, para detectar el rango del periodo activo y aplicar el estado vacío de éxito).
- `GET /accounts` (mediante `useAccounts`, para poblar el filtro de cuentas).
- `GET /categories` (mediante `useCategories`, para poblar el filtro de sobres).
- `GET /insights/unbudgeted-transactions` (mediante `useUnbudgetedTransactions`, para banner de movimientos sin periodo).
