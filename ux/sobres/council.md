# Council de Diseño y Arquitectura: `/sobres`

Consejo técnico reducido a tres perspectivas especializadas para la pantalla de Sobres del Periodo.

---

### Perspectiva 1: Diseño y UX (Consistencia y Ergonomía Móvil)
- **Alineación con la Tarjeta de Sobre aprobada:**
  - `CategoryCard` ya resolvió la barra rayada desde la izquierda, la precarga de 0.00 en déficit previo, y los contrastes accesibles. En `/sobres`, la lista apila estas tarjetas con separación consistente (`gap-4`).
- **Encabezado y jerarquía visual:**
  - Agregar un encabezado legible a la vista con el título `Sobres` y subtítulo del periodo, dándole entidad de pantalla principal frente a la navegación.
- **Despeje inferior frente a la TabBar fija:**
  - Usar `pb-36` en el contenedor principal para que la última tarjeta y su formulario de asignación o botón "Cubrir" no queden tapados por la barra inferior ni por el botón central `+`.

---

### Perspectiva 2: Arquitectura Frontend y Estado
- **Mutaciones idempotentes y seguras:**
  - La asignación se actualiza vía `useSetAllocation(periodId)` (`PUT /periods/{id}/allocations/{categoryId}`). El estado local de guardado muestra spinner en el botón correspondiente.
  - La cobertura de sobregiros usa `CoverOverspendSheet` con `useMoveAllocation(periodId)`.
- **Compuerta G4 y tokens:**
  - Cero clases arbitrarias con corchetes (`[...]`) y cero hex fuera de tokens.
  - El campo de asignación de la tarjeta usa la escala tipográfica estándar.
- **Single translation layer (G6/G11):**
  - Todos los textos de encabezado y vacíos residen en `lib/i18n/es.ts`. Prohibido citar archivos o términos internos en el render.

---

### Perspectiva 3: Reglas de Negocio y Casos Límite
- **Captura tardía en lista:**
  - Los sobres que arrastran déficit de periodos pasados cerrados muestran la explicación directamente en la tarjeta, facilitando entender por qué tienen sobregiro aun con $0 gastados en el periodo actual.
- **Estados vacíos tipificados:**
  - Si `periodId === null`: "Necesitas un periodo abierto para repartir" con botón a `/periodos`.
  - Si `data.total === 0`: "No tienes sobres" con botón "Usar los sugeridos".

---

### Conclusión y Consenso del Council
Se refina `EnvelopesView.tsx` agregando el encabezado estructurado, fijando `pb-36` para cumplir mecánicamente con G10, centralizando todos los textos en `src/lib/i18n/es.ts`, y generando capturas con CDP a 360px, 390px y 768px.
