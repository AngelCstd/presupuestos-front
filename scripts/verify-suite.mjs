// scripts/verify-suite.mjs — lo entrega la sesión de tests, NO el implementador.
// TASK-front.md §1.1: vitest sale con código 0 aunque haya tests saltados, y tampoco
// nota si falta un archivo entero declarado. Este script es el que de verdad decide si
// la suite pasa: corre vitest él mismo (ignorando el código de salida de vitest, que
// solo refleja "¿hay tests rojos?") y lee su reporte JSON para juzgar las cinco
// condiciones de la tabla de §1.1.
//
// `pnpm verify:suite` se declara como UN solo comando (`node scripts/verify-suite.mjs`)
// y no como `vitest run && node scripts/verify-suite.mjs`: con `&&`, un solo test rojo
// cortocircuitaría antes de que este script llegara a comprobar nada. Mientras la suite
// no tenga implementación real, numFailedTests > 0 es el estado correcto y esperado —
// lo que este script no debe perdonar nunca es un test saltado, un todo, o un conteo
// que no cuadra con tests/EXPECTED.json.

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const reportPath = path.resolve(repoRoot, '.vitest-report.json');
const expectedPath = path.resolve(repoRoot, 'tests', 'EXPECTED.json');

const vitestRun = spawnSync(
  'pnpm',
  ['exec', 'vitest', 'run', '--reporter=json', `--outputFile=${reportPath}`],
  { cwd: repoRoot, stdio: 'inherit' },
);

if (vitestRun.error) {
  console.error(`✗ verify-suite: no se pudo ejecutar vitest: ${vitestRun.error.message}`);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(readFileSync(reportPath, 'utf-8'));
} catch (err) {
  console.error(`✗ verify-suite: no se pudo leer ${reportPath} después de correr vitest.`);
  console.error(err.message);
  process.exit(1);
}

let expected;
try {
  expected = JSON.parse(readFileSync(expectedPath, 'utf-8'));
} catch (err) {
  console.error(`✗ verify-suite: no se pudo leer ${expectedPath}.`);
  console.error(err.message);
  process.exit(1);
}

let ok = true;
function fail(message) {
  ok = false;
  console.error(`✗ verify-suite: ${message}`);
}

const {
  numFailedTests = 0,
  numPendingTests = 0,
  numTodoTests = 0,
  numTotalTests = 0,
  testResults = [],
} = report;

if (numPendingTests !== 0) {
  fail(`hay ${numPendingTests} test(s) saltados (it.skip / describe.skip). No se permite ninguno.`);
} else {
  console.log('✓ numPendingTests === 0');
}

if (numTodoTests !== 0) {
  fail(`hay ${numTodoTests} test(s) todo (it.todo). No se permite ninguno.`);
} else {
  console.log('✓ numTodoTests === 0');
}

if (numTotalTests !== expected.totalTests) {
  fail(
    `numTotalTests (${numTotalTests}) no coincide con tests/EXPECTED.json (${expected.totalTests}). ` +
      'Se borró, se comentó o se agregó un test.',
  );
} else {
  console.log(`✓ numTotalTests === ${expected.totalTests}`);
}

const ranFiles = new Set(
  testResults.map((r) => path.relative(repoRoot, r.name).replace(/\\/g, '/')),
);

const missingFiles = expected.files.filter((relativeFile) => !ranFiles.has(relativeFile));

if (missingFiles.length > 0) {
  fail(`faltan archivos declarados en EXPECTED.json que no corrieron: ${missingFiles.join(', ')}`);
} else {
  console.log(`✓ los ${expected.files.length} archivos declarados en EXPECTED.json corrieron`);
}

if (numFailedTests !== 0) {
  // No es, por sí sola, una falla de ESTE script durante la sesión de tests: es el
  // estado correcto hasta que exista implementación real. Pero si TODO lo demás ya
  // está en orden (cero skipped, cero todo, conteo y archivos correctos) y aun así hay
  // tests rojos, verify:suite debe reflejarlo — es, después de todo, la puerta que
  // reemplaza a "pnpm test" en la condición de paro de TASK-front.md §1.
  fail(`numFailedTests = ${numFailedTests}. Todos los tests deben pasar para que la puerta cierre.`);
} else {
  console.log('✓ numFailedTests === 0');
}

if (!ok) {
  console.error('\nverify-suite: FALLÓ (ver arriba).');
  process.exit(1);
}

console.log('\nverify-suite: OK — cero skipped, cero todo, cero fallidos, conteo y archivos correctos.');
