# Brief de Pantalla: `/sobres` (Sobres del Periodo)

## 1. Propósito y Contexto
La pantalla `/sobres` es la vista principal de presupuestación de la aplicación. Muestra todos los sobres del periodo actual, permitiendo al usuario:
1. Inspeccionar de forma inmediata el estado, disponible, gastado y asignado de cada sobre.
2. Fijar o editar el presupuesto asignado mediante el endpoint idempotente `PUT /periods/{id}/allocations/{categoryId}` (nunca el POST de delta).
3. Cubrir sobregiros en un toque mediante `CoverOverspendSheet`, que consume sobres donantes con saldo disponible (`POST /periods/{id}/allocations/move`).
4. Atender sobres con captura tardía (§11.12), donde el sobregiro proviene de un periodo anterior cerrado.

## 2. Decisiones de Diseño y Jerarquía
- **Encabezado claro:** Título "Sobres" (`text-2xl font-bold`) y subtítulo explicativo del periodo.
- **Tarjetas completas (`CategoryCard`):**
  - Barra de progreso direccional que se vacía con el gasto. En sobregiro, tramo rayado diagonal desde la izquierda con ocre si es cubrible o rojo si no lo es.
  - Disponibilidad visible en grande (`text-xl font-bold`), asignado y gastado en escala secundaria.
  - Explicación explícita para captura tardía en el sobre (sin tooltip escondido).
  - Campo editable para fijar presupuesto con precarga de 0.00 en casos de saldo negativo inicial por captura tardía.
- **Despeje inferior (G10):**
  - Contenedor con `pb-36` para garantizar que la última tarjeta y su botón de acción queden completamente despejados respecto a la TabBar fija inferior y su botón central (+ Gasto).
- **Estados vacíos según especificación (SCREENS-front.md §3):**
  - *Cero sobres:* Tono `pendiente`, "No tienes sobres", acción para crear o usar sugeridos.
  - *Sin periodo:* Tono `pendiente`, "Necesitas un periodo abierto para repartir", enlace a `/periodos`.

## 3. Red y Dependencias
- `GET /categories?periodId=<actual>`
- `PUT /periods/{id}/allocations/{categoryId}` (fijar asignación)
- `POST /periods/{id}/allocations/move` (cubrir sobregiro)
- `POST /categories` (creación masiva de sobres sugeridos)
