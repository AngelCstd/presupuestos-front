# BRIEF-UX.md — Contexto para el agente de UX

> **Cómo usar esto.** Pégalo completo como primer mensaje de la sesión. Adjunta además
> `SCREENS-front.md`, `ARCHITECTURE-front.md` y `API-CONTRACT.md` del repo del frontend.
> Este brief dice **qué mejorar y con qué materiales**. Los tres documentos dicen
> **qué existe hoy**. Si algo de aquí choca con el `API-CONTRACT.md`, gana el contrato.

---

## 1. Qué es la app

Una app personal de finanzas en español, para una sola persona (yo), en México, en pesos.
Web, Next.js, mobile-first — se usa con el pulgar, parado en la fila del súper.

Hace dos cosas:

1. **Registra a dónde se va el dinero.** Cuentas, tarjetas, préstamos a amigos, historial.
2. **Reparte el dinero antes de gastarlo.** Cada periodo tomas lo que entró y lo metes en
   sobres con nombre: Comida, Transporte, Servicios. Gastas del sobre, no de la cuenta.

La segunda es la razón de existir. La primera solo la sostiene.

---

## 2. Quién la usa y cuál es la vara

El usuario no es contador ni técnico. **La vara es que alguien sin conocimientos técnicos
ni financieros pueda moverse sola, sin que nadie le explique nada.**

Eso se traduce en tres pruebas que cualquier pantalla tiene que pasar:

- **Prueba del número solo.** Si un número aparece sin texto alrededor, ¿se entiende qué
  significa y si es bueno o malo? Si hay que inferirlo, falta algo.
- **Prueba de la pregunta.** Si el usuario mira la pantalla y se pregunta "¿y ahora qué
  hago?", la pantalla tiene que responderlo con un botón, no con un párrafo.
- **Prueba de la palabra.** Ninguna palabra que el usuario no usaría al hablar de su
  propio dinero.

---

## 3. El modelo mental que la app le pide al usuario

Tres ideas, y todas las decisiones de interfaz salen de qué tan bien se transmiten.

**El periodo.** El presupuesto vive en un rango de fechas (típicamente 1–15 y 16–fin).
Se abre, se reparte, se gasta, se cierra. Al cerrar queda congelada para siempre.

**El sobre.** Una bolsa de dinero con nombre. Tiene tres números: **Asignado** (cuánto le
pusiste), **Gastado** (cuánto salió), **Disponible** (lo que queda). Un sobre puede
*acumular* lo que sobra para el siguiente periodo (Ahorro, Servicios) o *reiniciar* en
cero (Comida, Transporte).

**Por asignar.** El dinero que tienes pero que todavía no metiste a ningún sobre. Es el
número más importante de la app y el que peor se lee hoy (ver §6.1).

Lo que el usuario **nunca** debe ver: que por dentro esto es contabilidad de partida doble,
que las categorías son cuentas, ni las palabras `movimiento contable`, `asiento`, `entry`,
`ledger`, `partida doble`.

---

## 4. Lo que ya existe

Backend terminado y desplegado. Frontend construido, funcionando, con la lógica de dominio
cubierta por tests. **Nada de esto se va a reescribir.** El trabajo es de presentación,
jerarquía y lenguaje sobre lo que ya corre.

| Pieza | Estado |
|---|---|
| Next.js App Router, TypeScript estricto, Tailwind + tokens en CSS variables | Listo |
| TanStack Query con hidratación desde servidor; Zustand solo para borradores | Listo |
| Las 7 formas de capturar dinero + correcciones | Listo |
| Sobres, asignaciones, mover dinero entre sobres, cierre de periodo | Listo |
| Glosario español completo en `lib/i18n/es.ts` | Listo |
| Estados vacíos definidos pantalla por pantalla | Listo, ver `SCREENS-front.md` |
| Paleta: crema + sage, con los cuatro estados de sobre | Listo, con valores. Ver `INVENTARIO.md` |
| **Escala tipográfica, radios, sombras, espaciado** | **Pendiente — hoy son defaults de Tailwind** |
| **Jerarquía visual de cada pantalla** | **Pendiente — es el trabajo** |

**Navegación hoy:** tab bar inferior de 4 (Inicio · Sobres · Movimientos · Más) + botón
flotante que va directo a capturar un gasto.

