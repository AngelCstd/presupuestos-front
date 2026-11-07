import { captureRoute } from './capture_driver.mjs';

console.log('=== RECAPTURANDO CAMBIOS DE ESTA TANDA ===\n');

// 1. Recordatorios con modal de confirmación abierto (mostrando Sobre destino: Servicios)
console.log('1. Capturando /recordatorios con modal de confirmación y sobre destino...');
await captureRoute('http://localhost:3001/recordatorios', 'ux/recordatorios-modal', {
  evaluateBeforeCapture: () => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const confirmBtn = buttons.find((b) => b.innerText.includes('Confirmar'));
    if (confirmBtn) confirmBtn.click();
  },
  isExemptFromG10: true,
});

// 2. Historial de movimientos ordenado (Totalplay arriba)
console.log('2. Capturando /movimientos con nuevo orden de BD (Totalplay hasta arriba)...');
await captureRoute('http://localhost:3001/movimientos', 'ux/movimientos');

// 3. Detalle de movimiento mostrando hora de registro (createdAt)
console.log('3. Capturando /movimientos/9c7aeb5e-3a01-40f9-ac66-3aaefc632e67 (Totalplay con hora de registro)...');
await captureRoute('http://localhost:3001/movimientos/9c7aeb5e-3a01-40f9-ac66-3aaefc632e67', 'ux/movimiento-detalle', {
  isExemptFromG10: true,
});

console.log('\n=== CAPTURAS COMPLETADAS ===');
