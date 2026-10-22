import Link from 'next/link';
import type { BudgetImpact } from '@/types/api';

/**
 * `budgetImpact` solo se conoce con la respuesta del servidor — nunca se pinta antes
 * de guardar (ARCHITECTURE-front.md §5.3, TASK-front.md U18). Los cuatro estados,
 * exactamente el texto de SCREENS-front.md /capturar/gasto.
 */
export function BudgetImpactMessage({ budgetImpact }: { budgetImpact: BudgetImpact }) {
  if (budgetImpact.status === 'in_open_period') return null;

  if (budgetImpact.status === 'compensated') {
    return (
      <div className="rounded-md border border-border bg-muted-background p-3 text-sm text-foreground">
        {budgetImpact.compensations.map((compensation) => (
          <p key={compensation.categoryId}>
            Se descontó de {compensation.categoryName} en el periodo actual, porque ese periodo ya está cerrado.
          </p>
        ))}
      </div>
    );
  }

  if (budgetImpact.status === 'uncompensated') {
    return (
      <div className="rounded-md border border-border bg-muted-background p-3 text-sm text-foreground">
        <p>El gasto afectó tu saldo pero ningún periodo.</p>
        <Link href="/periodos" className="font-medium text-primary underline">
          Crear periodo actual
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-muted-background p-3 text-sm text-foreground">
      <p>Este movimiento no cae en ningún periodo.</p>
      <Link href="/movimientos" className="font-medium text-primary underline">
        Ver pendientes
      </Link>
    </div>
  );
}
