import { formatMoney } from '@/lib/domain/money';

export interface MoneyProps {
  cents: string;
  currency?: string;
}

/** Pinta un monto. Nunca concatena un "$" a mano — todo pasa por `formatMoney`. */
export function Money({ cents, currency }: MoneyProps) {
  return <>{formatMoney(cents, currency)}</>;
}
