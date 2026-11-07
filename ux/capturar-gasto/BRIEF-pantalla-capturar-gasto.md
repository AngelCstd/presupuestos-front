# Brief de pantalla — Capturar gasto (`/capturar/gasto`)

> Documento de especificación de `/capturar/gasto`, reconciliado con el estado real del repositorio, `ARCHITECTURE-front.md`, `SCREENS-front.md` y `API-CONTRACT.md`.

---

## 1. Qué hace la pantalla en una frase
Es el camino corto y de alta frecuencia de la aplicación: permite registrar una salida de dinero en menos de 10 segundos con una sola mano, asociándola a una cuenta de pago y a uno o varios sobres con persistencia de borrador, validación matemática de reparto y confirmación de impacto presupuestal.

---

## 2. Quién llega aquí y desde dónde
* **El camino corto (90% del uso diario):** El usuario pulsa el FAB central `(+)` de la barra de navegación desde cualquier pantalla de la app (`/`, `/sobres`, `/movimientos`, `/mas`).
  * Contexto: En la calle, en la caja del súper o en la fila de una tienda, sosteniendo el teléfono con una sola mano. Necesita digitar el monto, confirmar sobre y cuenta (que deben recordar su último uso) y guardar de inmediato.
* **El camino contextual:** Desde el detalle de un sobre (`/sobres/[id]`).
* **Destino tras guardar:**
  * Si el gasto es rutinario en el periodo abierto (`in_open_period`): Cierre automático y retorno inmediato a `/` (Inicio) acompañado de una **confirmación efímera (toast)** con el monto y el sobre (ej. *"$350.00 en Comida"*) que desaparece sola tras 3.5 segundos.
  * Si el gasto es una captura tardía en un periodo cerrado (`compensated`), sin periodo abierto (`uncompensated`) o fuera de rango (`no_period`): Pantalla informativa de impacto presupuestal con explicación y acción correspondiente.

---

## 3. Los tres datos más importantes que el usuario busca responder aquí
1. **"¿Cuánto me costó?"** — Ingresar el monto de forma ágil, con teclado numérico que selecciona el contenido al enfocar y placeholder `"0.00"`, evitando que el primer dígito quede pegado al cero.
2. **"¿De qué sobre sale y con qué cuenta pagué?"** — Elegir el sobre correcto y la cuenta pagadora (filtrada estrictamente a `cash` y `credit`), recordando las elecciones recientes.
3. **"¿Afecta mi periodo actual o es una compra pasada?"** — Saber con certeza si la fecha elegida altera su presupuesto de hoy (con advertencia previa visible antes de guardar si cae en un periodo cerrado).

---

## 4. Los estados de la pantalla

### 4.1 Estado inicial / Flujo rápido (Default)
* Monto con placeholder `"0.00"` y auto-selección al enfocar (`onFocus select`).
* Fecha preseleccionada en "Hoy" (según la zona horaria de `/me`).
* Sobre y Cuenta de pago preseleccionados con el último valor utilizado o el primer elemento disponible.
* Opciones avanzadas colapsadas ("Repartir entre varios sobres" y "Parte prestada").

### 4.2 Estado vacío: Cero sobres disponibles (`categories.total === 0`)
* Condición: El usuario aún no crea ningún sobre en el sistema (`SCREENS-front.md` §2).
* Título: `"No tienes sobres"`
* Subtexto: `"Un sobre es una bolsa de dinero con nombre: Comida, Transporte, lo que uses."`
* Acciones: Enlace prominente a `[Crear sobre]` o `[Usar los sugeridos]` en `/sobres`.

### 4.3 Estado con datos (Borrador activo)
* Persistencia automática en el store de borradores (`useDraft('expense', ...)`). Si la sesión expira o el usuario navega a otra app para revisar el ticket, al volver los datos siguen intactos.

### 4.4 Reparto activo (Split) y validación de suma
* Al activar "Repartir entre varios sobres", se muestra el desglose ya calculado antes de guardar (`ARCHITECTURE-front.md` §8.1).
* **El primer sobre se queda el centavo de más** visiblemente (ej. `$100.00` en 3 sobres muestra `$33.34 · $33.33 · $33.33`) y cada línea es editable.
* **Validación cliente obligatoria:** El formulario valida que `sum(lines) + sum(lentTo) === totalCents`. Si hay discrepancia, muestra la diferencia en centavos y bloquea el botón "Guardar" para prevenir el error del backend `422 SPLIT_TOTAL_MISMATCH`.

### 4.5 Advertencia previa: Fecha en periodo cerrado
* Si el usuario selecciona una fecha que cae en un periodo ya cerrado (`isDateInClosedPeriod`), aparece un aviso preventivo visible **antes de guardar**:
  *"Esa fecha cae en un periodo ya cerrado. El gasto se guardará y se ajustará en el presupuesto de este periodo."*

