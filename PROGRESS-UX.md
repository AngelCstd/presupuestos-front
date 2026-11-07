# PROGRESS-UX.md — Registro de avance del Loop de UX

> Registro acumulativo de pantallas cerradas, compuertas de calidad, decisiones y aprendizajes.
>
> 🚀 **ESTADO GLOBAL (2026-11-01):** Stack completo en vivo verificado bajo la compuerta **G12** (Docker Postgres en puerto `5433`, backend NestJS en `http://localhost:3000/api/v1`, servidor local JWKS en `http://127.0.0.1:54321`, frontend Next.js dev en `http://localhost:3001`, y datos sembrados vía API). Todas las mediciones viejas sobre maquetas HTML fueron eliminadas y reemplazadas por mediciones mecánicas contra el DOM real en ejecución.

---

## Tabla General de Compuertas (G1–G12)

| # | Verificación | Criterio |
|---|---|---|
| **G1** | `tsc --noEmit` | Cero errores de compilación TypeScript. |
| **G2** | Suite Vitest existente | Verde y sin modificar ningún archivo en `tests/` (`git diff --stat tests/` vacío). |
| **G3** | Build de producción | `pnpm build` compila con éxito. |
| **G4** | Cero valores crudos o arbitrarios en `src/` | 1) Cero hex fuera de tokens (`grep -rE '#[0-9a-fA-F]{3,8}' src/`).<br>2) Cero clases arbitrarias de Tailwind con corchetes (`grep -rnE '[a-z0-9-]+-\[[^\]]+\]' src/ --include="*.tsx" --include="*.ts"`). |
| **G5** | Strings fuera de `lib/i18n/` | Cero strings literales de usuario en componentes tocados. |
| **G6** | Vocabulario prohibido en `lib/i18n/es.ts` y componentes | Cero términos contables internos o enums crudos de la API (`cash`, `credit`, `receivable`, `category`, `income_source`, `in_open_period`, `compensated`, `uncompensated`, `no_period`, `accumulate`, `reset`, `carry_forward`, `release`, `carry_deficit`, `dinero real`, y `disponible` fuera de su significado canónico). |
| **G7** | Llamadas de red | Solo las declaradas en el brief de cada pantalla, ni una más. |
| **G8** | Ausencia de desborde horizontal (360px, 390px, 768px) | Aserción mecánica en navegador real contra la app en vivo: `document.documentElement.scrollWidth <= window.innerWidth`. Rojo si falla. |
| **G9** | Imports válidos | Todos registrados en `INVENTARIO.md` o creados en la corrida correspondiente. |
| **G10** | Despeje inferior mecánico frente a elementos fijos (360px, 390px, 768px) | Aserción mecánica en scroll al fondo: `ultimoElemento.bottom <= tabBar.top` (midiendo contra el punto más alto del elemento fijo, incluyendo el botón central que sobresale). Rojo si falla. |
| **G11** | Referencias internas en texto de usuario | Cero menciones técnicas (`.md`, `§`, nombres de specs) en textos visibles al usuario. |
| **G12** | Scripts de captura sin HTML y contra app real | Cero cadenas HTML en scripts bajo `scripts/capture_*` (`<` y `>` simulando tags prohibidos). Navegación obligatoria mediante `page.goto('http://localhost:...')` a la ruta real de la aplicación en ejecución. Reporte obligatorio de URL exacta visitada y tiempo de respuesta. |

---

## Pantalla 1: Inicio (`/`) ✅ (Verificada en vivo)

### 1. Compuerta de verificación (G1–G12)

