'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AmountInput } from '@/components/money/AmountInput';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useDraft } from '@/features/capture/hooks/useDraft';
import { useCategories } from '@/features/envelopes/hooks/useCategories';
import { usePeriods } from '@/features/periods/hooks/usePeriods';
import { BudgetImpactMessage } from '@/features/transactions/components/BudgetImpactMessage';
import { useCreateTransaction } from '@/features/transactions/hooks/useCreateTransaction';
import { ApiError } from '@/lib/api/errors';
import { isDateInClosedPeriod, todayInTimeZone } from '@/lib/domain/dates';
import { splitEvenly } from '@/lib/domain/money';
import { es } from '@/lib/i18n/es';
import { useTimezone } from '@/providers/TimezoneProvider';
import type { CreateExpenseRequest, TransactionMutationResult } from '@/types/api';

interface SplitLine {
  categoryId: string;
  amountCents: string;
}

interface ExpenseDraftValues {
  amountCents: string;
  bookedAt: string;
  description: string;
  paidFromAccountId: string;
  splitEnabled: boolean;
  lines: SplitLine[];
  lentToEnabled: boolean;
  lentToAccountId: string;
  lentToAmountCents: string;
}

function makeInitialValues(today: string): ExpenseDraftValues {
  return {
    amountCents: '0',
    bookedAt: today,
    description: '',
    paidFromAccountId: '',
    splitEnabled: false,
    lines: [{ categoryId: '', amountCents: '0' }],
    lentToEnabled: false,
    lentToAccountId: '',
    lentToAmountCents: '0',
  };
}

