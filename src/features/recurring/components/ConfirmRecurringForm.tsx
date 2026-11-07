'use client';

import { useEffect, useState, useMemo } from 'react';
import { AmountInput } from '@/components/money/AmountInput';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { BudgetImpactMessage } from '@/features/transactions/components/BudgetImpactMessage';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useDraft } from '@/features/capture/hooks/useDraft';
import { useConfirmRecurringTemplate } from '@/features/recurring/hooks/useConfirmRecurringTemplate';
import { ApiError } from '@/lib/api/errors';
import { todayInTimeZone } from '@/lib/domain/dates';
import { errorMessageFor } from '@/lib/i18n/errors';
import { es } from '@/lib/i18n/es';
import { useTimezone } from '@/providers/TimezoneProvider';
import type { CalendarDate, ConfirmRecurringResult, RecurringTemplate } from '@/types/api';

interface ConfirmDraftValues {
  amountCents: string;
  bookedAt: string;
  paidFromAccountId: string;
}

export function ConfirmRecurringForm({
  template,
  open,
  onClose,
}: {
  template: RecurringTemplate;
  open: boolean;
  onClose: () => void;
}) {
  const timezone = useTimezone();
  const today = todayInTimeZone(timezone);

  const initialValues: ConfirmDraftValues = {
    amountCents: template.amountCents,
    bookedAt: today,
    paidFromAccountId: template.accountId ?? '',
  };

  const { draft, update, clear } = useDraft<ConfirmDraftValues>(`confirm-recurring:${template.id}`, initialValues);
  const [values, setValues] = useState<ConfirmDraftValues>(initialValues);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (draft && !hydrated) {
      setValues(draft.values);
      setHydrated(true);
    }
  }, [draft, hydrated]);

  const { data: accounts } = useAccounts();
  const sortedAccounts = useMemo(
    () => [...(accounts?.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [accounts?.data],
  );
  const confirmTemplate = useConfirmRecurringTemplate(template.id);
  const [result, setResult] = useState<ConfirmRecurringResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof ConfirmDraftValues>(key: K, value: ConfirmDraftValues[K]) {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      update(next);
      return next;
    });
  }

  function handleClose() {
    setResult(null);
    setError(null);
    onClose();
  }

  if (result) {
    return (
      <Sheet open={open} onClose={handleClose} title={template.name}>
        <div className="flex flex-col gap-4">
          <BudgetImpactMessage budgetImpact={result.transaction.budgetImpact} />
          <Button type="button" onClick={handleClose}>
            Listo
          </Button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onClose={handleClose} title={template.name}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft) return;
          setError(null);
          confirmTemplate.mutate(
            {
              body: {
                bookedAt: values.bookedAt as CalendarDate,
                amountCents: values.amountCents,
                paidFromAccountId: values.paidFromAccountId,
              },
              idempotencyKey: draft.idempotencyKey,
            },
            {
              onSuccess: (confirmResult) => {
                clear();
                setResult(confirmResult);
              },
              onError: (mutationError) => {
                setError(mutationError instanceof ApiError ? mutationError.code : 'INTERNAL_ERROR');
              },
            },
          );
        }}
      >
        <Field label="Monto">
          <AmountInput value={values.amountCents} onChange={(cents) => setField('amountCents', cents)} required />
        </Field>

        <Field label={es.recordatoriosView.targetEnvelope}>
          <div className="w-full rounded-md border border-border bg-muted-background/50 px-3 py-2 text-sm font-medium text-foreground">
            {template.categoryName}
          </div>
        </Field>

        <Field label="Cuenta de pago">
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
            value={values.paidFromAccountId}
            onChange={(event) => setField('paidFromAccountId', event.target.value)}
            required
          >
            <option value="" disabled>
              Elige una
            </option>
            {sortedAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Fecha">
          <Input
            type="date"
            value={values.bookedAt}
            onChange={(event) => setField('bookedAt', event.target.value)}
            required
          />
        </Field>

        {error ? (
          <p role="alert" className="text-sm text-danger">
            {errorMessageFor(error)}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={confirmTemplate.isPending} disabled={!hydrated}>
            Confirmar
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
