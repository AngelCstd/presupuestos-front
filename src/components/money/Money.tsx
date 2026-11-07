import { formatMoney } from '@/lib/domain/money';

export interface MoneyProps {
  cents: string;
  currency?: string;
  className?: string;
  compactDecimals?: boolean;
}

/** 
 * Pinta un monto. Nunca concatena un "$" a mano — todo pasa por `formatMoney`.
 * Por defecto reduce visualmente el tamaño de los centavos para dar jerarquía tipográfica.
 */
export function Money({ cents, currency, className, compactDecimals = true }: MoneyProps) {
  const formatted = formatMoney(cents, currency);

  if (!compactDecimals) {
    return <span className={className}>{formatted}</span>;
  }

  // Separar parte entera y decimal para que los centavos cedan jerarquía tipográfica
  const lastDot = formatted.lastIndexOf('.');
  const lastComma = formatted.lastIndexOf(',');
  const splitIdx = Math.max(lastDot, lastComma);

  if (splitIdx !== -1 && splitIdx > formatted.length - 4) {
    const main = formatted.slice(0, splitIdx);
    const decimals = formatted.slice(splitIdx);
    return (
      <span className={className} aria-label={formatted}>
        <span aria-hidden="true">{main}</span>
        <span aria-hidden="true" className="text-cents font-normal">
          {decimals}
        </span>
      </span>
    );
  }

  return <span className={className}>{formatted}</span>;
}
