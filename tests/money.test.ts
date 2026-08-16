import { describe, expect, it } from 'vitest';
import { formatMoney, parseAmountInput } from '@/lib/domain/money';

describe('formatMoney', () => {
  it('formatea un monto positivo en centavos a pesos con dos decimales', () => {
    expect(formatMoney('70000')).toBe('$700.00');
  });

  it('conserva el signo negativo', () => {
    expect(formatMoney('-250000')).toBe('-$2,500.00');
  });

  it('cero se pinta como $0.00, nunca como cadena vacía o guión', () => {
    expect(formatMoney('0')).toBe('$0.00');
  });

  it('es exacto arriba de 2^53 (BigInt, no Number)', () => {
    // 2^53 + 1 = 9007199254740993. Number lo redondearía en silencio.
    expect(formatMoney('9007199254740993')).toBe('$90,071,992,547,409.93');
  });

  it('sin currency, usa MXN por default', () => {
    expect(formatMoney('12300')).toBe('$123.00');
  });

  it('con currency USD, el símbolo sale de Intl — nunca concatenado a mano', () => {
    // Corregido por instrucción explícita del usuario (2026-08-16): TASK-front.md
    // afirmaba "US$700.00", pero Intl.NumberFormat('es-MX', { currency: 'USD' })
    // realmente produce "USD 700.00" en este runtime — no existe combinación de
    // opciones de Intl que dé "US$" para este locale/moneda. Forzar "US$" habría
    // exigido escribir el símbolo a mano, que es justo lo que esta regla prohíbe.
    // El espacio entre "USD" y el monto es U+00A0 (espacio de no separación), el que
    // Intl realmente produce — no un espacio normal. Ver PROGRESS.md.
    expect(formatMoney('70000', 'USD')).toBe('USD 700.00');
  });

  it('una moneda que no es ISO 4217 cae a MXN sin lanzar', () => {
    expect(() => formatMoney('70000', 'NO_ES_UNA_MONEDA')).not.toThrow();
    expect(formatMoney('70000', 'NO_ES_UNA_MONEDA')).toBe(formatMoney('70000'));
  });
});

describe('parseAmountInput', () => {
  it('acepta separador de miles con coma y decimales', () => {
    expect(parseAmountInput('1,234.56')).toBe('123456');
  });

  it('acepta el símbolo de moneda', () => {
    expect(parseAmountInput('$700')).toBe('70000');
  });

  it('acepta un decimal incompleto (un solo dígito) como centavos redondeados a la decena', () => {
    expect(parseAmountInput('1234.5')).toBe('123450');
  });

  it('acepta un entero sin decimales', () => {
    expect(parseAmountInput('700')).toBe('70000');
  });

  it('basura no numérica devuelve null', () => {
    expect(parseAmountInput('abc')).toBeNull();
  });

  it('dos puntos decimales devuelve null', () => {
    expect(parseAmountInput('12.34.56')).toBeNull();
  });

  it('cadena vacía devuelve null', () => {
    expect(parseAmountInput('')).toBeNull();
  });
});
