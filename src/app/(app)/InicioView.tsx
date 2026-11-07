'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Balance } from '@/components/money/Balance';
import { Money } from '@/components/money/Money';
import { Banner } from '@/components/layout/Banner';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { Skeleton } from '@/components/states/Skeleton';
import { EnvelopeStatusBadge } from '@/features/envelopes/components/EnvelopeStatusBadge';
import { HeroCard } from '@/features/dashboard/components/HeroCard';
import { UnassignedFundsSheet } from '@/features/dashboard/components/UnassignedFundsSheet';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';
import { useTimezone } from '@/providers/TimezoneProvider';
import { todayInTimeZone } from '@/lib/domain/dates';
import { isRealAccountKind, calculateRealMoney } from '@/lib/domain/accounts';
import { calculateEnvelopeProgress } from '@/lib/domain/envelopes';
import { ApiError } from '@/lib/api/errors';
import { es } from '@/lib/i18n/es';
import type { DashboardResponse, InsightCategoryBalance } from '@/types/api';

function calculateDaysRemaining(endsOn: string, today: string): number {
  const ends = new Date(`${endsOn}T12:00:00Z`).getTime();
  const current = new Date(`${today}T12:00:00Z`).getTime();
  const diffDays = Math.round((ends - current) / (1000 * 60 * 60 * 24));
  return diffDays;
}

