# Council de Diseño y Arquitectura: `/mas`

Consejo técnico de tres perspectivas para la pantalla de Ajustes y Más.

---

### Perspectiva 1: Diseño y UX (Jerarquía y Accesibilidad)
- **Organización por bloques temáticos:**
  - Evitar un formulario largo e indistinto. Organizar en cuatro bloques claros:
    1. *Perfil y Preferencias*: Correo y selector de zona horaria con advertencia contextual.
    2. *Fuentes de ingreso*: Visualización rápida y botón modal de alta.
    3. *Secciones del sistema*: Accesos directos a Cuentas, Periodos y Recordatorios.
    4. *Archivadas y Sesión*: Reactivación de entidades y botón de cierre de sesión.
- **Microinteracciones y estados:**
  - Botón de guardar zona horaria deshabilitado si no hay cambios.
  - Advertencia obligatoria antes de confirmar el cambio de huso horario para prevenir disrupciones en el cálculo de periodos abiertos.
- **Ergonomía:**
  - `pb-36` en el contenedor para total despeje respecto a la TabBar y el botón central `+`.

---

### Perspectiva 2: Arquitectura Frontend y Tokens
- **Adherencia a Tokens del Sistema:**
  - Cero colores hexadecimales y cero clases arbitrarias con corchetes (`[...]`).
  - Uso estricto de radios (`rounded-xl`), bordes (`border-border`) y fondo `bg-background` / `bg-muted-background/40`.
- **Internacionalización y Textos:**
  - Todos los textos de usuario centralizados en `es.masView` dentro de `src/lib/i18n/es.ts`.
  - Cero cadenas crudas en los componentes.

---

### Perspectiva 3: Reglas de Negocio y Glosario (G6 / G11)
- **Vocabulario Canónico:**
  - Prohibidos tecnicismos de la API como `income_source`, `patch_me`, etc.
  - Referencias limpias: "Fuentes de ingreso", "Periodos", "Cuentas y tarjetas", "Recordatorios".
  - Ninguna mención a archivos internos (`.md`, `§`, etc.).

---

### Conclusión y Consenso del Council
Se aprueba implementar `/mas` optimizando `MasView.tsx`, `ProfileSection.tsx`, `IncomeSourcesSection.tsx`, y `ArchivedSection.tsx` con estilos consistentes del sistema de diseño, extracción de strings a `es.ts`, y verificación mecánica con CDP.
