import type { AccountKind } from '@/types/api';

/**
 * Toda la aritmética usa BigInt. `Intl.NumberFormat` solo se consulta para aprender el
 * símbolo de moneda y los separadores de esta configuración regional — nunca para
 * formatear el número en sí, porque eso pasaría el valor por `Number` y lo corrompería
 * arriba de 2^53 (API-CONTRACT.md §4.1).
 */

function absCentsString(cents: string): string {
  return cents.startsWith('-') ? cents.slice(1) : cents;
}

function groupThousands(digits: string, separator: string): string {
  const chunks: string[] = [];
  for (let end = digits.length; end > 0; end -= 3) {
    chunks.push(digits.slice(Math.max(0, end - 3), end));
  }
  return chunks.reverse().join(separator);
}

export function formatMoney(cents: string, currency: string = 'MXN'): string {
  let resolvedCurrency = currency;
  let formatter: Intl.NumberFormat;
  try {
    formatter = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: resolvedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    // Moneda que no es ISO 4217: cae a MXN sin lanzar (TASK-front.md U2).
    resolvedCurrency = 'MXN';
    formatter = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: resolvedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  const isNegative = cents.startsWith('-');
  const totalCents = BigInt(absCentsString(cents));
  const wholeUnits = totalCents / 100n;
  const centRemainder = totalCents % 100n;

  // Un valor de referencia (±1) solo para leer el orden de las partes y los
  // separadores — el dígito real nunca pasa por aquí.
  const referenceParts = formatter.formatToParts(isNegative ? -1 : 1);
  const groupSeparator = referenceParts.find((p) => p.type === 'group')?.value ?? ',';
  const decimalSeparator = referenceParts.find((p) => p.type === 'decimal')?.value ?? '.';

  const amountText = `${groupThousands(wholeUnits.toString(), groupSeparator)}${decimalSeparator}${centRemainder
    .toString()
    .padStart(2, '0')}`;

  let numberInserted = false;
  return referenceParts
    .map((part) => {
      if (
        part.type === 'integer' ||
        part.type === 'group' ||
        part.type === 'decimal' ||
        part.type === 'fraction'
      ) {
        if (numberInserted) return '';
        numberInserted = true;
        return amountText;
      }
      return part.value;
    })
    .join('');
}

export function formatBalance(
  cents: string,
  kind: AccountKind,
): { amount: string; suffix: string | null } {
  switch (kind) {
    case 'credit':
      return { amount: formatMoney(absCentsString(cents)), suffix: 'debes' };
    case 'receivable':
      return {
        amount: formatMoney(cents),
        suffix: BigInt(cents) === 0n ? null : 'te deben',
      };
    case 'income_source':
      return { amount: formatMoney(absCentsString(cents)), suffix: null };
    case 'cash':
    case 'category':
    case 'system':
      // 'system' nunca debería llegar aquí — se filtra antes de pintar
      // (API-CONTRACT.md §4.5) — pero si llega, se comporta como 'cash'.
      return { amount: formatMoney(cents), suffix: null };
  }
}

export function splitEvenly(totalCents: string, parts: number): string[] {
  const total = BigInt(totalCents);
  const count = BigInt(parts);
  const base = total / count;
  const remainder = total % count;

  return Array.from({ length: parts }, (_, i) => (i === 0 ? base + remainder : base).toString());
}

const AMOUNT_INPUT_PATTERN = /^(-?)(\d+)(?:\.(\d{1,2}))?$/;

export function parseAmountInput(text: string): string | null {
  const cleaned = text.trim().replace(/\$/g, '').replace(/,/g, '');
  const match = AMOUNT_INPUT_PATTERN.exec(cleaned);
  if (!match) return null;

  const [, sign, wholePart, fractionPart] = match;
  const paddedFraction = (fractionPart ?? '').padEnd(2, '0');
  const cents = BigInt(wholePart ?? '0') * 100n + BigInt(paddedFraction || '0');

  return `${sign ?? ''}${cents.toString()}`;
}
