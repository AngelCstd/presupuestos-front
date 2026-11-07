import { captureRoute } from './capture_driver.mjs';
import { mintToken } from '../../presupuestos/scripts/local-auth-server.mjs';

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
  console.warn('Usando fallback periodId:', periodId);
}

const screens = [
  { name: '1. Inicio', url: 'http://localhost:3001/', dir: 'ux/inicio' },
  { name: '2. Tarjeta sobre', url: 'http://localhost:3001/sobres', dir: 'ux/tarjeta-sobre' },
  { name: '3. Capturar gasto', url: 'http://localhost:3001/capturar/gasto', dir: 'ux/capturar-gasto', options: { isExemptFromG10: true } },
  { name: '4. Movimientos', url: 'http://localhost:3001/movimientos', dir: 'ux/movimientos' },
  { name: '5. Sobres', url: 'http://localhost:3001/sobres', dir: 'ux/sobres' },
  { name: '6. Cuentas', url: 'http://localhost:3001/cuentas', dir: 'ux/cuentas' },
  { name: '7. Más', url: 'http://localhost:3001/mas', dir: 'ux/mas' },
  { name: '8. Recordatorios', url: 'http://localhost:3001/recordatorios', dir: 'ux/recordatorios' },
  { name: '9. Cierre periodo', url: `http://localhost:3001/periodos/${periodId}/cerrar`, dir: 'ux/periodos-cerrar' },
];

console.log('=== INICIANDO RECAPTURA COMPLETA DE LAS 9 PANTALLAS EN UNA SOLA CORRIDA ===\n');

const allResults = [];
for (const s of screens) {
  console.log(`Capturando ${s.name} en ${s.url}...`);
  const res = await captureRoute(s.url, s.dir, s.options || {});
  allResults.push({ screen: s.name, results: res });
}

console.log('\n=== RECAPTURA COMPLETADA CON ÉXITO ===');
