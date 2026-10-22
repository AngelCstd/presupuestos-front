'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Money } from '@/components/money/Money';
import { AmountInput } from '@/components/money/AmountInput';
import { Button } from '@/components/ui/Button';
import { EnvelopeStatusBadge } from '@/features/envelopes/components/EnvelopeStatusBadge';
import { es } from '@/lib/i18n/es';
import type { Category } from '@/types/api';

export interface CategoryCardProps {
  category: Category;
  onSetAllocation: (targetAssignedCents: string) => void;
  onCoverOverspend: () => void;
  saving?: boolean;
}

/**
 * Cada tarjeta trae nombre, los tres montos del periodo y el estado con su color, más
 * un campo para fijar lo asignado (SCREENS-front.md — mapa de pantallas de sobres).
 * `no_budget` se pinta visiblemente distinto de `depleted`: sin el monto que muestran
 * los otros tres estados, no "$0.00" (TASK-front.md U17).
 */
export function CategoryCard({ category, onSetAllocation, onCoverOverspend, saving }: CategoryCardProps) {
  const period = category.period;
  const [draftAmount, setDraftAmount] = useState(period?.assignedCents ?? '0');

  if (!period) return null;

  const isNoBudget = period.status === 'no_budget';
  const isOverspentFromClosedPeriod = period.status === 'overspent' && period.spentCents === '0';

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <Link href={`/sobres/${category.id}`} className="font-medium text-foreground underline-offset-2 hover:underline">
          {category.name}
        </Link>
        <EnvelopeStatusBadge status={period.status} />
      </div>

      {isNoBudget ? (
        <p className="text-sm text-muted">{es.envelopeStatus.no_budget}</p>
      ) : (
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="text-muted">{es.field.assignedCents}</dt>
            <dd className="text-foreground">
              <Money cents={period.assignedCents} />
            </dd>
          </div>
          <div>
            <dt className="text-muted">{es.field.spentCents}</dt>
            <dd className="text-foreground">
              <Money cents={period.spentCents} />
            </dd>
          </div>
          <div>
            <dt className="text-muted">{es.field.availableCents}</dt>
            <dd className={period.status === 'overspent' ? 'text-state-overspent' : 'text-foreground'}>
              <Money cents={period.availableCents} />
            </dd>
          </div>
        </dl>
      )}

      {isOverspentFromClosedPeriod ? (
        <p className="text-sm text-muted">
          Es un gasto del periodo pasado, ya cerrado. Se cubre con esta.
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <AmountInput value={draftAmount} onChange={setDraftAmount} className="max-w-[10rem]" />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={saving}
          onClick={() => onSetAllocation(draftAmount)}
        >
          Guardar
        </Button>
      </div>

      {period.status === 'overspent' ? (
        <Button type="button" size="sm" variant="danger" onClick={onCoverOverspend}>
          Cubrir
        </Button>
      ) : null}
    </div>
  );
}
