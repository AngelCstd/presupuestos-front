import { captureRoute } from './capture_driver.mjs';

console.log('=== CAPTURANDO CAMBIOS DE TANDA 2 (ENLACES Y AUDITORÍA) ===\n');

console.log('1. Capturando Inicio (/)...');
await captureRoute('http://localhost:3001/', 'ux/inicio');

console.log('2. Capturando Sobres (/sobres)...');
await captureRoute('http://localhost:3001/sobres', 'ux/sobres');

console.log('3. Capturando Movimientos (/movimientos)...');
await captureRoute('http://localhost:3001/movimientos', 'ux/movimientos');

console.log('4. Capturando Periodos (/periodos)...');
await captureRoute('http://localhost:3001/periodos', 'ux/periodos');

console.log('\n=== CAPTURAS TANDA 2 COMPLETADAS ===');
