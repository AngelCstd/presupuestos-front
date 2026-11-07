'use client';

import Link from 'next/link';
import { Money } from '@/components/money/Money';
import { EmptyState } from '@/components/states/EmptyState';
import { es } from '@/lib/i18n/es';
import type { DashboardResponse } from '@/types/api';

export interface HeroCardProps {
  dashboard: DashboardResponse;
  onOpenUnassignedSheet: () => void;
  hideEnvelopesLink?: boolean;
}

export function HeroCard({
  dashboard,
  onOpenUnassignedSheet,
  hideEnvelopesLink = false,
}: HeroCardProps) {
  const unassigned = BigInt(dashboard.unassignedCents);
  const overspentCategories = [...dashboard.categories]
    .filter((cat) => cat.status === 'overspent')
    .sort((a, b) => {
      const diff = BigInt(a.availableCents) - BigInt(b.availableCents);
      if (diff < 0n) return -1;
      if (diff > 0n) return 1;
      return a.name.localeCompare(b.name, 'es');
    });
  const overspentDeficit = overspentCategories.reduce((sum, cat) => {
    const avail = BigInt(cat.availableCents);
    return avail < 0n ? sum - avail : sum;
  }, 0n);

  const hasAnyBudgeted = dashboard.categories.some((category) => category.hasBudget);

  // Situation 1: Free money to distribute
  if (unassigned > 0n) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted-background/60 p-5 shadow-sm min-w-0">
        <button
          type="button"
          onClick={onOpenUnassignedSheet}
          className="flex flex-col gap-1 text-left active:scale-95 transition-transform"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              {es.field.unassignedCents}
            </p>
            <span aria-hidden="true" className="text-muted text-sm shrink-0">›</span>
          </div>
          <p className="text-hero font-bold tracking-tight text-foreground">
            <Money cents={dashboard.unassignedCents} />
          </p>
          <p className="text-xs text-muted">{es.inicio.readyToAssign}</p>
        </button>

        {!hideEnvelopesLink && (
          <div className="flex items-center justify-end border-t border-border/60 pt-3 text-xs">
            <Link
              href="/sobres"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-transform hover:opacity-95 active:scale-95 shrink-0"
            >
              {es.inicio.assignAction}
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Situation 2: Overspent categories
  if (overspentCategories.length > 0) {
    const count = overspentCategories.length;
    const overspentLabel =
      count === 1
        ? `1${es.inicio.overspentSingleSuffix}`
        : `${count}${es.inicio.overspentCountSuffix}`;

    const hasCoveringFunds = dashboard.categories.some(
      (cat) => cat.status !== 'overspent' && BigInt(cat.availableCents) > 0n,
    );

    const cardBorder = hasCoveringFunds
      ? 'border-state-depleted/40 bg-muted-background/60'
      : 'border-state-overspent/40 bg-muted-background/60';
    const titleColor = hasCoveringFunds ? 'text-state-depleted' : 'text-state-overspent';
    const amountColor = hasCoveringFunds ? 'text-foreground' : 'text-state-overspent';

    return (
      <div className={`flex flex-col gap-3 rounded-xl border p-5 shadow-sm min-w-0 ${cardBorder}`}>
        <div className="flex flex-col gap-1">
          <p className={`text-xs font-semibold uppercase tracking-wider ${titleColor}`}>
            {es.inicio.overspentHeroTitle}
          </p>
          <p className={`text-hero font-bold tracking-tight ${amountColor}`}>
            <Money cents={overspentDeficit.toString()} />
          </p>
          <p className="text-xs text-muted">{overspentLabel}</p>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs">
          <button
            type="button"
            onClick={onOpenUnassignedSheet}
            className="text-muted shrink-0 flex items-center gap-1 active:scale-95 transition-transform"
          >
            <span>
              {es.field.unassignedCents}:{' '}
              <Money cents={dashboard.unassignedCents.startsWith('-') ? '0' : dashboard.unassignedCents} />
            </span>
            <span aria-hidden="true" className="text-muted text-xs">›</span>
          </button>
          {!hideEnvelopesLink && (
            <Link
              href={overspentCategories.length === 1 && overspentCategories[0] ? `/sobres?cubrir=${overspentCategories[0].categoryId}` : '/sobres'}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-transform hover:opacity-95 active:scale-95 shrink-0"
            >
              {overspentCategories.length === 1 ? es.inicio.coverOverspend : es.inicio.reviewEnvelopes}
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Situations 3 & 4: unassigned === 0
  return hasAnyBudgeted ? (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenUnassignedSheet}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenUnassignedSheet();
        }
      }}
      className="cursor-pointer active:scale-95 transition-transform"
    >
      <EmptyState
        tone="exito"
        title={es.inicio.allAssignedTitle}
        description={es.inicio.allAssignedDescription}
      />
    </div>
  ) : (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenUnassignedSheet}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenUnassignedSheet();
        }
      }}
      className="cursor-pointer active:scale-95 transition-transform"
    >
      <EmptyState
        tone="pendiente"
        title={es.inicio.nothingAssignedTitle}
        description={es.inicio.nothingAssignedDescription}
        action={
          <Link
            href="/capturar/otro"
            className="text-sm font-medium text-primary underline"
            onClick={(e) => e.stopPropagation()}
          >
            {es.inicio.registerIncome}
          </Link>
        }
      />
    </div>
  );
}
