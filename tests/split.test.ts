import { describe, expect, it } from 'vitest';
import { splitEvenly } from '@/lib/domain/money';

function sum(parts: string[]): bigint {
  return parts.reduce((acc, p) => acc + BigInt(p), 0n);
}

describe('splitEvenly', () => {
  it('$100.00 entre 3 da 3334/3333/3333 — el residuo va a la primera parte', () => {
    expect(splitEvenly('10000', 3)).toEqual(['3334', '3333', '3333']);
  });

  it('una división exacta no deja residuo en ninguna parte', () => {
    expect(splitEvenly('9000', 3)).toEqual(['3000', '3000', '3000']);
  });

  it('con 1 parte, devuelve el total completo', () => {
    expect(splitEvenly('12345', 1)).toEqual(['12345']);
  });

  it('invariante: la suma de las partes es exactamente el total, para muchos casos', () => {
    const totals = ['1', '2', '3', '100', '10000', '999999', '7', '1000000000000'];
    const partsCounts = [1, 2, 3, 4, 5, 7, 11];

    for (const total of totals) {
      for (const parts of partsCounts) {
        const result = splitEvenly(total, parts);
        expect(result).toHaveLength(parts);
        expect(sum(result)).toBe(BigInt(total));
      }
    }
  });
});