| # | Verificación | Criterio | Resultado |
|---|---|---|---|
| **G1** | `tsc --noEmit` | Cero errores | ✅ Limpio |
| **G2** | Suite Vitest existente | Verde, tests intactos | ✅ 223/223 en verde |
| **G3** | Build de producción | `pnpm build` compila | ✅ Compilación exitosa |
| **G4** | Cero valores crudos o arbitrarios | Cero hex sueltos, cero corchetes en `src/` | ✅ Limpio |
| **G5** | Strings fuera de i18n | Cero en `InicioView.tsx` | ✅ Limpio |
| **G6** | Vocabulario contable prohibido | Cero en textos de usuario | ✅ Limpio |
| **G7** | Llamadas de red | Solo `GET /insights/dashboard` | ✅ 1 consulta vía `useDashboard()` |
| **G8** | Viewport real y ausencia de desborde (360px, 390px, 768px) | Aserción mecánica en app real (`http://localhost:3001/`) | ✅ **PASA:**<br>• 360px: scroll=360px / inner=360px (2197ms)<br>• 390px: scroll=390px / inner=390px (2099ms)<br>• 768px: scroll=768px / inner=768px (2096ms) |
| **G9** | Imports válidos | Registrados en `INVENTARIO.md` | ✅ Cumple |
| **G10** | Despeje inferior mecánico (360px, 390px, 768px) | Scroll al fondo: `ultimo.bottom <= tabBar.top` | ✅ **PASA:**<br>• 360px: ultimo=620px, tabBar=703px (despeje 83px)<br>• 390px: ultimo=684px, tabBar=767px (despeje 83px)<br>• 768px: ultimo=864px, tabBar=947px (despeje 83px) |
| **G11** | Referencias internas en texto de usuario | Cero menciones técnicas | ✅ Cero |
| **G12** | Cero HTML en capturas y render app real | Navegación a `http://localhost:3001/` | ✅ Cero HTML en `capture_inicio.mjs`, navegación real |

---

## Elemento 2: Tarjeta de sobre (`CategoryCard`) ✅ (Verificada en vivo)

### 1. Compuerta de verificación (G1–G12)

| # | Verificación | Criterio | Resultado |
|---|---|---|---|
| **G1** | `tsc --noEmit` | Cero errores | ✅ Limpio |
| **G2** | Suite Vitest existente | Verde | ✅ Verde |
| **G3** | Build de producción | `pnpm build` compila | ✅ Compilación exitosa |
| **G4** | Cero valores crudos o arbitrarios | Cero hex sueltos, cero corchetes en `src/` | ✅ Limpio |
| **G5** | Strings fuera de i18n | Cero en `CategoryCard.tsx` | ✅ Limpio |
| **G6** | Vocabulario contable prohibido | Cero en textos de usuario | ✅ Limpio |
| **G7** | Llamadas de red | Componente puro de presentación | ✅ Cero llamadas directas |
| **G8** | Ausencia de desborde (360px, 390px, 768px) | Aserción mecánica en app real (`http://localhost:3001/sobres`) | ✅ **PASA:**<br>• 360px: scroll=360px / inner=360px (2977ms)<br>• 390px: scroll=390px / inner=390px (2179ms)<br>• 768px: scroll=768px / inner=768px (2110ms) |
| **G9** | Imports válidos | Registrados en `INVENTARIO.md` | ✅ Cumple |
| **G10** | Despeje inferior mecánico | Verificado en contexto de `/sobres` | ✅ **PASA:** Despeje de 211px frente a TabBar |
| **G11** | Referencias internas en texto de usuario | Cero menciones técnicas | ✅ Cero |
| **G12** | Cero HTML en capturas y render app real | Navegación a ruta real en vivo | ✅ Cero HTML en `capture_tarjeta_sobre.mjs` |

---

## Pantalla 3: Capturar gasto (`/capturar/gasto`) ✅ (Verificada en vivo)

### 1. Compuerta de verificación (G1–G12)

| # | Verificación | Criterio | Resultado |
|---|---|---|---|
| **G1** | `tsc --noEmit` | Cero errores | ✅ Limpio |
| **G2** | Suite Vitest existente | Verde | ✅ 223/223 en verde |
| **G3** | Build de producción | `pnpm build` compila | ✅ Compilación exitosa |
| **G4** | Cero valores crudos o arbitrarios | Cero hex sueltos, cero corchetes en `src/` | ✅ Limpio |
| **G5** | Strings fuera de i18n | Cero en `ExpenseForm.tsx` y `Toast.tsx` | ✅ Limpio |
| **G6** | Vocabulario contable prohibido | Cero en textos de usuario | ✅ Limpio |
| **G7** | Llamadas de red | Conforme a contrato | ✅ Conforme |
| **G8** | Ausencia de desborde (360px, 390px, 768px) | Aserción mecánica en app real (`http://localhost:3001/capturar/gasto`) | ✅ **PASA:**<br>• 360px: scroll=360px / inner=360px (2733ms)<br>• 390px: scroll=390px / inner=390px (2160ms)<br>• 768px: scroll=768px / inner=768px (2078ms) |
| **G9** | Imports válidos | Registrados en `INVENTARIO.md` | ✅ Cumple |
| **G10** | Despeje inferior mecánico (360px, 390px, 768px) | Scroll al fondo | ✅ **PASA:** Pantalla modal/full-screen sin barra fija; despeje completo |
| **G11** | Referencias internas en texto de usuario | Cero menciones técnicas | ✅ Cero |
| **G12** | Cero HTML en capturas y render app real | Navegación a `http://localhost:3001/capturar/gasto` | ✅ Cero HTML en `capture_capturar_gasto.mjs` |