function PeriodHeader({ dashboard }: { dashboard: DashboardResponse }) {
  const timezone = useTimezone();
  const today = todayInTimeZone(timezone);

  if (!dashboard.period) {
    return (
      <EmptyState
        tone="pendiente"
        title={es.inicio.noPeriodTitle}
        description={es.inicio.noPeriodDescription}
        action={
          <Link href="/periodos" className="text-sm font-medium text-primary underline">
            {es.inicio.createPeriod}
          </Link>
        }
      />
    );
  }

  const daysDiff = calculateDaysRemaining(dashboard.period.endsOn, today);

  const totalAssigned = dashboard.categories.reduce((acc, cat) => acc + BigInt(cat.assignedCents), 0n);
  const totalSpent = dashboard.categories.reduce((acc, cat) => acc + BigInt(cat.spentCents), 0n);
  const spentPercent =
    totalAssigned > 0n ? Math.min(Number((totalSpent * 100n) / totalAssigned), 100) : 0;

  const startMs = new Date(`${dashboard.period.startsOn}T12:00:00Z`).getTime();
  const endsMs = new Date(`${dashboard.period.endsOn}T12:00:00Z`).getTime();
  const currentMs = new Date(`${today}T12:00:00Z`).getTime();
  const totalDays = Math.max(1, Math.round((endsMs - startMs) / (1000 * 60 * 60 * 24)) + 1);
  const currentDay = Math.min(
    totalDays,
    Math.max(1, Math.round((currentMs - startMs) / (1000 * 60 * 60 * 24)) + 1),
  );

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted-background/40 p-4 shadow-sm min-w-0">
      <div className="flex items-center justify-between gap-2 text-xs text-muted min-w-0">
        <span className="shrink-0 font-medium text-foreground">
          {dashboard.period.startsOn} — {dashboard.period.endsOn}
        </span>
        {daysDiff < 0 ? (
          <span className="font-medium text-foreground truncate">{es.inicio.periodEnded}</span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5 min-w-0">
        <Link
          href={`/movimientos?from=${dashboard.period.startsOn}&to=${dashboard.period.endsOn}`}
          className="flex items-center justify-between gap-2 text-xs min-w-0 rounded p-1 -m-1 transition-colors active:scale-95 text-foreground active:bg-muted-background"
        >
          <span className="text-muted shrink-0">{es.inicio.periodSpentHeader}</span>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-medium text-foreground text-right truncate">
              <Money cents={totalSpent.toString()} />
              {es.inicio.ofTotal}
              <Money cents={totalAssigned.toString()} />
            </span>
            <span aria-hidden="true" className="text-muted shrink-0">
              ›
            </span>
          </div>
        </Link>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted-background">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${spentPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-2xs text-muted pt-0.5">
          <span>{es.inicio.paceTracker(currentDay, totalDays, Math.round(spentPercent))}</span>
        </div>
      </div>
    </div>
  );
}

function EnvelopeProgressItem({
  category,
  hasCoveringFunds = false,
}: {
  category: InsightCategoryBalance;
  hasCoveringFunds?: boolean;
}) {
  const { availablePercentage, overspentPercentage } = calculateEnvelopeProgress({
    assignedCents: category.assignedCents,
    spentCents: category.spentCents,
    availableCents: category.availableCents,
    status: category.status,
  });

  const isOverspent = category.status === 'overspent';
  const hasBudget = category.hasBudget;
  const isNoBudget = category.status === 'no_budget';
  const deficit = isOverspent ? -BigInt(category.availableCents) : 0n;

  const coverButtonColor = hasCoveringFunds ? 'bg-state-depleted' : 'bg-state-overspent';

  return (
    <li className="min-w-0">
      <div
        className={`flex flex-col gap-2 rounded-lg border p-3 shadow-sm min-w-0 ${
          isOverspent
            ? hasCoveringFunds
              ? 'border-state-depleted/40 bg-muted-background/30'
              : 'border-state-overspent/50 bg-muted-background/30'
            : isNoBudget
            ? 'border-dashed border-border/80 bg-muted-background/10'
            : 'border-border bg-background'
        }`}
      >
        <Link
          href={`/sobres/${category.categoryId}`}
          className="flex flex-col gap-2 min-w-0 active:scale-95 transition-transform"
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="min-w-0 truncate font-medium text-foreground">{category.name}</span>
            <div className="flex shrink-0 items-center gap-2">
              {category.status !== 'available' ? (
                <EnvelopeStatusBadge status={category.status} />
              ) : null}
              <span aria-hidden="true" className="text-muted shrink-0">
                ›
              </span>
            </div>
          </div>

          {!hasBudget ? (
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
                      <Money cents={category.assignedCents} />
                      {es.envelopeCard.assignedSuffix}
                    </>
                  ) : (
                    <>
                      {es.envelopeCard.remainingPrefix}
                      <span className="font-bold text-foreground">
                        <Money cents={category.availableCents} />
                      </span>
                      {es.envelopeCard.of}
                      <Money cents={category.assignedCents} />
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
        </Link>

        {isOverspent ? (
          <div className="flex justify-end pt-1 border-t border-border/40">
            <Link
              href={`/sobres?cubrir=${category.categoryId}`}
              className={`inline-flex items-center justify-center rounded-md ${coverButtonColor} px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition-transform hover:opacity-90 active:scale-95 shrink-0`}
            >
              {es.inicio.coverOverspend}
            </Link>
          </div>
        ) : null}
      </div>
    </li>
  );
}

function CategoriesSummaryBlock({ dashboard }: { dashboard: DashboardResponse }) {
  const [showNoBudget, setShowNoBudget] = useState(false);

  if (dashboard.period === null) {
    return null;
  }

  const allNoBudget =
    dashboard.categories.length > 0 &&
    dashboard.categories.every((category) => category.status === 'no_budget');

  if (allNoBudget) {
    return (
      <EmptyState
        tone="pendiente"
        title={es.inicio.noEnvelopesBudgeted}
        action={
          <Link href="/sobres" className="text-sm font-medium text-primary underline">
            {es.inicio.assignAction}
          </Link>
        }
      />
    );
  }

  const allNoSpend =
    dashboard.categories.length > 0 &&
    dashboard.categories.every((category) => category.spentCents === '0');

  // Ordenamiento explícito:
  // 1. overspent: mayor déficit primero
  const overspentCategories = [...dashboard.categories]
    .filter((cat) => cat.status === 'overspent')
    .sort((a, b) => {
      const diff = BigInt(a.availableCents) - BigInt(b.availableCents);
      if (diff < 0n) return -1;
      if (diff > 0n) return 1;
      return a.name.localeCompare(b.name, 'es');
    });

  // 2. depleted: orden alfabético
  const depletedCategories = [...dashboard.categories]
    .filter((cat) => cat.status === 'depleted')
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

  // 3. available: orden alfabético estable
  const availableCategories = [...dashboard.categories]
    .filter((cat) => cat.status === 'available')
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

  // 4. no_budget: orden alfabético al fondo
  const noBudgetCategories = [...dashboard.categories]
    .filter((cat) => cat.status === 'no_budget')
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

  const hasCoveringFunds = dashboard.categories.some(
    (c) => c.status !== 'overspent' && BigInt(c.availableCents) > 0n,
  );

  return (
    <div className="flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{es.inicio.envelopesTitle}</p>
        <Link href="/sobres" className="text-xs font-medium text-primary underline">
          {es.inicio.viewEnvelopes}
        </Link>
      </div>

      {allNoSpend && overspentCategories.length === 0 ? (
        <EmptyState tone="exito" title={es.inicio.noExpensesYet} />
      ) : (
        <ul className="flex flex-col gap-2 min-w-0">
          {/* 1. overspent */}
          {overspentCategories.map((category) => (
            <EnvelopeProgressItem
              key={category.categoryId}
              category={category}
              hasCoveringFunds={hasCoveringFunds}
            />
          ))}

          {/* 2. depleted */}
          {depletedCategories.map((category) => (
            <EnvelopeProgressItem
              key={category.categoryId}
              category={category}
              hasCoveringFunds={hasCoveringFunds}
            />
          ))}

          {/* 3. available */}
          {availableCategories.map((category) => (
            <EnvelopeProgressItem
              key={category.categoryId}
              category={category}
              hasCoveringFunds={hasCoveringFunds}
            />
          ))}

          {/* 4. no_budget */}
          {noBudgetCategories.length > 0 ? (
            <li className="pt-1">
              <button
                type="button"
                onClick={() => setShowNoBudget((prev) => !prev)}
                className="w-full text-left text-xs text-muted underline"
              >
                {es.inicio.noBudgetCount(noBudgetCategories.length)}
              </button>
              {showNoBudget ? (
                <ul className="mt-2 flex flex-col gap-2 min-w-0">
                  {noBudgetCategories.map((category) => (
                    <EnvelopeProgressItem
                      key={category.categoryId}
                      category={category}
                      hasCoveringFunds={hasCoveringFunds}
                    />
                  ))}
                </ul>
              ) : null}
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}

function AccountsBlock({ dashboard }: { dashboard: DashboardResponse }) {
  const realAccounts = dashboard.accounts.filter((account) => isRealAccountKind(account.kind));
  const cashAccounts = realAccounts.filter((a) => a.kind === 'cash');
  const creditAccounts = realAccounts.filter((a) => a.kind === 'credit');
  const receivableAccounts = realAccounts.filter((a) => a.kind === 'receivable');

  const cashTotal = cashAccounts.reduce((sum, a) => sum + BigInt(a.balanceCents), 0n);
  const creditTotal = creditAccounts.reduce((sum, a) => sum + BigInt(a.balanceCents), 0n);
  const realMoney = calculateRealMoney(dashboard.accounts);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted-background/30 p-4 shadow-sm min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted shrink-0">{es.inicio.accountsTitle}</p>
        <Link href="/cuentas" className="text-xs font-medium text-primary underline shrink-0">
          {es.inicio.viewPending}
        </Link>
      </div>

      <div className="flex flex-col gap-2 min-w-0">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted shrink-0">{es.inicio.cashTitle}</span>
          <span className="font-medium text-foreground text-right">
            <Money cents={cashTotal.toString()} />
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted shrink-0">{es.inicio.creditTitle}</span>
          <span className="font-medium text-foreground text-right">
            <Balance cents={creditTotal.toString()} kind="credit" />
          </span>
        </div>
        {receivableAccounts.length > 0 ? (
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted shrink-0">{es.inicio.receivableTitle}</span>
            <span className="font-medium text-foreground text-right">
              <Balance
                cents={receivableAccounts
                  .reduce((sum, a) => sum + BigInt(a.balanceCents), 0n)
                  .toString()}
                kind="receivable"
              />
            </span>
          </div>
        ) : null}
      </div>

      {realMoney < 0n ? (
        <div className="rounded border border-border/80 bg-background/60 p-2.5 text-xs text-muted">
          <p className="font-medium text-foreground">{es.inicio.negativeRealMoneySubtitle}</p>
          <p className="mt-0.5 leading-relaxed">{es.inicio.negativeRealMoneyDescription}</p>
        </div>
      ) : null}
    </div>
  );
}

export function InicioView() {
  const { data, isLoading, error } = useDashboard();
  const [unassignedSheetOpen, setUnassignedSheetOpen] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-4 min-w-0">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return <ErrorState code={error instanceof ApiError ? error.code : 'INTERNAL_ERROR'} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 p-4 min-w-0">
      {data.unbudgetedTransactions.length > 0 && data.unbudgetedTransactions[0] ? (
        <Banner
          message={es.inicio.unbudgetedBanner(data.unbudgetedTransactions.length)}
          action={
            <Link
              href={`/movimientos/${data.unbudgetedTransactions[0].transactionId}`}
              className="text-sm font-medium text-primary underline active:scale-95 inline-flex items-center gap-1"
            >
              <span>{es.inicio.viewPending}</span>
              <span aria-hidden="true" className="text-xs">›</span>
            </Link>
          }
        />
      ) : null}

      <PeriodHeader dashboard={data} />
      <HeroCard
        dashboard={data}
        onOpenUnassignedSheet={() => setUnassignedSheetOpen(true)}
      />
      <CategoriesSummaryBlock dashboard={data} />
      <AccountsBlock dashboard={data} />

      <UnassignedFundsSheet
        open={unassignedSheetOpen}
        onClose={() => setUnassignedSheetOpen(false)}
        dashboard={data}
      />
    </div>
  );
}