**Pantallas:** `/` Inicio · `/sobres` y detalle · `/movimientos` y detalle ·
`/capturar/gasto` (el camino corto) · `/capturar/otro` (las otras seis) · `/cuentas` ·
`/periodos` y la pantalla de cierre · `/recordatorios` · `/mas` · `/empezar` (onboarding).

---

## 5. Tus materiales — lo que la API ya te da

Esto es lo que puedes pintar **sin tocar el backend**. Todo esto ya llega hoy.

### Nota sobre `accounts[]`
`GET /insights/dashboard` devuelve en `accounts[]` las cinco clases mezcladas: `cash`, `credit`, `receivable`, `category` e `income_source`. Para cualquier bloque o cálculo, el frontend debe filtrar según para qué:
- **Cuentas reales:** `cash`, `credit`, `receivable` (vía `isRealAccountKind`).
- **Dinero real:** únicamente `cash` + `credit` (la deuda resta). `receivable` se ignora (no se presupuesta lo que no se tiene en mano).

### Una sola llamada alimenta la pantalla principal

`GET /insights/dashboard` devuelve, de un golpe:

| Campo | Qué es | Qué puedes construir con eso |
|---|---|---|
| `unassignedCents` | Dinero sin repartir | El número grande de Inicio |
| `period` | El periodo actual con sus fechas y estado | Encabezado con el rango y los días que faltan |
| `categories[]` | Por sobre: `name`, `assignedCents`, `spentCents`, `availableCents`, `hasBudget`, `status` | Barras de progreso, porcentaje usado, orden por urgencia |
| `accounts[]` | Saldo por cuenta con su `kind` | Bloque de saldos, aplicando la regla de signo con `formatBalance` en el frontend (la API manda monto crudo con signo) |
| `unbudgetedTransactions[]` | Gastos que no caen en ningun periodo | Aviso suave, solo si hay |

**Y sumando `categories[]` en el cliente** — sin backend, sin endpoint nuevo — salen los
totales del periodo: cuánto asignaste, cuánto llevas gastado, cuánto te queda
disponible, y el porcentaje del presupuesto usado. Ese bloque se puede construir hoy.

### El resto, por pantalla

| Quieres | Ya existe |
|---|---|
| Últimos movimientos en Inicio | `GET /transactions?limit=5` — segunda llamada, barata |
| Filtrar el historial | Por rango de fechas, por cuenta, por sobre — úsalos como chips, no como formulario |
| Cuatro estados de sobre, visualmente distintos | `status`: `no_budget` · `available` · `depleted` · `overspent`, con su token de color cada uno |
| Iconos por sobre | Mapa local nombre → icono en el frontend. No necesita backend |
| Cubrir un sobregiro moviendo dinero de otro sobre | `POST /periods/{id}/allocations/move`, y la lista de sobres con saldo sale de la misma respuesta que ya tienes |
| Mostrar qué pasa antes de cerrar un periodo | `GET /periods/{id}/close-preview` — no escribe nada, dice sobre por sobre qué se arrastra y qué se libera |
| Saber si el botón de cerrar debe estar activo | `canClose` + `blockers` traducibles |
| Ver qué cuentas tocó un movimiento, en español | El detalle ya trae los montos con su cuenta y su `kind` |

### Dos cosas que conviene saber antes de diseñar

- **No hay búsqueda por texto en el historial.** Hay filtros (fecha, cuenta, sobre). Diseña
  con chips de filtro, no con una barra de búsqueda.
- **El presupuesto es por sobre, no global.** No existe un "presupuesto mensual" como
  número que el usuario fije; el total es la suma de lo que repartió. Se puede *mostrar*
  como total, pero se *edita* sobre por sobre.

---

## 6. Los problemas a resolver, en orden

### 6.1 "Por asignar" en negativo dice dos cosas distintas y se lee como una sola

Es el problema más caro de la app, porque está en el número más visible.

`unassignedCents` baja cuando un sobre se sobregira. Entonces un número negativo ahí puede
significar dos cosas que no se parecen en nada:

- **Te pasaste del presupuesto.** Tienes el dinero, pero lo gastaste de un sobre que no
  tenía suficiente. Se arregla moviendo dinero entre sobres. No es grave.
