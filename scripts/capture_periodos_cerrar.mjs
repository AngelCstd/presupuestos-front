import { captureRoute } from './capture_driver.mjs';
import { mintToken } from '../../presupuestos/scripts/local-auth-server.mjs';

let periodId = '89b854cc-176d-4d1e-9c18-a5bf479b0e2c';

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
  console.warn('Usando periodId de fallback:', periodId);
}

const targetUrl = `http://localhost:3001/periodos/${periodId}/cerrar`;
const outputDir = 'ux/periodos-cerrar';

console.log(`Iniciando captura real para Cierre de periodo en: ${targetUrl}`);
const results = await captureRoute(targetUrl, outputDir);

console.log('\n--- Mediciones mecánicas Cierre de periodo (G8, G10, G12) ---');
console.table(
  results.map((r) => ({
    URL: r.url,
    Viewport: r.viewport,
    'Tiempo (ms)': r.responseTimeMs,
    'scrollWidth / innerWidth': `${r.g8.scrollWidth}px / ${r.g8.innerWidth}px`,
    'G8 Sin desborde': r.g8.passed ? 'PASÓ' : 'FALLÓ',
    'ultimo.bottom / tabBar.top': `${r.g10.lastBottom}px / ${r.g10.tabBarTop}px`,
    'G10 Despeje': `${r.g10.despejePx}px (${r.g10.passedG10 ? 'PASÓ' : 'FALLÓ'})`,
  }))
);

const anyFailed = results.some((r) => !r.g8.passed || !r.g10.passedG10);
if (anyFailed) {
  process.exit(1);
}
