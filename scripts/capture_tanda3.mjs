import { captureRoute } from './capture_driver.mjs';

console.log('=== CAPTURANDO CAMBIOS DE TANDA 3 (TARJETA DE SOBRE, ENCABEZADO Y HOJA DE MOVER) ===\n');

// 1. Sobres normal (vista limpia, frase clara, bloque de Por asignar)
console.log('1. Capturando /sobres (vista limpia)...');
await captureRoute('http://localhost:3001/sobres', 'ux/sobres');

// 2. Sobres con ajuste inline desplegado
console.log('2. Capturando /sobres con [Ajustar presupuesto] desplegado...');
await captureRoute('http://localhost:3001/sobres', 'ux/sobres-ajustar', {
  evaluateBeforeCapture: () => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const adjustBtn = buttons.find((b) => b.innerText.includes('Ajustar presupuesto'));
    if (adjustBtn) adjustBtn.click();
  },
  isExemptFromG10: true,
});

// 3. Sobres con MoveFundsSheet abierta
console.log('3. Capturando /sobres con MoveFundsSheet abierta...');
await captureRoute('http://localhost:3001/sobres', 'ux/sobres-mover', {
  evaluateBeforeCapture: () => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const moveBtn = buttons.find((b) => b.innerText.trim() === 'Mover');
    if (moveBtn) moveBtn.click();
  },
  isExemptFromG10: true,
});

console.log('\n=== CAPTURAS TANDA 3 COMPLETADAS ===');
