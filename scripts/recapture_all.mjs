import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { captureRoute } from './capture_driver.mjs';
import { mintToken } from '../../presupuestos/scripts/local-auth-server.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let periodId = 'f8e54104-9fd2-421a-a54e-8933f1d47a33';
try {
  const token = mintToken('e68fcf27-7fe4-4944-bb42-0eac5da720a5', 'luis@presupuestos.app');
  const res = await fetch('http://localhost:3000/api/v1/periods', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok) {
    const data = await res.json();
    const openPeriod = data.data?.find((p) => p.status === 'open');
    if (openPeriod) periodId = openPeriod.id;
  }
} catch (e) {
  console.warn('Fallback periodId:', periodId);
}

const screens = [
  { name: '1. Inicio', url: 'http://localhost:3001/', dir: 'ux/inicio' },
  { name: '2. Sobres', url: 'http://localhost:3001/sobres', dir: 'ux/sobres' },
  { name: '3. Capturar Gasto', url: 'http://localhost:3001/capturar/gasto', dir: 'ux/capturar-gasto', options: { isExemptFromG10: true } },
  { name: '4. Más', url: 'http://localhost:3001/mas', dir: 'ux/mas' },
  { name: '5. Capturar Otro', url: 'http://localhost:3001/capturar/otro', dir: 'ux/capturar-otro', options: { isExemptFromG10: true } },
  { name: '6. Detalle de Sobre', url: 'http://localhost:3001/sobres/1fd96af0-75d7-493f-93fd-52548e7a3bcc', dir: 'ux/sobres-detalle' },
  { name: '7. Detalle de Cuenta', url: 'http://localhost:3001/cuentas/807b124e-30b9-44b7-a344-1ba43e197208', dir: 'ux/cuentas-detalle' },
  { name: '8. Detalle de Movimiento', url: 'http://localhost:3001/movimientos/da5a5519-20d8-4aea-aed7-d806f6cd38a9', dir: 'ux/movimiento-detalle' },
  { name: '9. Movimientos', url: 'http://localhost:3001/movimientos', dir: 'ux/movimientos' },
  { name: '10. Cuentas', url: 'http://localhost:3001/cuentas', dir: 'ux/cuentas' },
  { name: '11. Recordatorios', url: 'http://localhost:3001/recordatorios', dir: 'ux/recordatorios' },
  { name: '12. Cierre Periodo', url: `http://localhost:3001/periodos/${periodId}/cerrar`, dir: 'ux/periodos-cerrar' },
];

console.log('=== INICIANDO RECAPTURA COMPLETA DE TODAS LAS PANTALLAS EN UNA SOLA CORRIDA ===\n');

for (const s of screens) {
  console.log(`Capturando ${s.name} en ${s.url} -> ${s.dir}...`);
  await captureRoute(s.url, s.dir, s.options || {});
}

// Sincronizar hacia los artefactos de brain
const brainCapturasDir = '/Users/angelcstd/.gemini/antigravity-cli/brain/d3f8eb91-dd1d-48b6-87e5-2716099cbdfb/capturas';
for (const s of screens) {
  const targetDir = path.resolve(brainCapturasDir, path.basename(s.dir));
  fs.mkdirSync(targetDir, { recursive: true });
  const srcDir = path.resolve(rootDir, s.dir);
  for (const file of fs.readdirSync(srcDir)) {
    if (file.endsWith('.png')) {
      fs.copyFileSync(path.resolve(srcDir, file), path.resolve(targetDir, file));
    }
  }
}

console.log('\n=== RECAPTURA Y SINCRONIZACIÓN COMPLETADA CON ÉXITO ===');
