'use client';

import { Money } from '@/components/money/Money';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { NetMoneyBreakdown } from '@/features/accounts/components/NetMoneyBreakdown';
import { calculateRealMoney } from '@/lib/domain/accounts';
import { es } from '@/lib/i18n/es';
import type { AccountKind } from '@/types/api';

export interface NetMoneySheetProps {
  open: boolean;
  onClose: () => void;
  accounts: readonly { kind: AccountKind; balanceCents: string }[];
}

export function NetMoneySheet({ open, onClose, accounts }: NetMoneySheetProps) {
  const netMoney = calculateRealMoney(accounts);

  return (
    <Sheet open={open} onClose={onClose} title={es.netMoneySheet.title}>
      <div className="flex flex-col gap-4">
        {/* Encabezado con número destacado */}
        <div className="flex flex-col gap-0.5">
          <span
            className={`text-2xl font-bold tracking-tight ${
              netMoney < 0n ? 'text-state-overspent' : 'text-foreground'
            }`}
          >
            {netMoney < 0n ? '−' : ''}
            <Money cents={(netMoney < 0n ? -netMoney : netMoney).toString()} />
          </span>
          <p className="text-xs text-muted">{es.netMoneySheet.subtitle}</p>
        </div>

        {/* Desglose compartido idéntico */}
        <NetMoneyBreakdown accounts={accounts} />

        {/* Nota explicativa factual */}
        <div className="rounded-lg border border-border/70 bg-muted-background/40 p-3 text-xs leading-relaxed text-muted">
          <p>{netMoney < 0n ? es.netMoneySheet.noteNegative : es.netMoneySheet.notePositive}</p>
        </div>

        {/* Botón de cierre */}
        <div className="pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">
            {es.netMoneySheet.closeAction}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
