import { describe, expect, it } from 'vitest';
import { calculateRealMoney } from '@/lib/domain/accounts';
import type { AccountKind } from '@/types/api';

describe('calculateRealMoney — cálculo estricto de dinero real (API-CONTRACT.md §14)', () => {
  it('maneja el arreglo vacío devolviendo 0n', () => {
    expect(calculateRealMoney([])).toBe(0n);
  });

  it('suma solo cuentas cash cuando no hay deuda de crédito', () => {
    const accounts = [
      { kind: 'cash' as AccountKind, balanceCents: '500000' },
      { kind: 'cash' as AccountKind, balanceCents: '250000' },
    ];
    expect(calculateRealMoney(accounts)).toBe(750000n);
  });

  it('respeta el signo negativo de las cuentas credit (la deuda resta)', () => {
    const accounts = [
      { kind: 'cash' as AccountKind, balanceCents: '500000' },
      { kind: 'credit' as AccountKind, balanceCents: '-800000' },
    ];
    // $5,000 efectivo + (-$8,000 crédito) = -$3,000
    expect(calculateRealMoney(accounts)).toBe(-300000n);
  });

  it('ignora completamente las cuentas receivable (el dinero que te deben no cuenta)', () => {
    const accounts = [
      { kind: 'cash' as AccountKind, balanceCents: '100000' },
      { kind: 'credit' as AccountKind, balanceCents: '-30000' },
      { kind: 'receivable' as AccountKind, balanceCents: '9999999' },
    ];
    // Solo $1,000 - $300 = $700; los $99,999.99 por cobrar no inflan el dinero real
    expect(calculateRealMoney(accounts)).toBe(70000n);
  });

  it('con las cinco clases mezcladas, suma únicamente cash y credit e ignora category, income_source y receivable', () => {
    const accounts = [
      { kind: 'cash' as AccountKind, balanceCents: '200000' }, // +2,000
      { kind: 'credit' as AccountKind, balanceCents: '-50000' }, // -500
      { kind: 'receivable' as AccountKind, balanceCents: '150000' }, // ignorado
      { kind: 'category' as AccountKind, balanceCents: '75000' }, // ignorado (sobre)
      { kind: 'income_source' as AccountKind, balanceCents: '-300000' }, // ignorado (fuente de ingreso)
    ];
    expect(calculateRealMoney(accounts)).toBe(150000n); // 2000 - 500 = 1500
  });

  it('opera exactamente con BigInt arriba de 2^53 sin pérdida de precisión', () => {
    const bigCash = (BigInt(Number.MAX_SAFE_INTEGER) + 1000n).toString();
    const accounts = [{ kind: 'cash' as AccountKind, balanceCents: bigCash }];
    expect(calculateRealMoney(accounts)).toBe(BigInt(bigCash));
  });
});
