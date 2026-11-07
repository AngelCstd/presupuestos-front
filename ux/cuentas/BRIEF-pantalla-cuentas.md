# Brief de Pantalla: `/cuentas` (Cuentas y Tarjetas)

## 1. Propósito y Contexto
La pantalla `/cuentas` centraliza la administración patrimonial del usuario. Permite consultar el estado consolidado de todas las cuentas reales (`cash`, `credit` y `receivable`), acceder al detalle/ledger de cada cuenta en `/cuentas/[accountId]`, y crear nuevas cuentas mediante un formulario modal en `Sheet`.

## 2. Decisiones de Diseño y Jerarquía
1. **Tarjeta de Resumen Patrimonial (Dinero Real):**
   - Muestra el **Dinero real disponible** (`calculateRealMoney`: saldo en efectivo menos deuda en tarjetas).
   - Detalla los 3 totales clave: Efectivo total, Deuda total en tarjetas (`debes`), y Total por cobrar (`te deben`).
   - Alerta visible cuando el dinero real es negativo (tarjetas superan al efectivo disponible).
2. **Secciones estructuradas por tipo de cuenta:**
   - **Efectivo y bancos (`cash`):** Dinero propio en cuentas corrientes, débito o efectivo físico.
   - **Tarjetas de crédito (`credit`):** Deuda acumulada en tarjetas, aplicando la regla de signo por `accountKind` mediante `<Balance>` (valor absoluto con sufijo `debes`).
   - **Te deben (`receivable`):** Préstamos pendientes a terceros, aplicando la regla de signo con sufijo `te deben`.
3. **Acción de creación rápida:**
   - Botón visible "Nueva cuenta" en el encabezado, desplegando `CreateAccountForm` en una hoja modal (`Sheet`).
4. **Ergonomía y Despeje (G8 / G10):**
   - Contenedor con `pb-36` para garantizar que la última tarjeta quede completamente por encima de la barra de navegación fija y el botón central `+`.
   - Cero desbordamiento horizontal en viewports móviles (360px, 390px).

## 3. Red y Dependencias
- `GET /accounts` (mediante `useAccounts`, para poblar la lista de cuentas y sus saldos).
- `POST /accounts` (mediante `useCreateAccount`, para crear una nueva cuenta).