export function ExpenseForm() {
  const router = useRouter();
  const timezone = useTimezone();
  const today = todayInTimeZone(timezone);

  const { draft, update, clear } = useDraft<ExpenseDraftValues>('expense', makeInitialValues(today));
  const [values, setValues] = useState<ExpenseDraftValues>(() => makeInitialValues(today));
  const [hydrated, setHydrated] = useState(false);

  const { data: accounts } = useAccounts();
  // Sin periodo actual, GET /categories sigue trayendo el acumulado histórico — sirve
  // para elegir sobre incluso sin periodo abierto (el impacto lo decide el servidor).
  const { data: categories } = useCategories(null);
  const { data: periods } = usePeriods();

  const createExpense = useCreateTransaction('expenses');
  const [result, setResult] = useState<TransactionMutationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Rehidrata desde el borrador la primera vez que resuelve — cubre el caso de 401 +
  // re-login (TASK-front.md U12/U18): si ya había un borrador, sus valores ganan.
  useEffect(() => {
    if (draft && !hydrated) {
      setValues(draft.values);
      setHydrated(true);
    }
  }, [draft, hydrated]);

  function setField<K extends keyof ExpenseDraftValues>(key: K, value: ExpenseDraftValues[K]) {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      update(next);
      return next;
    });
  }

  function toggleSplit(enabled: boolean) {
    const lines = enabled
      ? splitEvenly(values.amountCents, 2).map((amountCents) => ({ categoryId: '', amountCents }))
      : [{ categoryId: values.lines[0]?.categoryId ?? '', amountCents: values.amountCents }];
    setField('splitEnabled', enabled);
    setField('lines', lines);
  }

  function addSplitLine() {
    const count = values.lines.length + 1;
    const amounts = splitEvenly(values.amountCents, count);
    const lines = amounts.map((amountCents, i) => ({
      categoryId: values.lines[i]?.categoryId ?? '',
      amountCents,
    }));
    setField('lines', lines);
  }

  const closedPeriodWarning =
    periods && isDateInClosedPeriod(values.bookedAt, periods.data) ? (
      <p className="rounded-md border border-state-depleted/40 bg-state-depleted/10 p-3 text-sm text-state-depleted">
        Esa fecha cae en un periodo ya cerrado. El gasto se guarda igual; el ajuste se explica después de guardar.
      </p>
    ) : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setError(null);

    const body: CreateExpenseRequest = {
      bookedAt: values.bookedAt as CreateExpenseRequest['bookedAt'],
      description: values.description,
      paidFromAccountId: values.paidFromAccountId,
      totalCents: values.amountCents,
      lines: values.lines
        .filter((line) => line.categoryId !== '')
        .map((line) => ({ categoryId: line.categoryId, amountCents: line.amountCents })),
      ...(values.lentToEnabled && values.lentToAccountId
        ? {
            lentTo: [{ receivableAccountId: values.lentToAccountId, amountCents: values.lentToAmountCents }],
          }
        : {}),
    };

    createExpense.mutate(
      { body, idempotencyKey: draft.idempotencyKey },
      {
        onSuccess: (transaction) => {
          clear();
          setResult(transaction);
        },
        onError: (mutationError) => {
          if (mutationError instanceof ApiError && mutationError.code === 'UNAUTHORIZED') {
            router.push('/login?next=/capturar/gasto');
            return;
          }
          setError(mutationError instanceof ApiError ? mutationError.code : 'INTERNAL_ERROR');
        },
      },
    );
  }

  if (result) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <BudgetImpactMessage budgetImpact={result.budgetImpact} />
        <Button type="button" onClick={() => router.push('/')}>
          Listo
        </Button>
      </div>
    );
  }

  if (categories && categories.total === 0) {
    return (
      <div className="p-4">
        <p className="text-foreground">
          Necesitas al menos un {es.kind.category.toLowerCase()} para registrar un gasto.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold text-foreground">{es.intent.expense}</h1>

      <Field label="Monto">
        <AmountInput value={values.amountCents} onChange={(cents) => setField('amountCents', cents)} required />
      </Field>

      {!values.splitEnabled ? (
        <Field label={es.kind.category}>
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
            value={values.lines[0]?.categoryId ?? ''}
            onChange={(event) => setField('lines', [{ categoryId: event.target.value, amountCents: values.amountCents }])}
            required
          >
            <option value="" disabled>
              Elige uno
            </option>
            {categories?.data.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

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
          {accounts?.data.map((account) => (
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
      {closedPeriodWarning}

      <Field label="Descripción">
        <Input value={values.description} onChange={(event) => setField('description', event.target.value)} />
      </Field>

      <Checkbox
        label={`Repartir entre varios ${es.kind.category.toLowerCase()}s`}
        checked={values.splitEnabled}
        onChange={(event) => toggleSplit(event.target.checked)}
      />

      {values.splitEnabled ? (
        <div className="flex flex-col gap-2 rounded-md border border-border p-3">
          {values.lines.map((line, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                value={line.categoryId}
                onChange={(event) => {
                  const lines = [...values.lines];
                  lines[index] = { ...line, categoryId: event.target.value };
                  setField('lines', lines);
                }}
              >
                <option value="" disabled>
                  {es.kind.category}
                </option>
                {categories?.data.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <AmountInput
                value={line.amountCents}
                onChange={(cents) => {
                  const lines = [...values.lines];
                  lines[index] = { ...line, amountCents: cents };
                  setField('lines', lines);
                }}
                className="max-w-[8rem]"
              />
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={addSplitLine}>
            Agregar {es.kind.category.toLowerCase()}
          </Button>
        </div>
      ) : null}

      <Checkbox
        label="Parte prestada"
        checked={values.lentToEnabled}
        onChange={(event) => setField('lentToEnabled', event.target.checked)}
      />

      {values.lentToEnabled ? (
        <div className="flex flex-col gap-2 rounded-md border border-border p-3">
          <Field label="Cuenta de quien te debe">
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
              value={values.lentToAccountId}
              onChange={(event) => setField('lentToAccountId', event.target.value)}
            >
              <option value="">Elige una</option>
              {accounts?.data
                .filter((account) => account.kind === 'receivable')
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Monto prestado">
            <AmountInput
              value={values.lentToAmountCents}
              onChange={(cents) => setField('lentToAmountCents', cents)}
            />
          </Field>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-danger">
          Ocurrió un problema. Intenta de nuevo.
        </p>
      ) : null}

      <Button type="submit" loading={createExpense.isPending} disabled={!hydrated}>
        Guardar
      </Button>
    </form>
  );
}
