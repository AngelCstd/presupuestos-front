import { Balance } from '@/components/money/Balance';
import type { Movement } from '@/types/api';

/**
 * Traduce un movimiento a lenguaje de usuario — "movimiento contable", "asiento" y
 * "ledger" no aparecen nunca (API-CONTRACT.md §17, TASK-front.md U19). El monto usa
 * `formatBalance` vía `<Balance>`, aplicando la regla de signo por `accountKind`.
 */
function describeMovement(movement: Movement): string {
  const isOutgoing = movement.amountCents.startsWith('-');

  switch (movement.accountKind) {
    case 'cash':
    case 'credit':
      return isOutgoing ? `Salió de ${movement.accountName}` : `Entró a ${movement.accountName}`;
    case 'category':
      return isOutgoing ? `Se liberó de ${movement.accountName}` : `Se cargó a ${movement.accountName}`;
    case 'receivable':
      return isOutgoing ? `${movement.accountName} te pagó` : `${movement.accountName} te debe`;
    case 'income_source':
      return `Vino de ${movement.accountName}`;
    case 'system':
      // Nunca debería llegar aquí — se filtra antes de pintar (API-CONTRACT.md §4.5).
      return movement.accountName;
  }
}

export function MovementLine({ movement }: { movement: Movement }) {
  return (
    <li className="flex items-center justify-between text-sm">
      <span className="text-foreground">{describeMovement(movement)}</span>
      <Balance cents={movement.amountCents} kind={movement.accountKind} />
    </li>
  );
}