### 4.6 Estado de carga / Guardando
* Botón "Guardar gasto" en estado `loading` con spinner, deshabilitado para evitar doble envío. Se envía encabezado `Idempotency-Key` único por borrador.

### 4.7 Estados de éxito y post-guardado (`budgetImpact`)
Los cuatro estados del contrato (`API-CONTRACT.md` y `SCREENS-front.md` Parte 1):
1. **`in_open_period`:** Cierre inmediato y retorno a `/` (Inicio). Se despliega un **Toast efímero** (*"$X.XX en {Sobre}"*) durante 3.5 segundos. Cero pantallas vacías con botones sueltos.
2. **`compensated`:** Pantalla explicativa: *"Se descontó de {categoryName} en el periodo actual, porque ese periodo ya está cerrado."* con botón para volver a Inicio.
3. **`uncompensated`:** Pantalla explicativa: *"El gasto afectó tu saldo pero ningún periodo."* con enlace directo a `[Crear periodo actual]`.
4. **`no_period`:** Pantalla informativa: *"Este movimiento no cae en ningún periodo."* con enlace a `[Ver pendientes]` hacia `/movimientos`.

### 4.8 Estado de error
* Si devuelve `401 UNAUTHORIZED`, preserva el borrador y redirige a `/login?next=/capturar/gasto`.
* Errores de API (ej. validaciones) se presentan en mensaje de alerta legible sin lenguaje contable.

---

## 5. Decisiones de producto que toma esta pantalla
1. **Confirmación efímera (Toast) en lugar de pantalla vacía (Hallazgo 5.1):**
   * El usuario en la calle necesita saber con certeza que su gasto se guardó. Al regresar a Inicio, una notificación toast visible durante 3.5 segundos confirma el registro (*"$350.00 en Comida"*).
2. **Filtrado estricto de cuentas de pago:**
   * Una cuenta de pago solo puede ser de tipo `cash` (efectivo, débito, banco) o `credit` (tarjeta de crédito). Cuentas de tipo `receivable` (te deben), `category` o `income_source` quedan excluidas del selector.
3. **Monto inicial con selección automática:**
   * `AmountInput` selecciona todo el texto al recibir foco (`select()`), permitiendo sobrescribir inmediatamente el valor sin tener que borrar manualmente el cero.
4. **Validación matemática en cliente para el reparto:**
   * No se permite enviar una solicitud donde la suma de sobres y préstamos no iguale el total.
5. **Aviso preventivo en periodo cerrado antes de enviar:**
   * Se avisa en el formulario antes de guardar, nunca después.

---

## 6. Textos literales (`lib/i18n/es.ts`)
* Título: `"Gasto"`
* Monto: `"Monto"`
* Sobre: `"Sobre"`
* Cuenta de pago: `"Cuenta de pago"`
* Fecha: `"Fecha"`
* Descripción: `"Descripción (opcional)"`
* Repartir: `"Repartir entre varios sobres"`
* Agregar sobre: `"Agregar otro sobre"`
* Parte prestada: `"Parte prestada (te lo van a pagar)"`
* Cuenta deudor: `"¿Quién te lo debe?"`
* Monto prestado: `"Monto que te deben"`
* Botón guardar: `"Guardar gasto"`
* Botón cancelar: `"Cancelar"`
* Alerta previa periodo cerrado: `"Esa fecha cae en un periodo ya cerrado. El gasto se guardará y se ajustará en el presupuesto de este periodo."`
* Error de suma de reparto: `"La suma de los sobres y préstamos debe coincidir con el total del gasto."`
* Estado vacío cero sobres:
  * Título: `"No tienes sobres"`
  * Mensaje: `"Un sobre es una bolsa de dinero con nombre: Comida, Transporte, lo que uses."`
  * Acción: `"Crear sobre"`
* Impacto `compensated`: `"Se descontó de {categoryName} en el periodo actual, porque ese periodo ya está cerrado."`
* Impacto `uncompensated`: `"El gasto afectó tu saldo pero ningún periodo."`
* Impacto `no_period`: `"Este movimiento no cae en ningún periodo."`

---

## 7. Componentes utilizados del `INVENTARIO.md`
* `AmountInput` (`src/components/money/AmountInput.tsx`) — Con selección automática al enfocar.
* `Button` (`src/components/ui/Button.tsx`) — Botón principal y secundario con soporte de loading.
* `Field` (`src/components/ui/Field.tsx`) — Contenedor accesible de etiqueta y control.
* `Input` (`src/components/ui/Input.tsx`) — Campo de texto y selector de fecha.
* `Checkbox` (`src/components/ui/Checkbox.tsx`) — Checkboxes para opciones avanzadas.
* `BudgetImpactMessage` (`src/features/transactions/components/BudgetImpactMessage.tsx`) — Mensaje de impacto para los 3 estados fuera de periodo.
* `Toast` (`src/components/ui/Toast.tsx`) — Notificación efímera post-guardado registrada en el inventario.
