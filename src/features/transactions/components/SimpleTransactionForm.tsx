'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { AmountInput } from '@/components/money/AmountInput';
import { Button } from '@/components/ui/Button';
import { EmptyState, type EmptyStateTone } from '@/components/states/EmptyState';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useDraft } from '@/features/capture/hooks/useDraft';
import { BudgetImpactMessage } from '@/features/transactions/components/BudgetImpactMessage';
import { useCreateTransaction, type CreateTransactionIntent } from '@/features/transactions/hooks/useCreateTransaction';
import { ApiError } from '@/lib/api/errors';
import { todayInTimeZone } from '@/lib/domain/dates';
import { useTimezone } from '@/providers/TimezoneProvider';
import type { TransactionMutationResult } from '@/types/api';

export interface SimpleOption {
  id: string;
  name: string;
  /** Opcional — permite que la página derive un título dinámico (p.ej. "Pago de tarjeta"). */
  kind?: string;
}

export interface SimpleTransactionFormValues {
  amountCents: string;
  bookedAt: string;
  description: string;
  firstId: string;
  secondId: string;
}

export interface SimpleTransactionFormProps {
  intent: CreateTransactionIntent;
  draftIntent: string;
  /** Estático, o función del estado actual — usado para "Pago de tarjeta" en transferencia. */
  title: string | ((values: SimpleTransactionFormValues) => string);
  firstLabel: string;
  firstOptions: SimpleOption[] | undefined;
  secondLabel: string;
  secondOptions: SimpleOption[] | undefined;
  buildBody: (values: SimpleTransactionFormValues) => Record<string, unknown>;
  emptyState?: { title: string; description?: string; tone: EmptyStateTone; action?: ReactNode } | null;
}

/**
 * Las 5 intenciones simples de /capturar/otro comparten forma: monto, fecha,
 * descripción y dos selectores — solo cambia qué representan (SCREENS-front.md). Cada
 * página le da nombre a los dos selectores y arma el body con la forma real del
 * contrato via `buildBody`.
 */
export function SimpleTransactionForm({
  intent,
  draftIntent,
  title,
  firstLabel,
  firstOptions,
  secondLabel,
  secondOptions,
  buildBody,
  emptyState,
}: SimpleTransactionFormProps) {
  const router = useRouter();
  const timezone = useTimezone();
  const today = todayInTimeZone(timezone);

  const initialValues: SimpleTransactionFormValues = {
    amountCents: '0',
    bookedAt: today,
    description: '',
    firstId: '',
    secondId: '',
  };

  const { draft, update, clear } = useDraft<SimpleTransactionFormValues>(draftIntent, initialValues);
  const [values, setValues] = useState(initialValues);
  const [hydrated, setHydrated] = useState(false);

  const mutation = useCreateTransaction(intent);
  const [result, setResult] = useState<TransactionMutationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (draft && !hydrated) {
      setValues(draft.values);
      setHydrated(true);
    }
  }, [draft, hydrated]);

  function setField<K extends keyof SimpleTransactionFormValues>(key: K, value: SimpleTransactionFormValues[K]) {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      update(next);
      return next;
    });
  }

  if (emptyState) {
    return (
      <div className="p-4">
        <EmptyState {...emptyState} />
      </div>
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

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!draft) return;
        setError(null);

        mutation.mutate(
          { body: buildBody(values), idempotencyKey: draft.idempotencyKey },
          {
            onSuccess: (transaction) => {
              clear();
              setResult(transaction);
            },
            onError: (mutationError) => {
              if (mutationError instanceof ApiError && mutationError.code === 'UNAUTHORIZED') {
                router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
                return;
              }
              setError(mutationError instanceof ApiError ? mutationError.code : 'INTERNAL_ERROR');
            },
          },
        );
      }}
      className="flex flex-col gap-4 p-4"
    >
      <h1 className="text-xl font-semibold text-foreground">
        {typeof title === 'function' ? title(values) : title}
      </h1>

      <Field label="Monto">
        <AmountInput value={values.amountCents} onChange={(cents) => setField('amountCents', cents)} required />
      </Field>

      <Field label={firstLabel}>
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
          value={values.firstId}
          onChange={(event) => setField('firstId', event.target.value)}
          required
        >
          <option value="" disabled>
            Elige uno
          </option>
          {firstOptions?.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label={secondLabel}>
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
          value={values.secondId}
          onChange={(event) => setField('secondId', event.target.value)}
          required
        >
          <option value="" disabled>
            Elige uno
          </option>
          {secondOptions?.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
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

      <Field label="Descripción">
        <Input value={values.description} onChange={(event) => setField('description', event.target.value)} />
      </Field>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          Ocurrió un problema. Intenta de nuevo.
        </p>
      ) : null}

      <Button type="submit" loading={mutation.isPending} disabled={!hydrated}>
        Guardar
      </Button>
    </form>
  );
}
