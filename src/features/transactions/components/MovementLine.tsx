import { formatMoney } from '@/lib/domain/money';
import type { Movement } from '@/types/api';

/**
 * Traduce un movimiento de saldo inicial con su propio tratamiento factual:
 * "BBVA Débito empezó con $X", "Tarjeta BBVA Oro empezó debiendo $Y".
 */
export function describeOpeningMovement(movement: Movement): string {
  const rawCents = movement.amountCents;
  const isNegative = rawCents.startsWith('-');
  const cleanCents = isNegative ? rawCents.slice(1) : rawCents;
  const formatted = formatMoney(cleanCents);

  if (movement.accountKind === 'credit') {
    return isNegative
      ? `${movement.accountName} empezó debiendo ${formatted}`
      : `${movement.accountName} empezó con saldo a favor de ${formatted}`;
  }
  if (movement.accountKind === 'receivable') {
    return `${movement.accountName} te debía ${formatted}`;
  }
  return `${movement.accountName} empezó con ${formatted}`;
}

/**
 * Traduce un movimiento a lenguaje de usuario — "movimiento contable", "asiento" y
 * "ledger" no aparecen nunca (API-CONTRACT.md §17, TASK-front.md U19). El monto usa
 * `formatBalance` vía `<Balance>`, aplicando la regla de signo por `accountKind`.
 */
export function describeMovement(movement: Movement): string {
  const isOutgoing = movement.amountCents.startsWith('-');

  switch (movement.accountKind) {
    case 'cash':
    case 'credit':
      return isOutgoing ? `Salió de ${movement.accountName}` : `Entró a ${movement.accountName}`;
    case 'category':
      return isOutgoing ? `Volvió a ${movement.accountName}` : `Se cargó a ${movement.accountName}`;
    case 'receivable':
      return isOutgoing ? `${movement.accountName} te pagó` : `${movement.accountName} te debe`;
    case 'income_source':
      return isOutgoing ? `Vino de ${movement.accountName}` : `Se canceló de ${movement.accountName}`;
    case 'system':
      // Nunca debería llegar aquí — se filtra antes de pintar (API-CONTRACT.md §4.5).
      return movement.accountName;
  }
}

export function MovementLine({
  movement,
  isOpening = false,
}: {
  movement: Movement;
  isOpening?: boolean;
}) {
  if (movement.accountKind === 'system') return null;

  return (
    <li className="flex items-center text-sm text-foreground">
      <span>{isOpening ? describeOpeningMovement(movement) : describeMovement(movement)}</span>
    </li>
  );
}
