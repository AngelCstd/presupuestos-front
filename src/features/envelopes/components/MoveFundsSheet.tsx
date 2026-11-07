'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { AmountInput } from '@/components/money/AmountInput';
import { formatMoney } from '@/lib/domain/money';
import { es } from '@/lib/i18n/es';
import type { Category } from '@/types/api';

export interface MoveFundsSheetProps {
  open: boolean;
  onClose: () => void;
  targetCategory: Category | null;
  categories: readonly Category[];
  onMove: (fromCategoryId: string, toCategoryId: string, amountCents: string) => void;
  moving?: boolean;
}

export function MoveFundsSheet({
  open,
  onClose,
  targetCategory,
  categories,
  onMove,
  moving,
}: MoveFundsSheetProps) {
  const period = targetCategory?.period;
  const isOverspent = period ? BigInt(period.availableCents) < 0n : false;
  const deficitCents = isOverspent ? (-BigInt(period!.availableCents)).toString() : '0';

  const [mode, setMode] = useState<'pull' | 'push'>('push');
  const [selectedOtherId, setSelectedOtherId] = useState<string>('');
  const [amountCents, setAmountCents] = useState<string>('0');

  // Pull mode donors: other categories with available balance > 0
  const pullDonors = useMemo(() => {
    if (!targetCategory) return [];
    return categories
      .filter((c) => c.id !== targetCategory.id && c.period && BigInt(c.period.availableCents) > 0n)
      .sort((a, b) => Number(BigInt(b.period!.availableCents) - BigInt(a.period!.availableCents)));
  }, [categories, targetCategory]);

  // Push mode recipients: all other categories in the period
  const pushRecipients = useMemo(() => {
    if (!targetCategory) return [];
    return categories
      .filter((c) => c.id !== targetCategory.id)
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [categories, targetCategory]);

  // Reset state whenever targetCategory or open changes
  useEffect(() => {
    if (!open || !targetCategory) return;

    if (isOverspent) {
      setMode('pull');
      setSelectedOtherId(pullDonors[0]?.id ?? '');
      setAmountCents(deficitCents);
    } else {
      setMode('push');
      setSelectedOtherId(pushRecipients[0]?.id ?? '');
      setAmountCents('0');
    }
  }, [open, targetCategory, isOverspent, deficitCents, pullDonors, pushRecipients]);

  // When switching mode manually, adjust default other category
  const handleModeChange = (newMode: 'pull' | 'push') => {
    setMode(newMode);
    if (newMode === 'pull') {
      setSelectedOtherId(pullDonors[0]?.id ?? '');
      if (isOverspent) {
        setAmountCents(deficitCents);
      } else {
        setAmountCents('0');
      }
    } else {
      setSelectedOtherId(pushRecipients[0]?.id ?? '');
      setAmountCents('0');
    }
  };

  if (!targetCategory) return null;

  const currentAvailable = period ? BigInt(period.availableCents) : 0n;
  const selectedOther = categories.find((c) => c.id === selectedOtherId);
  const selectedOtherAvailable = selectedOther?.period ? BigInt(selectedOther.period.availableCents) : 0n;

  // Validation
  const moveCentsBigInt = BigInt(amountCents || '0');
  let maxAllowed = 0n;
  if (mode === 'pull') {
    maxAllowed = selectedOtherAvailable > 0n ? selectedOtherAvailable : 0n;
  } else {
    maxAllowed = currentAvailable > 0n ? currentAvailable : 0n;
  }
  const isValidAmount = moveCentsBigInt > 0n && moveCentsBigInt <= maxAllowed;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAmount || !selectedOtherId) return;

    if (mode === 'pull') {
      onMove(selectedOtherId, targetCategory.id, amountCents);
    } else {
      onMove(targetCategory.id, selectedOtherId, amountCents);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={es.moveFundsSheet.title(targetCategory.name)}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Segmented Control: Pull vs Push */}
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted-background p-1 border border-border/80">
          <button
            type="button"
            onClick={() => handleModeChange('pull')}
            className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
              mode === 'pull'
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {es.moveFundsSheet.pullTab}
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('push')}
            className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
              mode === 'push'
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {es.moveFundsSheet.pushTab}
          </button>
        </div>

        {/* Mode 1: Pull */}
        {mode === 'pull' ? (
          <div className="flex flex-col gap-3">
            {pullDonors.length === 0 ? (
              <p className="rounded-lg border border-border/80 bg-muted-background/30 p-3 text-xs text-muted">
                {es.moveFundsSheet.noSources}
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pull-donor-select" className="text-xs font-medium text-foreground">
                  {es.moveFundsSheet.sourceLabel}
                </label>
                <select
                  id="pull-donor-select"
                  value={selectedOtherId}
                  onChange={(e) => setSelectedOtherId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {pullDonors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({formatMoney(d.period?.availableCents ?? '0')}{' '}
                      {es.moveFundsSheet.sourceAvailableSuffix})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ) : (
          /* Mode 2: Push */
          <div className="flex flex-col gap-3">
            {pushRecipients.length === 0 ? (
              <p className="rounded-lg border border-border/80 bg-muted-background/30 p-3 text-xs text-muted">
                {es.moveFundsSheet.noTargets}
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="push-recipient-select" className="text-xs font-medium text-foreground">
                  {es.moveFundsSheet.targetLabel}
                </label>
                <select
                  id="push-recipient-select"
                  value={selectedOtherId}
                  onChange={(e) => setSelectedOtherId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {pushRecipients.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Amount Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground">
            {es.moveFundsSheet.amountLabel}
          </label>
          <AmountInput
            value={amountCents}
            onChange={setAmountCents}
            className="w-full"
          />

          {/* Quick Amount Shortcuts */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {mode === 'pull' && isOverspent && (
              <button
                type="button"
                onClick={() => setAmountCents(deficitCents)}
                className="rounded-md border border-border/80 bg-muted-background/40 px-2.5 py-1 text-2xs font-semibold text-foreground hover:bg-muted-background active:scale-95 transition-transform"
              >
                {es.moveFundsSheet.deficitButton(formatMoney(deficitCents))}
              </button>
            )}

            {maxAllowed > 0n && (
              <button
                type="button"
                onClick={() => setAmountCents(maxAllowed.toString())}
                className="rounded-md border border-border/80 bg-muted-background/40 px-2.5 py-1 text-2xs font-semibold text-foreground hover:bg-muted-background active:scale-95 transition-transform"
              >
                {es.moveFundsSheet.allAvailableButton(formatMoney(maxAllowed.toString()))}
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            {es.moveFundsSheet.cancelAction}
          </Button>
          <Button
            type="submit"
            loading={moving}
            disabled={!isValidAmount || !selectedOtherId || moving}
          >
            {es.moveFundsSheet.submitAction}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
