'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { AmountInput } from '@/components/money/AmountInput';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useCategories } from '@/features/envelopes/hooks/useCategories';
import { useCreateRecurringTemplate } from '@/features/recurring/hooks/useCreateRecurringTemplate';
import { ApiError } from '@/lib/api/errors';
import { errorMessageFor } from '@/lib/i18n/errors';
import { es } from '@/lib/i18n/es';

export function NewRecurringTemplateForm() {
  const router = useRouter();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories(null);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [amountCents, setAmountCents] = useState('0');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [error, setError] = useState<string | null>(null);

  const sortedCategories = useMemo(
    () => [...(categories?.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [categories?.data],
  );
  const sortedAccounts = useMemo(
    () => [...(accounts?.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [accounts?.data],
  );

  const createTemplate = useCreateRecurringTemplate();

  return (
    <form
      className="flex flex-col gap-4 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        createTemplate.mutate(
          {
            name,
            categoryId,
            amountCents,
            dayOfMonth: Number(dayOfMonth),
            ...(accountId ? { accountId } : {}),
          },
          {
            onSuccess: () => router.push('/recordatorios'),
            onError: (mutationError) => {
              setError(mutationError instanceof ApiError ? mutationError.code : 'INTERNAL_ERROR');
            },
          },
        );
      }}
    >
      <h1 className="text-xl font-semibold text-foreground">Nuevo recordatorio</h1>

      <Field label="Nombre">
        <Input value={name} onChange={(event) => setName(event.target.value)} required />
      </Field>

      <Field label={es.kind.category}>
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          required
        >
          <option value="" disabled>
            Elige uno
          </option>
          {sortedCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Cuenta sugerida" hint="Opcional">
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
          value={accountId}
          onChange={(event) => setAccountId(event.target.value)}
        >
          <option value="">Ninguna</option>
          {sortedAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Monto estimado">
        <AmountInput value={amountCents} onChange={setAmountCents} required />
      </Field>

      <Field label="Día del mes" hint="Entre 1 y 31">
        <Input
          type="number"
          min={1}
          max={31}
          value={dayOfMonth}
          onChange={(event) => setDayOfMonth(event.target.value)}
          required
        />
      </Field>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {errorMessageFor(error)}
        </p>
      ) : null}

      <Button type="submit" loading={createTemplate.isPending}>
        Crear
      </Button>
    </form>
  );
}
