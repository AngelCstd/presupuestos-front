import { captureRoute } from './capture_driver.mjs';

console.log('=== CAPTURANDO CAMBIOS DE TANDA 4 ===\n');

// 1. Capturar gasto (E1 y E2: monto sin tarjeta contenedora y pastillas táctiles de sobre)
console.log('1. Capturando /capturar/gasto...');
await captureRoute('http://localhost:3001/capturar/gasto', 'ux/tanda4-gasto');

// 2. Más (E5 y E3: zona horaria colapsada abajo, navegación arriba, íconos TabBar)
console.log('2. Capturando /mas...');
await captureRoute('http://localhost:3001/mas', 'ux/tanda4-mas');

// 3. Inicio (E4 y E3: marcador de ritmo en PeriodHeader e íconos en TabBar)
console.log('3. Capturando / (Inicio)...');
await captureRoute('http://localhost:3001/', 'ux/tanda4-inicio');

// 4. Capturar otro (C9.1: subtítulos explicativos de cada una de las 5 opciones)
console.log('4. Capturando /capturar/otro...');
await captureRoute('http://localhost:3001/capturar/otro', 'ux/tanda4-otro');

// 5. Detalle de sobre (C9.2: Gasto acumulado total y nota bajo Reinicia/Acumula)
console.log('5. Detalle de sobre /sobres/1fd96af0-75d7-493f-93fd-52548e7a3bcc...');
await captureRoute('http://localhost:3001/sobres/1fd96af0-75d7-493f-93fd-52548e7a3bcc', 'ux/tanda4-sobre-detalle');

// 6. Detalle de cuenta (C9.3: subtítulo de tipo de cuenta)
console.log('6. Detalle de cuenta /cuentas/807b124e-30b9-44b7-a344-1ba43e197208...');
await captureRoute('http://localhost:3001/cuentas/807b124e-30b9-44b7-a344-1ba43e197208', 'ux/tanda4-cuenta-detalle');

console.log('\n=== CAPTURAS TANDA 4 COMPLETADAS ===');
