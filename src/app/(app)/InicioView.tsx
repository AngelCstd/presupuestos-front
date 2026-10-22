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
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';
import { useTimezone } from '@/providers/TimezoneProvider';
import { todayInTimeZone } from '@/lib/domain/dates';
import { isRealAccountKind, calculateRealMoney } from '@/lib/domain/accounts';
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
  let daysLabel: string;
  if (daysDiff < 0) {
    daysLabel = es.inicio.periodEnded;
  } else if (daysDiff === 0) {
    daysLabel = es.inicio.periodEndsToday;
  } else {
    daysLabel = `${daysDiff}${es.inicio.daysRemainingSuffix}`;
  }

  const totalAssigned = dashboard.categories.reduce((acc, cat) => acc + BigInt(cat.assignedCents), 0n);
  const totalSpent = dashboard.categories.reduce((acc, cat) => acc + BigInt(cat.spentCents), 0n);
  const spentPercent =
    totalAssigned > 0n ? Math.min(Number((totalSpent * 100n) / totalAssigned), 100) : 0;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted-background/40 p-4">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          {dashboard.period.startsOn} — {dashboard.period.endsOn}
        </span>
        <span className="font-medium text-foreground">{daysLabel}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">{es.inicio.periodSpentHeader}</span>
          <span className="font-medium text-foreground">
            <Money cents={totalSpent.toString()} />
            {es.inicio.ofTotal}
            <Money cents={totalAssigned.toString()} />
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted-background">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${spentPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function HeroCard({ dashboard }: { dashboard: DashboardResponse }) {
  const realMoney = calculateRealMoney(dashboard.accounts);

  const overspentCategories = dashboard.categories.filter((cat) => cat.status === 'overspent');
  const overspentDeficit = overspentCategories.reduce((sum, cat) => {
    const avail = BigInt(cat.availableCents);
    return avail < 0n ? sum - avail : sum;
  }, 0n);

  const unassigned = BigInt(dashboard.unassignedCents);
  const hasAnyBudgeted = dashboard.categories.some((category) => category.hasBudget);

  // Situación 1: Dinero real negativo (Tarjetas superan efectivo)
  if (realMoney < 0n) {
    const cardExcess = -realMoney;
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted-background/60 p-5">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">
            {es.inicio.negativeRealMoneyTitle}
          </p>
          <p className="text-3xl font-semibold text-foreground">
            <Money cents={cardExcess.toString()} />
          </p>
          <p className="text-xs text-muted">{es.inicio.negativeRealMoneySubtitle}</p>
        </div>

        <p className="text-xs text-foreground/80 leading-relaxed">
          {es.inicio.negativeRealMoneyDescription}
        </p>

        <div className="flex items-center justify-between border-t border-border/60 pt-2 text-xs">
          <span className="text-muted">
            {es.field.unassignedCents}: <Money cents="0" />
          </span>
          <Link href="/cuentas" className="font-medium text-primary underline">
            {es.inicio.viewAccounts}
          </Link>
        </div>
      </div>
    );
  }

  // Situacion 2: Categorias en sobregiro con dinero real positivo
  if (overspentCategories.length > 0) {
    const count = overspentCategories.length;
    const overspentLabel =
      count === 1
        ? `1${es.inicio.overspentSingleSuffix}`
        : `${count}${es.inicio.overspentCountSuffix}`;

    return (
      <div className="flex flex-col gap-3 rounded-lg border border-state-overspent/40 bg-muted-background/60 p-5">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-state-overspent uppercase tracking-wider">
            {es.inicio.overspentHeroTitle}
          </p>
          <p className="text-3xl font-semibold text-state-overspent">
            <Money cents={overspentDeficit.toString()} />
          </p>
          <p className="text-xs text-muted">{overspentLabel}</p>
        </div>

        <div className="flex items-center justify-between border-t border-border/60 pt-2 text-xs">
          <span className="text-muted">
            {es.field.unassignedCents}: <Money cents="0" />
          </span>
          <Link href="/sobres" className="font-medium text-primary underline">
            {es.inicio.reviewEnvelopes}
          </Link>
        </div>
      </div>
    );
  }

  // Situación 3: Dinero libre para repartir
  if (unassigned > 0n) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted-background/60 p-5">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">
            {es.field.unassignedCents}
          </p>
          <p className="text-3xl font-semibold text-foreground">
            <Money cents={dashboard.unassignedCents} />
          </p>
          <p className="text-xs text-muted">{es.inicio.readyToAssign}</p>
        </div>

        <div className="border-t border-border/60 pt-2">
          <Link href="/sobres" className="text-xs font-medium text-primary underline">
            {es.inicio.assignAction}
          </Link>
        </div>
      </div>
    );
  }

  // Situación 4 y 5: unassigned === 0 (Todo repartido vs. Aún no repartes nada)
  return hasAnyBudgeted ? (
    <EmptyState
      tone="exito"
      title={es.inicio.allAssignedTitle}
      description={es.inicio.allAssignedDescription}
    />
  ) : (
    <EmptyState
      tone="pendiente"
      title={es.inicio.nothingAssignedTitle}
      description={es.inicio.nothingAssignedDescription}
      action={
        <Link href="/capturar/otro" className="text-sm font-medium text-primary underline">
          {es.inicio.registerIncome}
        </Link>
      }
    />
  );
}

