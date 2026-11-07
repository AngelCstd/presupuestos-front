# Brief de Pantalla: `/mas` (Ajustes y Configuración)

## 1. Propósito y Contexto
La pantalla `/mas` concentra los ajustes globales del usuario, perfil, preferencias operativas (zona horaria con impacto en delimitación de periodos), fuentes de ingreso, accesos directos a entidades secundarias (`/cuentas`, `/periodos`, `/recordatorios`), reactivación de elementos archivados y cierre de sesión.

## 2. Decisiones de Diseño y Jerarquía
1. **Encabezado y Estructura:**
   - Título: **Más** con subtítulo descriptivo de preferencias y ajustes.
   - Agrupación por tarjetas y secciones visuales limpias con borde sutil (`border-border/80`) y fondo `bg-background` / `bg-muted-background/30`.
2. **Perfil y Zona Horaria:**
   - Correo electrónico en modo lectura.
   - Selector nativo de zona horaria IANA con botón de confirmación condicional (`disabled={selected === me.timezone}`).
   - Modal de advertencia explícito: cambiar la zona horaria desplaza el inicio y fin de "hoy", afectando en qué periodo se registran los nuevos gastos.
3. **Fuentes de Ingreso:**
   - Visualización clara de fuentes activas con su saldo acumulado devengado vía `<Balance kind="income_source">`.
   - Estado vacío asistencial cuando no hay fuentes registradas ("No tienes fuentes de ingreso · Sirven para saber de dónde viene tu dinero.").
   - Acción directa para agregar una nueva fuente en hoja modal (`Sheet`).
4. **Navegación Secundaria:**
   - Accesos directos a `/cuentas`, `/periodos` y `/recordatorios` en tarjetas con chevrons claros.
5. **Elementos Archivados:**
   - Sección dedicada que colapsa cuentas, sobres y fuentes archivadas, permitiendo reactivarlas con un solo toque.
6. **Sesión y Salida:**
   - Botón visible para cerrar sesión de manera segura.
7. **Despeje y Reglas Mecánicas (G8 / G10):**
   - Padding inferior `pb-36` para garantizar que el botón de cerrar sesión quede por encima de la barra de navegación y el botón central `+`.
   - Cero desbordamiento horizontal en 360px, 390px y 768px.

## 3. Red y Dependencias
- `GET /me` y `PATCH /me` (gestión de perfil y zona horaria).
- `GET /income-sources` y `POST /income-sources` (fuentes de ingreso).
- `GET /accounts?includeArchived=true`, `GET /categories?includeArchived=true`, `GET /income-sources?includeArchived=true` (sección de archivadas).
- `POST /auth/sign-out` (vía cliente de Supabase).