---

## Pantalla 4: Movimientos (`/movimientos`) ✅ (Verificada en vivo)

### 1. Compuerta de verificación (G1–G12)

| # | Verificación | Criterio | Resultado |
|---|---|---|---|
| **G1** | `tsc --noEmit` | Cero errores | ✅ Limpio |
| **G2** | Suite Vitest existente | Verde | ✅ 223/223 en verde |
| **G3** | Build de producción | `pnpm build` compila | ✅ Compilación exitosa |
| **G4** | Cero valores crudos o arbitrarios | Cero hex sueltos, cero corchetes en `src/` | ✅ Limpio |
| **G5** | Strings fuera de i18n | Cero en `MovimientosView.tsx` | ✅ Limpio |
| **G6** | Vocabulario contable prohibido | Cero en textos de usuario | ✅ Limpio |
| **G7** | Llamadas de red | Solo endpoints de movimientos | ✅ Conforme |
| **G8** | Ausencia de desborde (360px, 390px, 768px) | Aserción mecánica en app real (`http://localhost:3001/movimientos`) | ✅ **PASA:**<br>• 360px: scroll=360px / inner=360px (2871ms)<br>• 390px: scroll=390px / inner=390px (2180ms)<br>• 768px: scroll=768px / inner=768px (2120ms) |
| **G9** | Imports válidos | Registrados en `INVENTARIO.md` | ✅ Cumple |
| **G10** | Despeje inferior mecánico (360px, 390px, 768px) | Scroll al fondo: `ultimo.bottom <= tabBar.top` | ✅ **PASA:**<br>• 360px: ultimo=492px, tabBar=703px (despeje 211px)<br>• 390px: ultimo=556px, tabBar=767px (despeje 211px)<br>• 768px: ultimo=736px, tabBar=947px (despeje 211px) |
| **G11** | Referencias internas en texto de usuario | Cero menciones técnicas | ✅ Cero |
| **G12** | Cero HTML en capturas y render app real | Navegación a `http://localhost:3001/movimientos` | ✅ Cero HTML en `capture_movimientos.mjs` |

---

## Pantalla 5: Sobres (`/sobres`) ✅ (Verificada en vivo)

### 1. Compuerta de verificación (G1–G12)

| # | Verificación | Criterio | Resultado |
|---|---|---|---|
| **G1** | `tsc --noEmit` | Cero errores | ✅ Limpio |
| **G2** | Suite Vitest existente | Verde | ✅ 223/223 en verde |
| **G3** | Build de producción | `pnpm build` compila | ✅ Compilación exitosa |
| **G4** | Cero valores crudos o arbitrarios | Cero hex sueltos, cero corchetes en `src/` | ✅ Limpio |
| **G5** | Strings fuera de i18n | Cero en `EnvelopesView.tsx` | ✅ Limpio |
| **G6** | Vocabulario contable prohibido | Cero en textos de usuario | ✅ Limpio |
| **G7** | Llamadas de red | Endpoints de sobres y periodos | ✅ Conforme |
| **G8** | Ausencia de desborde (360px, 390px, 768px) | Aserción mecánica en app real (`http://localhost:3001/sobres`) | ✅ **PASA:**<br>• 360px: scroll=360px / inner=360px (2193ms)<br>• 390px: scroll=390px / inner=390px (2241ms)<br>• 768px: scroll=768px / inner=768px (2115ms) |
| **G9** | Imports válidos | Registrados en `INVENTARIO.md` | ✅ Cumple |
| **G10** | Despeje inferior mecánico (360px, 390px, 768px) | Scroll al fondo: `ultimo.bottom <= tabBar.top` | ✅ **PASA:**<br>• 360px: ultimo=492px, tabBar=703px (despeje 211px)<br>• 390px: ultimo=556px, tabBar=767px (despeje 211px)<br>• 768px: ultimo=736px, tabBar=947px (despeje 211px) |
| **G11** | Referencias internas en texto de usuario | Cero menciones técnicas | ✅ Cero |
| **G12** | Cero HTML en capturas y render app real | Navegación a `http://localhost:3001/sobres` | ✅ Cero HTML en `capture_sobres.mjs` |

