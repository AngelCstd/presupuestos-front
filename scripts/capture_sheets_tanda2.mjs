import { captureRoute } from './capture_driver.mjs';

console.log('=== CAPTURANDO HOJAS EXPLICATIVAS (TANDA 2 SEGUNDA MITAD) ===\n');

// 1. Cuentas mostrando "Dinero neto" y chevron
console.log('1. Capturando /cuentas (Dinero neto)...');
await captureRoute('http://localhost:3001/cuentas', 'ux/cuentas');

// 2. Cuentas con NetMoneySheet abierta
console.log('2. Capturando /cuentas con NetMoneySheet abierta...');
await captureRoute('http://localhost:3001/cuentas', 'ux/cuentas-sheet', {
  evaluateBeforeCapture: () => {
    const card = document.querySelector('section[role="button"]');
    if (card) card.click();
  },
  isExemptFromG10: true,
});

// 3. Inicio mostrando "Por asignar" y chevron
console.log('3. Capturando / (Inicio)...');
await captureRoute('http://localhost:3001/', 'ux/inicio');

// 4. Inicio con UnassignedFundsSheet abierta
console.log('4. Capturando / con UnassignedFundsSheet abierta...');
await captureRoute('http://localhost:3001/', 'ux/inicio-sheet', {
  evaluateBeforeCapture: () => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const unassignedBtn = buttons.find((b) => b.innerText.includes('POR ASIGNAR') || b.innerText.includes('Por asignar'));
    if (unassignedBtn) unassignedBtn.click();
  },
  isExemptFromG10: true,
});

console.log('\n=== CAPTURAS DE HOJAS COMPLETADAS ===');
