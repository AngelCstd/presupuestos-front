'use client';

import Link from 'next/link';
import { Balance } from '@/components/money/Balance';
import { Money } from '@/components/money/Money';
import { Banner } from '@/components/layout/Banner';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { Skeleton } from '@/components/states/Skeleton';
import { EnvelopeStatusBadge } from '@/features/envelopes/components/EnvelopeStatusBadge';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';
import { ApiError } from '@/lib/api/errors';
import { isRealAccountKind } from '@/lib/domain/accounts';
import { es } from '@/lib/i18n/es';
import type { DashboardResponse } from '@/types/api';

function absCents(cents: string): string {
  return cents.startsWith('-') ? cents.slice(1) : cents;
}

function UnassignedBlock({ dashboard }: { dashboard: DashboardResponse }) {
  const unassigned = BigInt(dashboard.unassignedCents);
  const hasAnyBudgeted = dashboard.categories.some((category) => category.hasBudget);

  if (unassigned < 0n) {
    return (
      <div>
        <p className="text-sm text-muted">{es.field.unassignedCents}</p>
        <p className="text-3xl font-semibold text-state-overspent">
          Te pasaste por <Money cents={absCents(dashboard.unassignedCents)} />
        </p>
      </div>
    );
  }

  if (unassigned === 0n) {
    return hasAnyBudgeted ? (
      <EmptyState tone="exito" title="Todo repartido" description="Cada peso tiene un sobre." />
    ) : (
      <EmptyState
        tone="pendiente"
        title="Aún no repartes nada"
        description="Cuando registres un ingreso vas a ver aquí cuánto tienes por asignar."
        action={
          <Link href="/capturar/otro" className="text-sm font-medium text-primary underline">
            Registrar ingreso
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <p className="text-sm text-muted">{es.field.unassignedCents}</p>
      <p className="text-3xl font-semibold text-foreground">
        <Money cents={dashboard.unassignedCents} />
      </p>
    </div>
  );
}

function CategoriesSummaryBlock({ dashboard }: { dashboard: DashboardResponse }) {
  if (dashboard.period === null) {
    return (
      <EmptyState
        tone="pendiente"
        title="No hay periodo abierto"
        description="Tus gastos se siguen registrando, pero no cuentan en ningún presupuesto."
        action={
          <Link href="/periodos" className="text-sm font-medium text-primary underline">
            Crear periodo
          </Link>
        }
      />
    );
  }

  const allNoBudget =
    dashboard.categories.length > 0 && dashboard.categories.every((category) => category.status === 'no_budget');

  if (allNoBudget) {
    return (
      <EmptyState
        tone="pendiente"
        title={`Ninguno de tus ${es.kind.category.toLowerCase()}s tiene presupuesto este periodo`}
        action={
          <Link href="/sobres" className="text-sm font-medium text-primary underline">
            Repartir
          </Link>
        }
      />
    );
  }

  const allNoSpend =
    dashboard.categories.length > 0 && dashboard.categories.every((category) => category.spentCents === '0');

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-foreground">{es.kind.category}s del periodo</p>
      {allNoSpend ? (
        <EmptyState tone="exito" title="Sin gastos todavía" />
      ) : (
        <ul className="flex flex-col gap-2">
          {dashboard.categories.map((category) => (
            <li
              key={category.categoryId}
              className="flex items-center justify-between rounded-md border border-border p-3"
            >
              <span className="text-foreground">{category.name}</span>
              <span className="flex items-center gap-2">
                <EnvelopeStatusBadge status={category.status} />
                {category.status !== 'no_budget' ? <Money cents={category.availableCents} /> : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AccountsBlock({ dashboard }: { dashboard: DashboardResponse }) {
  // dashboard.accounts trae cash, credit, receivable, category e income_source
  // mezclados (API-CONTRACT.md §14) — filtrar a cuentas reales es responsabilidad de
  // este bloque, no de la API. Bug real encontrado el 2026-08-17: antes de este
  // filtro, "Cuentas" también pintaba sobres.
  const realAccounts = dashboard.accounts.filter((account) => isRealAccountKind(account.kind));

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-foreground">{es.kind.cash}s</p>
      <ul className="flex flex-col gap-2">
        {realAccounts.map((account) => (
          <li
            key={account.accountId}
            className="flex items-center justify-between rounded-md border border-border p-3"
          >
            <span className="text-foreground">{account.name}</span>
            <Balance cents={account.balanceCents} kind={account.kind} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InicioView() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState code={error instanceof ApiError ? error.code : 'INTERNAL_ERROR'} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {data.unbudgetedTransactions.length > 0 ? (
        <Banner
          message={`${data.unbudgetedTransactions.length} movimientos no caen en ningún periodo.`}
          action={
            <Link href="/movimientos" className="text-sm font-medium text-primary underline">
              Ver
            </Link>
          }
        />
      ) : null}

      <div className="flex flex-col gap-6 p-4">
        <UnassignedBlock dashboard={data} />
        <CategoriesSummaryBlock dashboard={data} />
        <AccountsBlock dashboard={data} />
      </div>
    </div>
  );
}