- **Gastaste dinero que no tienes.** Estás en números rojos de verdad.

Hoy ambas se ven igual: un número rojo que dice *"Te pasaste por $X"*. El usuario no puede
distinguir "reacomoda tus sobres" de "estás endeudado", y son reacciones opuestas.

**Lo que tienes para resolverlo:** los saldos de cuentas y los `status` de cada sobre
llegan en la misma respuesta. La diferencia entre los dos casos es computable en el
cliente. La pregunta de diseño es cómo se *dice* y qué acción se ofrece en cada caso.

### 6.2 Un sobre puede estar "en sobregiro" con cero gastado

Pasa cuando registras un gasto con fecha de un periodo ya cerrado: el gasto se queda en
el periodo viejo (que no se puede tocar), y el descuento aparece en el actual. Entonces el
sobre de este periodo dice "sobregiro de $500" con "gastado: $0".

Es correcto y la app ya lo explica en la tarjeta. **Verifica que esa explicación se
entienda leyéndola una vez, sin releer.** Si hay que pensarla, hay que reescribirla.

### 6.3 La pantalla de Inicio no tiene jerarquía

Tres bloques principales: Por asignar, sobres y cuentas. Nada
grita más fuerte que lo demás, así que el ojo no sabe dónde caer.

Hay un orden natural: *¿cuánto me falta por repartir?* → *¿cómo van mis sobres?* →
*¿cuánto tengo en total?* → *¿qué registré?*. Esa jerarquía no está construida.

### 6.4 Los sobres son cuatro números en fila, sin forma

Cada tarjeta muestra Asignado, Gastado, Disponible y un estado. Son números sueltos: para
saber si un sobre va bien hay que compararlos mentalmente.

Una barra de progreso resuelve eso sin leer nada, y los tres números que necesita ya
llegan. El estado `overspent` necesita su propia forma, no solo color — un sobre que se
pasó se ve distinto, no solo rojo.

### 6.5 Las siete formas de registrar dinero están nombradas desde el dominio

El menú de `/capturar/otro` ofrece cinco destinos: Ingreso · Transferencia · Préstamo · Cobro ·
**Dar por perdido**. Saldo inicial no es una opción suelta: se captura exclusivamente en el detalle de una cuenta sin fondos bajo `/cuentas`.

El camino corto (el botón flotante → capturar gasto) está bien resuelto y es el 90% del
uso. El problema es el otro 10%: el usuario tiene que elegir una categoría de operación
antes de saber qué está haciendo. Vale la pena replantear ese menú desde lo que la persona
quiere hacer, no desde lo que la operación es.

### 6.6 Cerrar un periodo es irreversible y la pantalla no pesa lo suficiente

Al cerrar, las asignaciones de ese periodo quedan congeladas para siempre. No hay cómo
reabrirla. Es el único acto irreversible de la app.

Hay una pantalla de previsualización que ya dice, sobre por sobre, qué se arrastra y qué se
libera. Lo que falta es que el momento *se sienta* como lo que es: el último momento de
editar. Hoy se avisa con texto.

### 6.7 Los avisos persistentes se ven como errores

Dos banners viven en la app: *periodo vencido sin cerrar* y *movimientos sin periodo*.
Ninguno de los dos es un error — son pendientes, tareas que el usuario puede hacer cuando
quiera. Pero se pintan con el peso de algo roto.

### 6.8 El mensaje después de guardar un gasto fuera del periodo

Cuando registras un gasto con fecha vieja, la app responde: *"Se descontó de Comida en el
periodo actual, porque ese periodo ya está cerrado."* Es exacto y es ilegible para quien
no sabe cómo funciona el cierre. Hay que decir lo mismo en términos de lo que el usuario va
a ver cambiar.

---

## 7. Dirección visual

**La paleta ya está definida y es la de la referencia:** crema cálido de fondo
(`#faf7f0`), sage como acento (`#5b6b4a`), y un token semántico por cada estado de sobre.
Los valores exactos están en el `INVENTARIO.md`. No se rehace: se revisa.

Lo que sigue sin definir, y hoy usa defaults de Tailwind: **escala tipográfica, radios,
sombras y espaciado.** Los componentes se construyeron contra nombres de token, así que
darles valor es cambiar un archivo.

