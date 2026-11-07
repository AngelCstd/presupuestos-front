import { Money } from '@/components/money/Money';
import { es } from '@/lib/i18n/es';
import type { AccountKind } from '@/types/api';

export interface NetMoneyBreakdownProps {
  accounts: readonly { kind: AccountKind; balanceCents: string }[];
}

/**
 * Componente compartido de cálculo de Dinero neto.
 * Se usa tanto en la hoja de cuentas como en el paso intermedio del cálculo principal.
 */
export function NetMoneyBreakdown({ accounts }: NetMoneyBreakdownProps) {
  const cashAccounts = accounts.filter((a) => a.kind === 'cash');
  const creditAccounts = accounts.filter((a) => a.kind === 'credit');

  const totalCash = cashAccounts.reduce((sum, a) => sum + BigInt(a.balanceCents), 0n);
  const totalCredit = creditAccounts.reduce((sum, a) => sum + BigInt(a.balanceCents), 0n);
  const absDebt = totalCredit < 0n ? -totalCredit : 0n;
  const netMoney = totalCash - absDebt;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-muted-background/30 p-3.5 text-xs">
      {/* 1. Efectivo y bancos */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <span className="font-bold text-foreground">+</span>
            <span>{es.netMoneyBreakdown.cashRowLabel}</span>
          </span>
          <span className="text-2xs text-muted">{es.netMoneyBreakdown.cashRowDesc}</span>
        </div>
        <span className="font-semibold text-foreground shrink-0 text-right">
          <Money cents={totalCash.toString()} />
        </span>
      </div>

      {/* 2. Deuda en tarjetas */}
      <div className="flex items-start justify-between gap-3 border-t border-border/40 pt-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <span className="font-bold text-foreground">−</span>
            <span>{es.netMoneyBreakdown.debtRowLabel}</span>
          </span>
          <span className="text-2xs text-muted">{es.netMoneyBreakdown.debtRowDesc}</span>
        </div>
        <span className="font-semibold text-foreground shrink-0 text-right">
          <Money cents={absDebt.toString()} />
        </span>
      </div>

      {/* 3. Dinero neto */}
      <div className="flex items-start justify-between gap-3 border-t border-border/60 pt-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-bold text-foreground flex items-center gap-1.5">
            <span className="text-foreground font-bold">=</span>
            <span>{es.netMoneyBreakdown.netRowLabel}</span>
          </span>
          <span className="text-2xs text-muted">{es.netMoneyBreakdown.netRowDesc}</span>
        </div>
        <span
          className={`font-bold shrink-0 text-right ${
            netMoney < 0n ? 'text-state-overspent' : 'text-foreground'
          }`}
        >
          {netMoney < 0n ? '−' : ''}
          <Money cents={(netMoney < 0n ? -netMoney : netMoney).toString()} />
        </span>
      </div>
    </div>
  );
}
