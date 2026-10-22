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
  onSetAllocation?: (targetAssignedCents: string) => void;
  onCoverOverspend?: () => void;
  saving?: boolean;
  compact?: boolean;
}

export function CategoryCard({
  category,
  onSetAllocation,
  onCoverOverspend,
  saving,
  compact = false,
}: CategoryCardProps) {
  const period = category.period;
  const [draftAmount, setDraftAmount] = useState(period?.assignedCents ?? '0');

  if (!period) return null;

  const isNoBudget = period.status === 'no_budget';
  const isOverspent = period.status === 'overspent';
  const isDepleted = period.status === 'depleted';
  const isOverspentFromClosedPeriod = isOverspent && period.spentCents === '0';

  const assigned = BigInt(period.assignedCents);
  const available = BigInt(period.availableCents);
  // Semantica de la barra: Mide el monto que queda en la categoria,
  // concordando directamente con la cifra restante que tiene al lado.
  const availablePercentage =
    assigned > 0n
      ? Math.max(0, Math.min(Number((available * 100n) / assigned), 100))
      : 0;

  let progressColor = 'bg-state-available';
  if (isOverspent) progressColor = 'bg-state-overspent';
  else if (isDepleted) progressColor = 'bg-state-depleted';

  let cardBorder = 'border-border bg-background';
  if (isOverspent) {
    cardBorder = 'border-state-overspent/50 bg-muted-background/30';
  } else if (isNoBudget) {
    cardBorder = 'border-dashed border-border/80 bg-muted-background/10';
  }

  return (
    <div className={`flex flex-col gap-3 rounded-lg border p-4 ${cardBorder}`}>
      <div className="flex items-center justify-between">
        <Link
          href={`/sobres/${category.id}`}
          className="font-medium text-foreground underline-offset-2 hover:underline"
        >
          {category.name}
        </Link>
        <div className="flex items-center gap-2">
          <EnvelopeStatusBadge status={period.status} />
          {compact && isOverspent && onCoverOverspend ? (
            <button
              type="button"
              onClick={onCoverOverspend}
              className="rounded bg-state-overspent/10 px-2 py-0.5 text-xs font-medium text-state-overspent underline"
            >
              {es.envelopeCard.coverAction}
            </button>
          ) : null}
        </div>
      </div>

      {isNoBudget ? (
        <p className="text-xs text-muted">{es.envelopeCard.noBudgetPrompt}</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">
              <Money cents={period.spentCents} />
              {es.envelopeCard.spentOf}
              <Money cents={period.assignedCents} />
            </span>
            <span
              className={`font-semibold ${
                isOverspent ? 'text-state-overspent' : 'text-foreground'
              }`}
            >
              <Money cents={period.availableCents} />
            </span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted-background">
            <div
              className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
              style={{ width: `${availablePercentage}%` }}
            />
          </div>
        </div>
      )}

      {isOverspentFromClosedPeriod ? (
        <p className="rounded bg-state-overspent/5 p-2 text-xs text-muted leading-relaxed">
          {es.envelopeCard.lateCaptureNotice}
        </p>
      ) : null}

      {!compact && onSetAllocation ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2">
          <div className="flex items-center gap-2">
            <AmountInput
              value={draftAmount}
              onChange={setDraftAmount}
              className="max-w-[8.5rem]"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              loading={saving}
              onClick={() => onSetAllocation(draftAmount)}
            >
              {es.envelopeCard.saveAction}
            </Button>
          </div>

          {isOverspent && onCoverOverspend ? (
            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={onCoverOverspend}
            >
              {es.envelopeCard.coverAction}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