Una pregunta abierta sobre los que ya existen: `--state-available` es azul mientras
`--color-success` es el sage verde. El estado bueno de un sobre no usa el color de "bien"
de la app. Puede ser deliberado — "disponible" no es "éxito" — pero conviene decidirlo.

**La referencia visual adjunta** (tres pantallas) es la dirección que quiero: claro,
mucho aire, tarjetas con radio generoso, un solo acento de color, números grandes con los
centavos en menor tamaño, iconos redondos por categoría, barras de progreso delgadas.
Tómala como dirección de **forma y jerarquía**, no como especificación:

- Ahí el presupuesto se ve como un total mensual. Aquí es **por sobre, por periodo** —
  el total es la suma, y se puede mostrar, pero el control vive en cada sobre.
- Ahí hay cinco tabs, uno de ellos "Metas". Aquí son cuatro. Lo que esa app llamaría una
  meta, aquí ya existe: un sobre que *acumula* lo que le sobra, periodo tras periodo.
  Si quieres que eso se vea como una meta, el dato está y el mecanismo también.
- Ahí hay una barra de búsqueda en el historial. Aquí hay filtros. Mismo lugar, otra forma.

Dos requisitos que no son gusto: **`no_budget` se pinta distinto de `depleted`** — "nunca
le asignaste nada" y "se acabó" son cosas opuestas que hoy se confunden. Y el color nunca
es lo único que distingue un estado.

---

## 8. Reglas de la sesión

- **No toques el backend.** Está cerrado, desplegado y con tests. Todo lo de este brief se
  resuelve en el frontend con los datos que ya llegan.
- **No cambies el `API-CONTRACT.md`.** Es la fuente de verdad. Si crees que falta un dato,
  dímelo — no lo inventes ni cambies el contrato.
- **Las palabras viven en `lib/i18n/es.ts`.** Ningún componente escribe texto a mano. Si
  cambias cómo se dice algo, se cambia ahí.
- **Los valores visuales viven en tokens.** Cero hex sueltos en componentes.
- **No hay tests de render ni de snapshot en este proyecto, a propósito.** No los agregues.
  La lógica pura (montos, fechas, estados de sobre) ya está cubierta y **esos tests no se
  tocan**.
- **Pago de tarjeta es una transferencia, nunca un gasto.** El gasto ya se contó al
  comprar. Si rediseñas el flujo de captura, esto no se negocia: registrarlo como gasto lo
  cuenta dos veces y descuadra el presupuesto entero.
- **Si una decisión de UX necesita un dato que la API no da, detente y dímelo.** No la
  resuelvas inventando el dato ni cambiando el significado del que hay.

---

## 9. Cómo se usa este documento

**Esto es contexto, no una orden de trabajo.** Dice qué es la app, con qué datos se cuenta
y qué no se toca. La tarea concreta la trae otro documento.

| Documento | Papel |
|---|---|
| **Este** (`BRIEF-UX.md`) | Contexto permanente. Se adjunta siempre, no se evalúa |
| `BRIEF-pantalla-<nombre>.md` | La entrada. Una pantalla a la vez |
| `PROMPT-COUNCIL-UX.md` | El proceso. Qué hacer con la entrada |

Dos cosas de aquí son vinculantes y se citan desde los otros documentos:

- **Las tres pruebas del §2** son la vara de severidad. Una pantalla que falla una de ellas
  con datos reales tiene un problema; lo demás es mejora o preferencia.
- **Las reglas del §8** no se violan. Si la mejor solución las viola, se dice en vez de
  hacerlo.

**El orden de trabajo, pantalla por pantalla:** Inicio primero — ahí vive el peor problema
(§6.1) y es la que más veces se ve al día. Después la tarjeta de sobre, que se reutiliza en
dos pantallas. Después la captura de gasto, que es el 90% del uso. El cierre de periodo al
final: es la más delicada y conviene llegar con el vocabulario ya resuelto.

**Los tokens** (paleta, escala tipográfica, espaciado, radios) salen una sola vez, después
de Inicio y la tarjeta de sobre — para entonces ya se sabe qué tiene que distinguir el
color y qué no. Antes de eso sería adivinar.

**El código, hasta el final.** Primero las decisiones.
