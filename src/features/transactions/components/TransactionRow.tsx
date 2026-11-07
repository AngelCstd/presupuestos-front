import Link from 'next/link';
import { Money } from '@/components/money/Money';
import { Badge } from '@/components/ui/Badge';
import { cx } from '@/lib/ui/cx';
import { es } from '@/lib/i18n/es';
import { formatCalendarDate } from '@/lib/domain/dates';
import { describeMovement, describeOpeningMovement } from '@/features/transactions/components/MovementLine';
import type { Transaction } from '@/types/api';

export function isOpeningBalanceTransaction(transaction: Transaction): boolean {
  const desc = transaction.description.trim().toLowerCase();
  if (desc === 'saldos iniciales' || desc === 'saldo inicial') {
    return true;
  }
  const nonSystem = transaction.movements?.filter((m) => m.accountKind !== 'system') ?? [];
  return (
    nonSystem.length > 0 &&
    nonSystem.every((m) => m.accountKind === 'cash' || m.accountKind === 'credit' || m.accountKind === 'receivable') &&
    (desc.includes('saldo') || desc.includes('inicial'))
  );
}

export function getTransactionDirection(transaction: Transaction): 'inflow' | 'outflow' | 'transfer' {
  const realMoneyMovements = transaction.movements?.filter(
    (m) => m.accountKind === 'cash' || m.accountKind === 'credit',
  ) ?? [];

  if (realMoneyMovements.length === 0) {
    return 'inflow';
  }

  const netCents = realMoneyMovements.reduce(
    (acc, m) => acc + BigInt(m.amountCents),
    0n,
  );

  if (netCents < 0n) return 'outflow';
  if (netCents > 0n) return 'inflow';
  return 'transfer';
}

/**
 * Ambos registros de una corrección quedan visibles, siempre — no existe un filtro
 * para ocultarlas (TASK-front.md U19).
 */
export function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isReversed = transaction.reversedByTransactionId !== null;
  const isReversal = transaction.reversesTransactionId !== null;
  const visibleMovements = transaction.movements?.filter((m) => m.accountKind !== 'system') ?? [];

  const isOpening = isOpeningBalanceTransaction(transaction);
  const direction = getTransactionDirection(transaction);
  const isOutflow = !isOpening && direction === 'outflow';
  const isInflow = !isOpening && direction === 'inflow';

  const cleanCents = transaction.totalCents.replace('-', '');
  const centsToFormat = isOutflow ? `-${cleanCents}` : cleanCents;

  return (
    <div
      className={cx(
        'relative flex flex-col gap-2 rounded-xl border border-border/80 bg-background p-3.5 transition-transform active:scale-95',
        isReversed && 'line-through opacity-60',
      )}
    >
      <Link
        href={`/movimientos/${transaction.id}`}
        className="absolute inset-0 z-0 rounded-xl"
        aria-label={transaction.description}
      />
      <div className="relative z-10 pointer-events-none flex flex-col gap-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <span className="text-sm font-medium text-foreground leading-snug break-words line-clamp-2 min-w-0">
            {transaction.description}
          </span>
          <span
            className={cx(
              'text-sm font-semibold inline-flex items-center shrink-0 pt-0.5',
              isInflow ? 'text-primary' : 'text-foreground',
            )}
          >
            {isInflow ? '+' : ''}
            <Money cents={centsToFormat} />
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span>{formatCalendarDate(transaction.bookedAt)}</span>
          {isReversed && transaction.reversedByTransactionId ? (
            <Link
              href={`/movimientos/${transaction.reversedByTransactionId}`}
              className="pointer-events-auto inline-flex items-center active:scale-95 transition-transform"
              aria-label="Ver corrección"
            >
              <Badge tone="neutral">{es.transactionsHistory.correctedBadge} ↗</Badge>
            </Link>
          ) : isReversed ? (
            <Badge tone="neutral">{es.transactionsHistory.correctedBadge}</Badge>
          ) : null}

          {isReversal && transaction.reversesTransactionId ? (
            <Link
              href={`/movimientos/${transaction.reversesTransactionId}`}
              className="pointer-events-auto inline-flex items-center active:scale-95 transition-transform"
              aria-label="Ver original"
            >
              <Badge tone="neutral">{es.transactionsHistory.correctionBadge} ↗</Badge>
            </Link>
          ) : isReversal ? (
            <Badge tone="neutral">{es.transactionsHistory.correctionBadge}</Badge>
          ) : null}
        </div>
      </div>

      {visibleMovements.length > 0 ? (
        <div className="relative z-10 pointer-events-none flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border/30 pt-2 text-xs text-muted">
          {visibleMovements.map((movement, idx) => (
            <span key={`${movement.accountId}-${idx}`} className="inline-flex items-center gap-2">
              <span>{isOpening ? describeOpeningMovement(movement) : describeMovement(movement)}</span>
              {idx < visibleMovements.length - 1 ? (
                <span aria-hidden="true" className="font-semibold text-muted select-none">·</span>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
