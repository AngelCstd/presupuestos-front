import Link from 'next/link';
import { Money } from '@/components/money/Money';
import { Badge } from '@/components/ui/Badge';
import { cx } from '@/lib/ui/cx';
import type { Transaction } from '@/types/api';

/**
 * Ambos registros de una corrección quedan visibles, siempre — no existe un filtro
 * para ocultarlas (TASK-front.md U19).
 */
export function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isReversed = transaction.reversedByTransactionId !== null;
  const isReversal = transaction.reversesTransactionId !== null;

  return (
    <Link
      href={`/movimientos/${transaction.id}`}
      className={cx(
        'flex items-center justify-between rounded-md border border-border p-3',
        isReversed && 'line-through opacity-60',
      )}
    >
      <div className="flex flex-col">
        <span className="text-foreground">{transaction.description}</span>
        <span className="text-xs text-muted">{transaction.bookedAt}</span>
      </div>
      <div className="flex items-center gap-2">
        {isReversed ? <Badge tone="neutral">Corregida</Badge> : null}
        {isReversal ? <Badge tone="neutral">Corrección</Badge> : null}
        <Money cents={transaction.totalCents} />
      </div>
    </Link>
  );
}
