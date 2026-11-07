import { spawn } from 'child_process';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONT_DIR = path.resolve(__dirname, '..');

// Lista de pantallas a auditar con G10
const screens = [
  { name: '1. Inicio (/)', script: 'capture_inicio.mjs', dir: '/tmp/preview_inicio' },
  { name: '2. Tarjeta sobre (/sobres)', script: 'capture_sobres.mjs', dir: '/tmp/preview_sobres' },
  { name: '3. Capturar gasto (/capturar/gasto)', script: 'capture_capturar_gasto.mjs', dir: '/tmp/preview_capturar_gasto', isModal: true },
  { name: '4. Movimientos (/movimientos)', script: 'capture_movimientos.mjs', dir: '/tmp/preview_movimientos' },
  { name: '5. Sobres (/sobres)', script: 'capture_sobres.mjs', dir: '/tmp/preview_sobres' },
  { name: '6. Cuentas (/cuentas)', script: 'capture_cuentas.mjs', dir: '/tmp/preview_cuentas' },
  { name: '7. Más (/mas)', script: 'capture_mas.mjs', dir: '/tmp/preview_mas' },
  { name: '8. Recordatorios (/recordatorios)', script: 'capture_recordatorios.mjs', dir: '/tmp/preview_recordatorios' },
  { name: '9. Cierre periodo (/periodos/[id]/cerrar)', script: 'capture_periodos_cerrar.mjs', dir: '/tmp/preview_periodos_cerrar' },
];

console.log("Corriendo scripts de captura y auditoría G10 en todas las pantallas...\n");

for (const s of screens) {
  // Aseguramos que el script corra
  console.log(`Auditoría de: ${s.name} (${s.script})`);
  // Ejecutamos el script
  const res = spawn('node', [path.join(FRONT_DIR, 'scripts', s.script)], { cwd: FRONT_DIR });
  await new Promise((resolve) => {
    let out = '';
    res.stdout.on('data', d => out += d.toString());
    res.stderr.on('data', d => out += d.toString());
    res.on('close', (code) => {
      // Extraer líneas de resultado
      const lines = out.split('\n').filter(l => l.includes('PASA') || l.includes('FALLA') || l.includes('despeje') || l.includes('lastBottom'));
      for (const l of lines.slice(-5)) {
        console.log('  ', l.trim());
      }
      resolve();
    });
  });
}