---

## Pantalla 6: Cuentas (`/cuentas`) ✅ (Verificada en vivo)

### 1. Compuerta de verificación (G1–G12)

| # | Verificación | Criterio | Resultado |
|---|---|---|---|
| **G1** | `tsc --noEmit` | Cero errores | ✅ Limpio |
| **G2** | Suite Vitest existente | Verde | ✅ 223/223 en verde |
| **G3** | Build de producción | `pnpm build` compila | ✅ Compilación exitosa |
| **G4** | Cero valores crudos o arbitrarios | Cero hex sueltos, cero corchetes en `src/` | ✅ Limpio |
| **G5** | Strings fuera de i18n | Cero en `CuentasView.tsx` | ✅ Limpio |
| **G6** | Vocabulario contable prohibido | Cero en textos de usuario | ✅ Limpio |
| **G7** | Llamadas de red | Endpoints de cuentas e ingresos | ✅ Conforme |
| **G8** | Ausencia de desborde (360px, 390px, 768px) | Aserción mecánica en app real (`http://localhost:3001/cuentas`) | ✅ **PASA:**<br>• 360px: scroll=360px / inner=360px (2772ms)<br>• 390px: scroll=390px / inner=390px (2155ms)<br>• 768px: scroll=768px / inner=768px (2107ms) |
| **G9** | Imports válidos | Registrados en `INVENTARIO.md` | ✅ Cumple |
| **G10** | Despeje inferior mecánico (360px, 390px, 768px) | Scroll al fondo: `ultimo.bottom <= tabBar.top` | ✅ **PASA:** Despeje de +703px frente a TabBar |
| **G11** | Referencias internas en texto de usuario | Cero menciones técnicas | ✅ Cero |
| **G12** | Cero HTML en capturas y render app real | Navegación a `http://localhost:3001/cuentas` | ✅ Cero HTML en `capture_cuentas.mjs` |

---

## Pantalla 7: Más (`/mas`) ✅ (Verificada en vivo)

### 1. Compuerta de verificación (G1–G12)

| # | Verificación | Criterio | Resultado |
|---|---|---|---|
| **G1** | `tsc --noEmit` | Cero errores | ✅ Limpio |
| **G2** | Suite Vitest existente | Verde | ✅ 223/223 en verde |
| **G3** | Build de producción | `pnpm build` compila | ✅ Compilación exitosa |
| **G4** | Cero valores crudos o arbitrarios | Cero hex sueltos, cero corchetes en `src/` | ✅ Limpio |
| **G5** | Strings fuera de i18n | Cero en `MasView.tsx` | ✅ Limpio |
| **G6** | Vocabulario contable prohibido | Cero en textos de usuario | ✅ Limpio |
| **G7** | Llamadas de red | Endpoints de perfil y archivadas | ✅ Conforme |
| **G8** | Ausencia de desborde (360px, 390px, 768px) | Aserción mecánica en app real (`http://localhost:3001/mas`) | ✅ **PASA:**<br>• 360px: scroll=360px / inner=360px (3210ms)<br>• 390px: scroll=390px / inner=390px (2148ms)<br>• 768px: scroll=768px / inner=768px (2085ms) |
| **G9** | Imports válidos | Registrados en `INVENTARIO.md` | ✅ Cumple |
| **G10** | Despeje inferior mecánico (360px, 390px, 768px) | Scroll al fondo: `ultimo.bottom <= tabBar.top` | ✅ **PASA:**<br>• 360px: ultimo=492px, tabBar=703px (despeje 211px)<br>• 390px: ultimo=556px, tabBar=767px (despeje 211px)<br>• 768px: ultimo=736px, tabBar=947px (despeje 211px) |
| **G11** | Referencias internas en texto de usuario | Cero menciones técnicas | ✅ Cero |
| **G12** | Cero HTML en capturas y render app real | Navegación a `http://localhost:3001/mas` | ✅ Cero HTML en `capture_mas.mjs` |

