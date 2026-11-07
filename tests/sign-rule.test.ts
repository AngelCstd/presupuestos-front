import { describe, expect, it } from 'vitest';
import { formatBalance } from '@/lib/domain/money';

describe('formatBalance — la regla de signo depende exclusivamente del kind', () => {
  it('credit: valor absoluto + "debes", en cualquier pantalla', () => {
    expect(formatBalance('-250000', 'credit')).toEqual({ amount: '$2,500.00', suffix: 'debes' });
  });

  it('cash: tal cual, sin sufijo — mismo monto, kind distinto, resultado distinto', () => {
    expect(formatBalance('-250000', 'cash')).toEqual({ amount: '-$2,500.00', suffix: null });
  });

  it('receivable: tal cual + "te deben"', () => {
    expect(formatBalance('50000', 'receivable')).toEqual({ amount: '$500.00', suffix: 'te deben' });
  });

  it('receivable en cero: sin sufijo "te deben"', () => {
    expect(formatBalance('0', 'receivable')).toEqual({ amount: '$0.00', suffix: null });
  });

  it('category: tal cual, sin sufijo', () => {
    expect(formatBalance('125000', 'category')).toEqual({ amount: '$1,250.00', suffix: null });
  });

  it('income_source: valor absoluto, sin sufijo — el acumulado histórico es negativo', () => {
    expect(formatBalance('-1000000', 'income_source')).toEqual({
      amount: '$10,000.00',
      suffix: null,
    });
  });

  // La firma fijada (TASK-front.md §6.1) ya solo admite (cents, kind) — TypeScript
  // rechaza en tiempo de compilación cualquier llamada con nombre o pantalla como
  // tercer argumento. No hay una comprobación de runtime que agregue aquí, y una
  // basada en .length pasaría igual contra un stub sin implementar.
});
