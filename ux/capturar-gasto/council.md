# Council Review — Capturar gasto (`/capturar/gasto`)

> Invocación: 6 agentes (Product Thinker, UX Expert, UI / Visual Expert, Critical Thinker, Technical Context Reviewer, Synthesizer).
> Justificación: Pantalla 3 de la cola de diseño; representa el camino crítico de captura rápida (90% del uso diario) e integra las soluciones a las cuatro omisiones del flujo y el hallazgo 5.1.

---

## A. Diagnóstico de la pantalla original

* **Aciertos:**
  * Implementa persistencia automática de borrador con `useDraft('expense')` y soporte de `Idempotency-Key` en `POST /transactions/expenses`, protegiendo al usuario ante expiración de sesión (401 + re-login) y conexiones intermitentes.
  * Utiliza `splitEvenly` para repartir centavos exactos en dominios de números enteros.
  * Respeta la zona horaria del usuario para el valor por defecto de la fecha (`todayInTimeZone(timezone)`).
* **Debilidades principales identificadas y resueltas:**
  1. **Confirmación vacía vs. Silencio (Hallazgo 5.1):** Cerrar la pantalla vacía pero volver a Inicio en completo silencio deja al usuario inseguro sobre si su compra se guardó. Se requiere una señal clara y no invasiva: un **Toast efímero** (*"$350.00 en Comida"*) que desaparece solo a los 3.5 segundos.
  2. **Cuentas no filtradas en selector de pago:** El selector permitía elegir cuentas `receivable` (te deben), violando las reglas del dominio. Debe filtrarse estrictamente a `cash` y `credit`.
  3. **Monto inicial con fricción de ceros:** El valor inicial "0.00" provocaba que teclear un número quedara pegado al cero. Se resuelve con auto-selección total al enfocar (`select()`).
  4. **Omisiones en el reparto (Split):** No se mostraba visiblemente el centavo de más que retiene el primer sobre (`ARCHITECTURE-front.md` §8.1), ni se validaba en cliente la igualdad de sumas, arriesgando un `422 SPLIT_TOTAL_MISMATCH`.
  5. **Omisión de estados:** Faltaba contemplar `no_period` en los mensajes de impacto presupuestal y el estado vacío de cero sobres de `SCREENS-front.md`.

---

## B. Mejoras aprobadas por el Council

| Aspecto | Propuesta original | Propuesta mejorada | Justificación |
|---|---|---|---|
| **Flujo post-guardado (Hallazgo 5.1)** | Pantalla estática con `BudgetImpactMessage` y botón *"Listo"*, quedando en blanco cuando el gasto cae en periodo abierto (`in_open_period`). | **Retorno inmediato a Inicio + Toast efímero de confirmación:**<br>• En `in_open_period`: vuelve a `/` y muestra un toast con el monto y el sobre (*"$350.00 en Comida"*).<br>• En `compensated`, `uncompensated` o `no_period`: pantalla explicativa con acción clara. | Da certeza inmediata sin pasos muertos. El usuario ve que se guardó y continúa su día. |
| **Monto inicial** | Texto estático "0.00" sin selección. | **Auto-selección al enfocar y placeholder "0.00":** El primer toque selecciona el campo entero para que cualquier dígito reemplace el valor. | Erradica la fricción del dígito pegado al cero en el teclado numérico. |
| **Desglose de reparto (Split)** | División interna sin visibilidad del reparto de centavos. | **Desglose visible editable (`ARCHITECTURE-front.md` §8.1):** El primer sobre muestra el centavo de más (ej. `$33.34 · $33.33 · $33.33`) y cada línea es editable. | Transparencia total antes de guardar. |
| **Validación de suma en reparto** | Delegada al backend, arriesgando error 422. | **Validación cliente obligatoria:** Valida `sum(lines) + sum(lentTo) === totalCents`. Si no cuadra, muestra diferencia y bloquea el botón "Guardar". | Previene el error `SPLIT_TOTAL_MISMATCH` antes de llamar a la API. |
| **Estado vacío cero sobres** | Mensaje plano en texto. | **Estado vacío según `SCREENS-front.md`:** *"No tienes sobres"* con explicación y acción directa para crearlo o usar los sugeridos. | Guía al usuario nuevo sin dejarlo bloqueado. |
| **Filtrado de cuentas pagadoras** | Lista general de `accounts`. | **Filtrado estricto:** Exclusivamente `cash` y `credit`. | Integridad contable pura. |

---

## C. Brief mejorado de la pantalla: Capturar gasto (`/capturar/gasto`)

### 1. Propósito y problema del usuario
* Permitir al usuario registrar un gasto en menos de 10 segundos con una sola mano, validando montos y cuentas con exactitud y recibiendo retroalimentación instantánea.

### 2. Criterios de aceptación (Las Tres Pruebas)
1. **Prueba del número solo:** El monto se verifica en gran tamaño al escribir; el toast confirma exactamente el monto y el sobre guardado.
2. **Prueba de la pregunta:** En un gasto rutinario no hay preguntas ni botones sueltos: toast efímero de confirmación y regreso al Inicio.
3. **Prueba de la palabra:** Glosario impecable según `SCREENS-front.md` y `es.ts`.

---

## D. Separación de decisiones

### 1. Decisiones mecánicas (Aprobadas para ejecución)
1. Implementar componente `Toast` (`src/components/ui/Toast.tsx`) y store ligero para dispararlo tras redirigir a Inicio. Registrarlo en `INVENTARIO.md`.
2. Actualizar `AmountInput.tsx` con selección automática en foco.
3. Validación en cliente de suma exacta de split y préstamos en `ExpenseForm.tsx`.
4. Mostrar desglose inicial de split con `splitEvenly` asignando el centavo de más al primer elemento.
5. Renderizar los 4 estados de `budgetImpact` (`in_open_period`, `compensated`, `uncompensated`, `no_period`).
6. Presentar estado vacío de cero sobres según `SCREENS-front.md`.

---

## E. Resultado del Council

* **Confianza:** **10/10.** Resuelve los cinco puntos solicitados, erradica la pantalla vacía con un toast efímero, protege contra el 422 de split y proporciona la mejor ergonomía posible con una sola mano.
