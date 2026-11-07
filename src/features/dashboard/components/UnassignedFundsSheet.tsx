'use client';

import { Money } from '@/components/money/Money';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { NetMoneyBreakdown } from '@/features/accounts/components/NetMoneyBreakdown';
import { formatMoney } from '@/lib/domain/money';
import { es } from '@/lib/i18n/es';
import type { DashboardResponse } from '@/types/api';

export interface UnassignedFundsSheetProps {
  open: boolean;
  onClose: () => void;
  dashboard: DashboardResponse;
}

export function UnassignedFundsSheet({ open, onClose, dashboard }: UnassignedFundsSheetProps) {
  // 1. Cuentas reales
  const cashAccounts = dashboard.accounts.filter((a) => a.kind === 'cash');
  const creditAccounts = dashboard.accounts.filter((a) => a.kind === 'credit');

  const totalCash = cashAccounts.reduce((sum, a) => sum + BigInt(a.balanceCents), 0n);
  const totalCredit = creditAccounts.reduce((sum, a) => sum + BigInt(a.balanceCents), 0n);
  const absDebt = totalCredit < 0n ? -totalCredit : 0n;
  const netMoney = totalCash - absDebt;

  // 2. Categorías y presupuesto
  const overspentCategories = dashboard.categories.filter((c) => c.status === 'overspent');
  const overspentDeficit = overspentCategories.reduce(
    (sum, c) => sum + (-BigInt(c.availableCents)),
    0n,
  );
  const nonOverspentCategories = dashboard.categories.filter((c) => c.status !== 'overspent');
  const nonOverspentAvailable = nonOverspentCategories.reduce(
    (sum, c) => sum + (BigInt(c.availableCents) > 0n ? BigInt(c.availableCents) : 0n),
    0n,
  );

  const formulaResult = netMoney - (nonOverspentAvailable + overspentDeficit);
  const rawUnassigned = BigInt(dashboard.unassignedCents);
  const hasAnyBudgeted = dashboard.categories.some((c) => c.hasBudget);

  // 3. Determinar el estado aplicable (1 al 5)
  let stateKind: 'state1' | 'state2' | 'state3' | 'state4' | 'state5';
  if (netMoney < 0n) {
    stateKind = 'state5';
  } else if (overspentCategories.length > 0) {
    stateKind = 'state4';
  } else if (rawUnassigned > 0n) {
    stateKind = 'state1';
  } else if (hasAnyBudgeted) {
    stateKind = 'state2';
  } else {
    stateKind = 'state3';
  }

  // 4. Monto destacado y nota
  let displayCents = dashboard.unassignedCents;
  let noteText = '';

  if (stateKind === 'state5') {
    displayCents = '0';
    const deficitAbs = formulaResult < 0n ? -formulaResult : formulaResult;
    noteText = es.unassignedSheet.state5.note(formatMoney(deficitAbs.toString()));
  } else if (stateKind === 'state4') {
    displayCents = '0';
    const deficitAbs = formulaResult < 0n ? -formulaResult : formulaResult;
    noteText = es.unassignedSheet.state4.note(
      formatMoney(deficitAbs.toString()),
      formatMoney(overspentDeficit.toString()),
    );
  } else if (stateKind === 'state1') {
    displayCents = dashboard.unassignedCents;
    noteText = es.unassignedSheet.state1.note;
  } else if (stateKind === 'state2') {
    displayCents = '0';
    noteText = es.unassignedSheet.state2.note;
  } else {
    displayCents = '0';
    noteText = es.unassignedSheet.state3.note;
  }

  const subtitle = es.unassignedSheet[stateKind].subtitle;

  return (
    <Sheet open={open} onClose={onClose} title={es.unassignedSheet.title}>
      <div className="flex flex-col gap-4">
        {/* Encabezado con número destacado */}
        <div className="flex flex-col gap-0.5">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            <Money cents={displayCents} />
          </span>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>

        {/* Sección: Cómo se calcula */}
        <div className="flex flex-col gap-2">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted">
            {es.unassignedSheet.calculationHeading}
          </p>

          {/* Bloque común idéntico de Dinero neto */}
          <NetMoneyBreakdown accounts={dashboard.accounts} />

          {/* Deducciones por sobres */}
          <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-muted-background/30 p-3.5 text-xs">
            {stateKind === 'state4' ? (
              <>
                {/* Renglón: Apartado en sobres sin sobregiro */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <span className="font-bold text-foreground">−</span>
                      <span>{es.unassignedSheet.allocatedWithoutOverspendLabel}</span>
                    </span>
                    <span className="text-2xs text-muted">
                      {es.unassignedSheet.allocatedWithoutOverspendDesc}
                    </span>
                  </div>
                  <span className="font-semibold text-foreground shrink-0 text-right">
                    <Money cents={nonOverspentAvailable.toString()} />
                  </span>
                </div>

                {/* Renglón: Gastado de más en sobres sobregirados */}
                <div className="flex items-start justify-between gap-3 border-t border-border/40 pt-2">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-semibold text-state-overspent flex items-center gap-1.5">
                      <span className="font-bold">−</span>
                      <span>{es.unassignedSheet.overspentDeficitLabel}</span>
                    </span>
                    <span className="text-2xs text-muted">
                      {es.unassignedSheet.overspentDeficitDesc}
                    </span>
                  </div>
                  <span className="font-semibold text-state-overspent shrink-0 text-right">
                    <Money cents={overspentDeficit.toString()} />
                  </span>
                </div>
              </>
            ) : (
              /* Renglón estándar de sobres */
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <span className="font-bold text-foreground">−</span>
                    <span>{es.unassignedSheet.allocatedRowLabel}</span>
                  </span>
                  <span className="text-2xs text-muted">{es.unassignedSheet.allocatedRowDesc}</span>
                </div>
                <span className="font-semibold text-foreground shrink-0 text-right">
                  <Money cents={nonOverspentAvailable.toString()} />
                </span>
              </div>
            )}

            {/* Resultado final de la fórmula */}
            <div className="flex items-start justify-between gap-3 border-t border-border/60 pt-2 font-medium">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <span className="text-foreground font-bold">=</span>
                  <span>
                    {stateKind === 'state4' || stateKind === 'state5'
                      ? es.unassignedSheet.formulaResultLabel
                      : es.unassignedSheet.unassignedLabel}
                  </span>
                </span>
              </div>
              <span
                className={`font-bold shrink-0 text-right ${
                  formulaResult < 0n ? 'text-state-overspent' : 'text-foreground'
                }`}
              >
                {formulaResult < 0n ? '−' : ''}
                <Money
                  cents={
                    stateKind === 'state4' || stateKind === 'state5'
                      ? (formulaResult < 0n ? -formulaResult : formulaResult).toString()
                      : dashboard.unassignedCents
                  }
                />
              </span>
            </div>
          </div>
        </div>

        {/* Nota explicativa */}
        <div className="rounded-lg border border-border/70 bg-muted-background/40 p-3 text-xs leading-relaxed text-muted whitespace-pre-line">
          <p>{noteText}</p>
        </div>

        {/* Botón de cierre */}
        <div className="pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">
            {es.unassignedSheet.closeAction}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