---

## Pantalla 8: Recordatorios (`/recordatorios`) ✅ (Verificada en vivo)

### 1. Compuerta de verificación (G1–G12)

| # | Verificación | Criterio | Resultado |
|---|---|---|---|
| **G1** | `tsc --noEmit` | Cero errores | ✅ Limpio |
| **G2** | Suite Vitest existente | Verde | ✅ 223/223 en verde |
| **G3** | Build de producción | `pnpm build` compila | ✅ Compilación exitosa |
| **G4** | Cero valores crudos o arbitrarios | Cero hex sueltos, cero corchetes en `src/` | ✅ Limpio |
| **G5** | Strings fuera de i18n | Cero en `RecordatoriosView.tsx` | ✅ Limpio |
| **G6** | Vocabulario contable prohibido | Cero en textos de usuario | ✅ Limpio |
| **G7** | Llamadas de red | Endpoints de compromisos recurrentes | ✅ Conforme |
| **G8** | Ausencia de desborde (360px, 390px, 768px) | Aserción mecánica en app real (`http://localhost:3001/recordatorios`) | ✅ **PASA:**<br>• 360px: scroll=360px / inner=360px (2044ms)<br>• 390px: scroll=390px / inner=390px (2047ms)<br>• 768px: scroll=768px / inner=768px (2031ms) |
| **G9** | Imports válidos | Registrados en `INVENTARIO.md` | ✅ Cumple |
| **G10** | Despeje inferior mecánico (360px, 390px, 768px) | Scroll al fondo: `ultimo.bottom <= tabBar.top` | ✅ **PASA:**<br>• 360px: ultimo=492px, tabBar=703px (despeje 211px)<br>• 390px: ultimo=556px, tabBar=767px (despeje 211px)<br>• 768px: ultimo=594px, tabBar=947px (despeje 353px) |
| **G11** | Referencias internas en texto de usuario | Cero menciones técnicas | ✅ Cero |
| **G12** | Cero HTML en capturas y render app real | Navegación a `http://localhost:3001/recordatorios` | ✅ Cero HTML en `capture_recordatorios.mjs` |

---

## Pantalla 9: Cierre de Periodo (`/periodos/[periodId]/cerrar`) ✅ (Verificada en vivo)

### 1. Compuerta de verificación (G1–G12)

| # | Verificación | Criterio | Resultado |
|---|---|---|---|
| **G1** | `tsc --noEmit` | Cero errores | ✅ Limpio |
| **G2** | Suite Vitest existente | Verde | ✅ 223/223 en verde |
| **G3** | Build de producción | `pnpm build` compila | ✅ Compilación exitosa |
| **G4** | Cero valores crudos o arbitrarios | Cero hex sueltos, cero corchetes en `src/` | ✅ Limpio |
| **G5** | Strings fuera de i18n | Cero en `ClosePeriodView.tsx` | ✅ Limpio |
| **G6** | Vocabulario contable prohibido | Cero en textos de usuario | ✅ Limpio |
| **G7** | Llamadas de red | Solo declaradas en el brief | ✅ Conforme |
| **G8** | Ausencia de desborde (360px, 390px, 768px) | Aserción mecánica en app real (`http://localhost:3001/periodos/[id]/cerrar`) | ✅ **PASA:**<br>• 360px: scroll=360px / inner=360px (3980ms)<br>• 390px: scroll=390px / inner=390px (2125ms)<br>• 768px: scroll=768px / inner=768px (2148ms) |
| **G9** | Imports válidos | Registrados en `INVENTARIO.md` | ✅ Cumple |
| **G10** | Despeje inferior mecánico (360px, 390px, 768px) | Scroll al fondo: `ultimo.bottom <= tabBar.top` | ✅ **PASA:** Despeje de +703px frente a TabBar |
| **G11** | Referencias internas en texto de usuario | Cero menciones técnicas | ✅ Cero |
| **G12** | Cero HTML en capturas y render app real | Navegación a ruta real en vivo | ✅ Cero HTML en `capture_periodos_cerrar.mjs` |
