# Council de Diseño y Arquitectura: `/recordatorios`

Consejo técnico de tres perspectivas para la pantalla de Recordatorios y Gastos Recurrentes.

---

### Perspectiva 1: Diseño y UX (Escaneo y Priorización)
- **Orden cronológico y de urgencia:**
  - Los compromisos vencidos o pendientes (`isDue: true`) se sitúan al inicio de la lista con un badge `Pendiente` en tono ámbar/aviso.
  - El botón "Confirmar" debe ser visible y directo en cada fila para agilizar la captura sin rodeos.
- **Microinteracción de Confirmación:**
  - Desplegar una hoja inferior (`Sheet`) que precarga el monto, fecha y cuenta predeterminada, permitiendo al usuario ajustar si el recibo vino con centavos de diferencia (ej. luz o gas), garantizando que el estimado de la plantilla permanezca intacto.
- **Espaciado y Ergonomía:**
  - Tarjetas redondeadas (`rounded-xl`), padding generoso y contenedor con `pb-36` para librar la `TabBar` y el botón central `+`.

---

### Perspectiva 2: Arquitectura Frontend y Estado
- **Mutaciones Idempotentes:**
  - La confirmación genera un `POST /recurring-templates/{id}/confirm` respaldado por `Idempotency-Key` e invalidación de claves de query (`qk.recurringTemplates()`, `qk.transactions()`, `qk.accounts()`, `qk.categories()`).
- **Sistema de Diseño y Tokens:**
  - Cero valores arbitrarios con corchetes (`[...]`) y cero hex fuera de tokens.
  - Componentes del inventario: `Badge`, `Button`, `Money`, `Sheet`, `EmptyState`, `Skeleton`.

---

### Perspectiva 3: Reglas de Negocio y Glosario (G6 / G11)
- **Lenguaje Claro y Humano:**
  - Cero tecnicismos contables o de la API (`recurring_template`, `confirm_result`, `isDue`).
  - Textos canónicos en `src/lib/i18n/es.ts` (`recordatoriosView`).
  - Cero referencias a documentación técnica interna.

---

### Conclusión y Consenso del Council
Se aprueba implementar `RecordatoriosView.tsx` con ordenamiento por `isDue`, tarjetas estilizadas del sistema de diseño, botón de alta "Nuevo recordatorio" en el encabezado, y verificación mecánica de desborde (G8) y despeje inferior (G10).
