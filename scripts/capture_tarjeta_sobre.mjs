import { captureRoute } from './capture_driver.mjs';

const targetUrl = 'http://localhost:3001/sobres';
const outputDir = 'ux/tarjeta-sobre';

console.log(`Iniciando captura real para Tarjetas de sobre en: ${targetUrl}`);
const results = await captureRoute(targetUrl, outputDir);

console.log('\n--- Mediciones mecánicas Tarjeta de sobre (G8, G10, G12) ---');
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
