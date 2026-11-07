import { formatBalance } from '@/lib/domain/money';
import type { AccountKind } from '@/types/api';

export interface BalanceProps {
  cents: string;
  kind: AccountKind;
  className?: string;
  compactDecimals?: boolean;
}

/**
 * Delega toda la regla de signo en `formatBalance` — no la reimplementa, no recibe
 * nombre de cuenta ni pantalla (TASK-front.md U13, API-CONTRACT.md §4.5).
 */
export function Balance({ cents, kind, className, compactDecimals = true }: BalanceProps) {
  const { amount, suffix } = formatBalance(cents, kind);

  let formattedAmount: React.ReactNode = <span>{amount}</span>;
  if (compactDecimals) {
    const lastDot = amount.lastIndexOf('.');
    const lastComma = amount.lastIndexOf(',');
    const splitIdx = Math.max(lastDot, lastComma);

    if (splitIdx !== -1 && splitIdx > amount.length - 4) {
      const main = amount.slice(0, splitIdx);
      const decimals = amount.slice(splitIdx);
      formattedAmount = (
        <span aria-label={amount}>
          <span aria-hidden="true">{main}</span>
          <span aria-hidden="true" className="text-cents font-normal">
            {decimals}
          </span>
        </span>
      );
    }
  }

  return (
    <span className={className}>
      {formattedAmount}
      {suffix ? <span className="text-muted"> {suffix}</span> : null}
    </span>
  );
}
