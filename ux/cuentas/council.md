# Council de Diseño y Arquitectura: `/cuentas`

Consejo técnico reducido a tres perspectivas especializadas para la pantalla de Cuentas y Tarjetas.

---

### Perspectiva 1: Diseño y UX (Estructura y Escaneo de Saldos)
- **Claridad patrimonial sin saturación:**
  - Evitar listas planas desordenadas. Agrupar las cuentas en sus tres naturalezas reales: *Efectivo y bancos*, *Tarjetas de crédito* y *Te deben*.
  - En tarjetas de crédito, respetar estrictamente la regla de negocio: el saldo se presenta en valor absoluto con la etiqueta clara "debes" vía `<Balance>`, sin signos negativos desconcertantes.
  - La tarjeta de dinero real disponible al inicio de la pantalla otorga el contexto global antes de entrar al desglose individual.
- **Ergonomía móvil y despeje:**
  - El botón "Nueva cuenta" vive en el encabezado superior para no competir con el contenido ni quedar empujado hacia abajo.
  - El espaciado inferior `pb-36` garantiza que ningún elemento de la última sección quede solapado por la `TabBar`.

---

### Perspectiva 2: Arquitectura Frontend y Estado
- **Mutaciones limpias y reactivas:**
  - `useCreateAccount` invalida automáticamente `qk.accounts()` tras la creación, actualizando la lista y el cálculo de dinero real.
  - Cero dependencias arbitrarias: uso de componentes modulares del inventario (`Sheet`, `Input`, `Field`, `Balance`, `Money`, `Button`).
- **Compuerta G4 y tokens de diseño:**
  - Cero valores arbitrarios de Tailwind (`[...]`) y cero hex fuera de tokens.
  - La escala tipográfica utiliza `text-xs`, `text-sm`, `text-base`, `text-xl`, `text-2xl`.

---

### Perspectiva 3: Reglas de Negocio y Glosario (G6 / G11)
- **Glosario estricto:**
  - Prohibidos términos como `cash`, `credit`, `receivable` en la interfaz de usuario; se usan `Efectivo y bancos`, `Tarjetas de crédito` y `Te deben`.
  - Cero referencias a archivos internos del repositorio en texto visible.
- **Aritmética de dinero real:**
  - Emplear `calculateRealMoney` (`lib/domain/accounts.ts`), asegurando que solo `cash` y `credit` afecten el cálculo (las cuentas por cobrar no son dinero en mano disponible para presupuestar).

---

### Conclusión y Consenso del Council
Se procede a implementar `CuentasView.tsx` estructurada en secciones por tipo de cuenta, con tarjeta superior de dinero real y subtotales, modal `CreateAccountForm` integrado, y textos centralizados en `lib/i18n/es.ts`.
