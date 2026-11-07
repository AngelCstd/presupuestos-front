'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Money } from '@/components/money/Money';
import { AmountInput } from '@/components/money/AmountInput';
import { Button } from '@/components/ui/Button';
import { EnvelopeStatusBadge } from '@/features/envelopes/components/EnvelopeStatusBadge';
import { calculateEnvelopeProgress } from '@/lib/domain/envelopes';
import { es } from '@/lib/i18n/es';
import type { Category } from '@/types/api';

export interface CategoryCardProps {
  category: Category;
  onSetAllocation?: (targetAssignedCents: string) => void;
  onCoverOverspend?: () => void;
  onMoveFunds?: () => void;
  saving?: boolean;
  compact?: boolean;
  hasCoveringFunds?: boolean;
}

export function CategoryCard({
  category,
  onSetAllocation,
  onCoverOverspend,
  onMoveFunds,
  saving,
  compact = false,
  hasCoveringFunds = true,
}: CategoryCardProps) {
  const period = category.period;
  const initialDraft =
    period && BigInt(period.assignedCents) < 0n ? '0' : (period?.assignedCents ?? '0');
  const [draftAmount, setDraftAmount] = useState(initialDraft);
  const [isEditing, setIsEditing] = useState(false);

  if (!period) return null;

  const isNoBudget = period.status === 'no_budget';
  const isOverspent = period.status === 'overspent';
  const isOverspentFromClosedPeriod = isOverspent && period.spentCents === '0';
  const deficit = isOverspent ? -BigInt(period.availableCents) : 0n;

  const { availablePercentage, overspentPercentage } = calculateEnvelopeProgress({
    assignedCents: period.assignedCents,
    spentCents: period.spentCents,
    availableCents: period.availableCents,
    status: period.status,
  });

  let cardBorder = 'border-border bg-background';
  if (isOverspent) {
    cardBorder = hasCoveringFunds
      ? 'border-state-depleted/40 bg-muted-background/30'
      : 'border-state-overspent/50 bg-muted-background/30';
  } else if (isNoBudget) {
    cardBorder = 'border-dashed border-border/80 bg-muted-background/10';
  }

  return (
    <div className={`flex flex-col gap-3 rounded-lg border p-4 ${cardBorder}`}>
      <Link
        href={`/sobres/${category.id}`}
        className="flex flex-col gap-3 min-w-0 active:scale-95 transition-transform"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-foreground">{category.name}</span>
          <div className="flex items-center gap-2 shrink-0">
            {period.status !== 'available' ? (
              <EnvelopeStatusBadge status={period.status} />
            ) : null}
            <span aria-hidden="true" className="text-muted shrink-0">
              ›
            </span>
          </div>
        </div>

        {isNoBudget ? (
          <p className="text-xs text-muted">{es.envelopeCard.noBudgetPrompt}</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">
                {isOverspent ? (
                  <>
                    {es.envelopeCard.overspentPrefix}
                    <span className="font-bold text-state-overspent">
                      <Money cents={deficit.toString()} />
                    </span>
                    {es.envelopeCard.of}
                    <Money cents={period.assignedCents} />
                    {es.envelopeCard.assignedSuffix}
                  </>
                ) : (
                  <>
                    {es.envelopeCard.remainingPrefix}
                    <span className="font-bold text-foreground">
                      <Money cents={period.availableCents} />
                    </span>
                    {es.envelopeCard.of}
                    <Money cents={period.assignedCents} />
                    {es.envelopeCard.assignedSuffix}
                  </>
                )}
              </span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted-background">
              {isOverspent ? (
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    hasCoveringFunds ? 'progress-deficit-coverable' : 'progress-deficit-danger'
                  }`}
                  style={{ width: `${overspentPercentage}%` }}
                />
              ) : (
                <div
                  className="h-full rounded-full bg-state-available transition-all duration-300"
                  style={{ width: `${availablePercentage}%` }}
                />
              )}
            </div>
          </div>
        )}

        {isOverspentFromClosedPeriod ? (
          <div className="rounded-lg border border-state-overspent/30 bg-state-overspent/10 p-3 text-xs leading-relaxed text-foreground">
            <p className="font-semibold text-state-overspent mb-1">
              {es.envelopeCard.lateCaptureAdjustment}
            </p>
            <p className="text-muted">
              {es.envelopeCard.lateCaptureNotice}
            </p>
          </div>
        ) : null}
      </Link>

      {compact && isOverspent && onCoverOverspend ? (
        <div className="flex justify-end pt-1 border-t border-border/40">
          <button
            type="button"
            onClick={onCoverOverspend}
            className={`rounded px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition-transform hover:opacity-90 active:scale-95 ${
              hasCoveringFunds ? 'bg-state-depleted' : 'bg-state-overspent'
            }`}
          >
            {es.envelopeCard.coverAction}
          </button>
        </div>
      ) : null}

      {!compact && onSetAllocation ? (
        isEditing ? (
          <div className="flex flex-col gap-1.5 border-t border-border/40 pt-2.5">
            <span className="text-2xs font-semibold uppercase tracking-wider text-muted">
              {es.envelopeCard.allocatedBudgetLabel}
            </span>
            <div className="flex items-center gap-2">
              <AmountInput
                value={draftAmount}
                onChange={setDraftAmount}
                className="max-w-36"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  setIsEditing(false);
                  setDraftAmount(initialDraft);
                }}
              >
                {es.envelopeCard.cancelAction}
              </Button>
              <Button
                type="button"
                size="sm"
                loading={saving}
                onClick={() => {
                  onSetAllocation(draftAmount);
                  setIsEditing(false);
                }}
              >
                {es.envelopeCard.changeAction}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-2 text-xs">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="font-medium text-muted hover:text-foreground active:scale-95 transition-transform"
            >
              {isNoBudget ? es.envelopeCard.assignBudgetAction : es.envelopeCard.adjustBudgetAction}
            </button>

            {!isNoBudget && (
              <button
                type="button"
                onClick={isOverspent ? onCoverOverspend : onMoveFunds}
                className={`font-semibold active:scale-95 transition-transform ${
                  isOverspent
                    ? hasCoveringFunds
                      ? 'text-state-depleted hover:opacity-90'
                      : 'text-state-overspent hover:opacity-90'
                    : 'text-primary hover:underline'
                }`}
              >
                {isOverspent ? es.envelopeCard.coverAction : es.envelopeCard.moveAction}
              </button>
            )}
          </div>
        )
      ) : null}
    </div>
  );
}
