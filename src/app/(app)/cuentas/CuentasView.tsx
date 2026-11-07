'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Balance } from '@/components/money/Balance';
import { Money } from '@/components/money/Money';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/states/ErrorState';
import { Skeleton } from '@/components/states/Skeleton';
import { CreateAccountForm } from '@/features/accounts/components/CreateAccountForm';
import { NetMoneySheet } from '@/features/accounts/components/NetMoneySheet';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { calculateRealMoney } from '@/lib/domain/accounts';
import { ApiError } from '@/lib/api/errors';
import { es } from '@/lib/i18n/es';
import type { Account } from '@/types/api';

export function CuentasView() {
  const { data, isLoading, error, refetch } = useAccounts();
  const [creating, setCreating] = useState(false);
  const [netMoneySheetOpen, setNetMoneySheetOpen] = useState(false);

  const accounts = useMemo(() => data?.data ?? [], [data]);

  const cashAccounts = useMemo(
    () => [...accounts.filter((a) => a.kind === 'cash')].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [accounts],
  );
  const creditAccounts = useMemo(
    () => [...accounts.filter((a) => a.kind === 'credit')].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [accounts],
  );
  const receivableAccounts = useMemo(
    () => [...accounts.filter((a) => a.kind === 'receivable')].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [accounts],
  );

  const realMoney = useMemo(() => calculateRealMoney(accounts), [accounts]);

  const totalCashCents = useMemo(
    () => cashAccounts.reduce((acc, a) => acc + BigInt(a.balanceCents), 0n),
    [cashAccounts],
  );

  const totalCreditCents = useMemo(
    () => creditAccounts.reduce((acc, a) => acc + BigInt(a.balanceCents), 0n),
    [creditAccounts],
  );

  const totalReceivableCents = useMemo(
    () => receivableAccounts.reduce((acc, a) => acc + BigInt(a.balanceCents), 0n),
    [receivableAccounts],
  );

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-5 p-4 pb-36">
        <header className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-2xl font-bold text-foreground">{es.accountsView.title}</h1>
            <p className="text-xs text-muted">{es.accountsView.subtitle}</p>
          </div>
        </header>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorState code={error instanceof ApiError ? error.code : 'INTERNAL_ERROR'} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4 pb-36">
      <header className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-bold text-foreground">{es.accountsView.title}</h1>
          <p className="text-xs text-muted">{es.accountsView.subtitle}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setCreating(true)}
          className="text-xs shrink-0"
        >
          {es.accountsView.newAccountButton}
        </Button>
      </header>

      {/* Resumen patrimonial: dinero real */}
      <section
        role="button"
        tabIndex={0}
        onClick={() => setNetMoneySheetOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setNetMoneySheetOpen(true);
          }
        }}
        className="flex flex-col gap-3 rounded-xl border border-border bg-muted-background/40 p-4 shadow-sm cursor-pointer active:scale-95 transition-transform"
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              {es.accountsView.realMoneyLabel}
            </span>
            <span aria-hidden="true" className="text-muted text-sm shrink-0">
              ›
            </span>
          </div>
          <span className="text-2xl font-bold text-foreground">
            <Money cents={realMoney.toString()} />
          </span>
          <span className="text-xs text-muted">
            {es.accountsView.realMoneySubtitle}
          </span>
          {realMoney < 0n ? (
            <span className="text-xs font-medium text-state-depleted">
              {es.accountsView.negativeRealMoneyBadge}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-border/40 pt-2.5 text-xs">
          <div className="flex flex-col">
            <span className="text-2xs text-muted">{es.accountsView.totalCashLabel}</span>
            <span className="font-semibold text-foreground">
              <Money cents={totalCashCents.toString()} />
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xs text-muted">{es.accountsView.totalDebtLabel}</span>
            <span className="font-semibold text-foreground">
              <Balance cents={totalCreditCents.toString()} kind="credit" />
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xs text-muted">{es.accountsView.totalReceivableLabel}</span>
            <span className="font-semibold text-foreground">
              <Balance cents={totalReceivableCents.toString()} kind="receivable" />
            </span>
          </div>
        </div>
      </section>

      {/* Sección 1: Efectivo y bancos */}
      <section className="flex flex-col gap-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {es.accountsView.cashSectionTitle}
        </h2>
        {cashAccounts.length === 0 ? (
          <p className="rounded-xl border border-border/60 bg-muted-background/20 p-3 text-xs text-muted">
            {es.accountsView.emptyCash}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {cashAccounts.map((account) => (
              <AccountRow key={account.id} account={account} />
            ))}
          </div>
        )}
      </section>

      {/* Sección 2: Tarjetas de crédito */}
      <section className="flex flex-col gap-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {es.accountsView.creditSectionTitle}
        </h2>
        {creditAccounts.length === 0 ? (
          <p className="rounded-xl border border-border/60 bg-muted-background/20 p-3 text-xs text-muted">
            {es.accountsView.emptyCredit}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {creditAccounts.map((account) => (
              <AccountRow key={account.id} account={account} />
            ))}
          </div>
        )}
      </section>

      {/* Sección 3: cuentas por cobrar */}
      <section className="flex flex-col gap-2.5" id="last-section">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {es.accountsView.receivableSectionTitle}
        </h2>
        {receivableAccounts.length === 0 ? (
          <p className="rounded-xl border border-border/60 bg-muted-background/20 p-3 text-xs text-muted">
            {es.accountsView.emptyReceivable}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {receivableAccounts.map((account, idx) => (
              <AccountRow
                key={account.id}
                account={account}
                id={idx === receivableAccounts.length - 1 ? 'last-element' : undefined}
              />
            ))}
          </div>
        )}
      </section>

      <CreateAccountForm open={creating} onClose={() => setCreating(false)} />
      <NetMoneySheet
        open={netMoneySheetOpen}
        onClose={() => setNetMoneySheetOpen(false)}
        accounts={accounts}
      />
    </div>
  );
}

function AccountRow({ account, id }: { account: Account; id?: string }) {
  const isNegativeCash = account.kind === 'cash' && BigInt(account.balanceCents) < 0n;

  return (
    <Link
      id={id}
      href={`/cuentas/${account.id}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-background p-3.5 transition-colors hover:border-border hover:bg-muted-background/30 shadow-sm"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-medium text-foreground truncate">{account.name}</span>
        {isNegativeCash ? (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-state-overspent/15 text-state-overspent shrink-0">
            {es.accountsView.negativeCashBadge}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Balance
          cents={account.balanceCents}
          kind={account.kind}
          className={`text-sm font-semibold ${isNegativeCash ? 'text-state-overspent' : ''}`}
        />
        <span aria-hidden="true" className="text-muted">
          ›
        </span>
      </div>
    </Link>
  );
}
