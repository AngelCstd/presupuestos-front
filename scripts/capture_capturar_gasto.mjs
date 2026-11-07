import { captureRoute } from './capture_driver.mjs';

const targetUrl = 'http://localhost:3001/capturar/gasto';
const outputDir = 'ux/capturar-gasto';

console.log(`Iniciando captura real para Capturar gasto en: ${targetUrl}`);
const results = await captureRoute(targetUrl, outputDir, { isExemptFromG10: true });

console.log('\n--- Mediciones mecánicas Capturar gasto (G8, G10, G12) ---');
console.table(
  results.map((r) => ({
    URL: r.url,
    Viewport: r.viewport,
    'Tiempo (ms)': r.responseTimeMs,
    'scrollWidth / innerWidth': `${r.g8.scrollWidth}px / ${r.g8.innerWidth}px`,
    'G8 Sin desborde': r.g8.passed ? 'PASÓ' : 'FALLÓ',
    '#last-element': r.g10.lastElementDesc,
    'ultimo.bottom': `${r.g10.lastBottom}px`,
    'tabBar.top': r.g10.tabBarTop !== null ? `${r.g10.tabBarTop}px` : 'N/A',
    'G10 Estado': r.g10.exempt ? 'EXENTA (sin barra fija)' : (r.g10.passedG10 ? 'PASÓ' : 'FALLÓ'),
  }))
);

const anyFailed = results.some((r) => !r.g8.passed || !r.g10.passedG10);
if (anyFailed) {
  process.exit(1);
}
