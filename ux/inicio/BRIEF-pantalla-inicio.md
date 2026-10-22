# Brief de pantalla — Inicio (`/`)

> Documento de entrada del Council de Inicio, reconciliado con el estado real del repositorio.

---

## 1. Qué es

La pantalla de aterrizaje. Primer tab, destino después del login, y a la que se vuelve
después de capturar un gasto. Es la que más veces se ve en el día.

## 2. Qué intenta resolver

Que el usuario sepa, de un vistazo y sin tocar nada, **si va bien o si tiene algo
pendiente**.

"Ir bien" en esta app significa dos cosas a la vez, y las dos tienen que caber aquí:

- **Todo tu dinero está repartido** en sobres. Nada suelto sin destino.
- **Ningún sobre se pasó** de lo que le asignaste.

## 3. Quién entra y cuándo

Una sola persona, su propio dinero, en el teléfono. Tres momentos distintos:

| Momento | Frecuencia | Qué viene a hacer |
|---|---|---|
| Después de capturar un gasto | varias veces al día | Confirmar que lo que registró se reflejó donde esperaba |
| Revisión rápida | diario, 10 segundos | "¿Voy bien?" — no viene a hacer nada |
| Después de un ingreso o al abrir periodo | 2 veces al mes | Repartir dinero. Aquí sí viene a trabajar |

## 4. De dónde salen los datos

Una sola llamada: `GET /insights/dashboard`. Devuelve `unassignedCents`, `period`,
`categories[]` (cada sobre con `assignedCents`, `spentCents`, `availableCents`,
`hasBudget`, `status`), `accounts[]` (saldo y `kind`) y `unbudgetedTransactions[]`.

> **Nota sobre `accounts[]`:** Viene con las cinco clases mezcladas (`cash`, `credit`,
> `receivable`, `category` e `income_source`). El frontend debe filtrar según para qué:
> - **Cuentas reales:** `cash`, `credit`, `receivable` (vía `isRealAccountKind`).
> - **Dinero real:** únicamente `cash` + `credit` (la deuda resta). `receivable` no cuenta.
> 
> La API manda los saldos crudos con signo. La regla de presentación la aplica
> `formatBalance` en el frontend, nunca el servidor.

Los totales del periodo (asignado, gastado, disponible, porcentaje usado) **no son un
campo de la API**: son la suma de `categories[]` en el cliente. Se pueden mostrar hoy, sin backend.

## 5. Cómo está en código

Tres bloques principales, en este orden:

1. **Por asignar** (o situación de tarjetas/sobregiro según jerarquía)
2. **Sobres del periodo** — resumen con barra de consumo
3. **Saldos de cuentas** — efectivo/bancos, tarjetas de crédito y cuentas por cobrar

Más dos banners posibles: *periodo vencido sin cerrar* (desde el layout raíz) y
*movimientos sin periodo*. "Últimos movimientos" no vive aquí: pertenece al tab `/movimientos`.

## 6. Problemas conocidos — hipótesis de trabajo

### 6.1 "Por asignar" en negativo mezcla dos realidades distintas
`unassignedCents` baja cuando un sobre se sobregira. Con tope en `$0.00`, la tarjeta héroe
prioriza:
- Si `dinero real < 0`: *"Sin dinero libre para repartir"*, indicando cuánto exceden las tarjetas al efectivo disponible.
- Si hay sobres en sobregiro pero dinero real positivo: *"Sobres por ajustar"*, indicando el déficit a cubrir.
- Si no hay sobregiro: *"Por asignar"* positivo, o la celebración/estado vacío correspondiente.

### 6.2 Sobre en sobregiro con cero gastado
Ocurre en capturas con fecha de un periodo ya cerrado. La tarjeta lo explica en lenguaje
humano: *"Gasto registrado con fecha de un periodo ya cerrado. Se cubre con el presupuesto de este periodo."*

### 6.3 Los avisos no son errores
*Periodo vencido* y *movimientos sin periodo* son pendientes operativos, no fallas. Tono informativo.

### 6.4 Resumen de sobres visual
Los sobres usan barras de consumo visuales proporcionales, y el estado `overspent` se destaca por forma y botón *"Cubrir"*, no solo por color.

## 7. Lo que no se toca
- `GET /insights/dashboard` es la única llamada.
- Reglas duras de `BRIEF-UX.md` §8.
- Paleta crema + sage ya definida en tokens.
