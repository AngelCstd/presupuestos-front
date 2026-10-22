import { formatBalance } from '@/lib/domain/money';
import type { AccountKind } from '@/types/api';

export interface BalanceProps {
  cents: string;
  kind: AccountKind;
}

/**
 * Delega toda la regla de signo en `formatBalance` — no la reimplementa, no recibe
 * nombre de cuenta ni pantalla (TASK-front.md U13, API-CONTRACT.md §4.5).
 */
export function Balance({ cents, kind }: BalanceProps) {
  const { amount, suffix } = formatBalance(cents, kind);
  return (
    <span>
      {amount}
      {suffix ? <span className="text-muted"> {suffix}</span> : null}
    </span>
  );
}