function EnvelopeProgressItem({ category }: { category: InsightCategoryBalance }) {
  const assigned = BigInt(category.assignedCents);
  const spent = BigInt(category.spentCents);
  const isOverspent = category.status === 'overspent';
  const isDepleted = category.status === 'depleted';
  const hasBudget = category.hasBudget;

  const percentage = assigned > 0n ? Math.min(Number((spent * 100n) / assigned), 100) : 0;

  let progressColor = 'bg-state-available';
  if (isOverspent) progressColor = 'bg-state-overspent';
  else if (isDepleted) progressColor = 'bg-state-depleted';

  return (
    <li
      className={`flex flex-col gap-2 rounded-lg border p-3 ${
        isOverspent
          ? 'border-state-overspent/50 bg-muted-background/30'
          : 'border-border bg-background'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-foreground">{category.name}</span>
        <div className="flex items-center gap-2">
          <EnvelopeStatusBadge status={category.status} />
          {hasBudget ? (
            <span
              className={`font-medium ${isOverspent ? 'text-state-overspent' : 'text-foreground'}`}
            >
              <Money cents={category.availableCents} />
            </span>
          ) : null}
          {isOverspent ? (
            <Link
              href="/sobres"
              className="rounded bg-state-overspent/10 px-2 py-0.5 text-xs font-medium text-state-overspent underline"
            >
              {es.inicio.coverOverspend}
            </Link>
          ) : null}
        </div>
      </div>

      {hasBudget ? (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted-background">
          <div
            className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      ) : null}
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

  const overspentCategories = dashboard.categories.filter((cat) => cat.status === 'overspent');
  const activeCategories = dashboard.categories.filter(
    (cat) => cat.status === 'available' || cat.status === 'depleted',
  );
  const noBudgetCategories = dashboard.categories.filter((cat) => cat.status === 'no_budget');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{es.inicio.envelopesTitle}</p>
        <Link href="/sobres" className="text-xs font-medium text-primary underline">
          {es.inicio.assignAction}
        </Link>
      </div>

      {allNoSpend && overspentCategories.length === 0 ? (
        <EmptyState tone="exito" title={es.inicio.noExpensesYet} />
      ) : (
        <ul className="flex flex-col gap-2">
          {/* 1. Categorias en sobregiro primero */}
          {overspentCategories.map((category) => (
            <EnvelopeProgressItem key={category.categoryId} category={category} />
          ))}

          {/* 2. Categorias activas con presupuesto */}
          {activeCategories.map((category) => (
            <EnvelopeProgressItem key={category.categoryId} category={category} />
          ))}

          {/* 3. Categorias sin presupuesto (colapsadas) */}
          {noBudgetCategories.length > 0 ? (
            <li className="pt-1">
              <button
                type="button"
                onClick={() => setShowNoBudget((prev) => !prev)}
                className="w-full text-left text-xs text-muted underline"
              >
                {`${noBudgetCategories.length}${es.inicio.noBudgetCountSuffix}`}
              </button>
              {showNoBudget ? (
                <ul className="mt-2 flex flex-col gap-2">
                  {noBudgetCategories.map((category) => (
                    <EnvelopeProgressItem key={category.categoryId} category={category} />
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

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted-background/30 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{es.inicio.accountsTitle}</p>
        <Link href="/cuentas" className="text-xs font-medium text-primary underline">
          {es.inicio.viewPending}
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">{es.inicio.cashTitle}</span>
          <span className="font-medium text-foreground">
            <Money cents={cashTotal.toString()} />
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">{es.inicio.creditTitle}</span>
          <span className="font-medium text-foreground">
            <Balance cents={creditTotal.toString()} kind="credit" />
          </span>
        </div>
        {receivableAccounts.length > 0 ? (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">{es.inicio.receivableTitle}</span>
            <span className="font-medium text-foreground">
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
    </div>
  );
}

export function InicioView() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState code={error instanceof ApiError ? error.code : 'INTERNAL_ERROR'} />;
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      {data.unbudgetedTransactions.length > 0 ? (
        <Banner
          message={`${data.unbudgetedTransactions.length}${es.inicio.unbudgetedSuffix}`}
          action={
            <Link href="/movimientos" className="text-sm font-medium text-primary underline">
              {es.inicio.viewPending}
            </Link>
          }
        />
      ) : null}

      <PeriodHeader dashboard={data} />
      <HeroCard dashboard={data} />
      <CategoriesSummaryBlock dashboard={data} />
      <AccountsBlock dashboard={data} />
    </div>
  );
}
