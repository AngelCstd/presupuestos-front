'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { AmountInput } from '@/components/money/AmountInput';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { SUGGESTED_CATEGORIES, SUGGESTED_INCOME_SOURCE } from '@/features/onboarding/suggestions';
import { bffFetch } from '@/lib/api/browser-client';
import { BFF_DEDICATED_ROUTES } from '@/lib/bff/dedicated-routes';
import { todayInTimeZone } from '@/lib/domain/dates';
import { es } from '@/lib/i18n/es';
import { useTimezone } from '@/providers/TimezoneProvider';
import type { Account, Category, IncomeSource, TransactionMutationResult } from '@/types/api';

export interface OnboardingFormProps {
  existingAccount: Account | null;
  balanceAlreadyCaptured: boolean;
  existingCategoryNames: string[];
  incomeSourceExists: boolean;
}

/**
 * U15 (TASK-front.md), rediseñado el 2026-08-16 para ser resumible — ver PROGRESS.md
 * "cambio a U15 posterior a su construcción" para el porqué completo. En orden, al
 * confirmar (API-CONTRACT.md §16.1, recortado donde SCREENS-front.md dice que se
 * recorta), cada paso se salta si `EmpezarPage` (Server Component) ya lo encontró
 * hecho: crear la cuenta (si no hay una `cash` ya) → saldo inicial (si el ledger de esa
 * cuenta sigue vacío, una sola llamada con Idempotency-Key) → los sobres marcados que
 * todavía no existen → la fuente de ingreso, si se marcó y no existe. No crea la
 * primer periodo ni asigna presupuesto.
 */
export function OnboardingForm({
  existingAccount,
  balanceAlreadyCaptured,
  existingCategoryNames,
  incomeSourceExists,
}: OnboardingFormProps) {
  const router = useRouter();
  const timezone = useTimezone();

  const [balanceCents, setBalanceCents] = useState('0');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    () => new Set(SUGGESTED_CATEGORIES.map((c) => c.name)),
  );
  const [incomeSourceSelected, setIncomeSourceSelected] = useState(!incomeSourceExists);
  const [accountName, setAccountName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const existingCategoryNameSet = new Set(existingCategoryNames);
  const needsAccount = existingAccount === null;
  const needsBalance = !balanceAlreadyCaptured;

  function toggleCategory(name: string) {
    if (existingCategoryNameSet.has(name)) return; // ya existe, no se puede "quitar" desde aquí
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // La cuenta se empareja por existencia, nunca por nombre: el nombre lo escribe
      // el usuario y puede variar entre intentos. Si ya hay una cuenta cash, es esa —
      // el campo de nombre en pantalla ni siquiera es editable en ese caso.
      const account: Account =
        existingAccount ??
        (await bffFetch<Account>({
          method: 'POST',
          path: '/accounts',
          body: { name: accountName, kind: 'cash' },
        }));

      if (needsBalance && balanceCents !== '0') {
        await bffFetch<TransactionMutationResult>({
          method: 'POST',
          path: BFF_DEDICATED_ROUTES.openingBalances,
          body: {
            bookedAt: todayInTimeZone(timezone),
            description: 'Saldos iniciales',
            balances: [{ accountId: account.id, balanceCents }],
          },
          idempotencyKey: crypto.randomUUID(),
        });
      }

      for (const category of SUGGESTED_CATEGORIES) {
        if (existingCategoryNameSet.has(category.name)) continue; // ya existe
        if (!selectedCategories.has(category.name)) continue;
        await bffFetch<Category>({
          method: 'POST',
          path: '/categories',
          body: { name: category.name, rolloverType: category.rolloverType },
        });
      }

      if (incomeSourceSelected && !incomeSourceExists) {
        await bffFetch<IncomeSource>({
          method: 'POST',
          path: '/income-sources',
          body: { name: SUGGESTED_INCOME_SOURCE },
        });
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('No se pudo completar la configuración inicial. Intenta de nuevo.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-6 p-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Vamos a empezar</h1>
        <p className="text-sm text-muted">
          Una cuenta, algunos sobres y de dónde viene tu dinero. Puedes agregar más después.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Field label="Nombre de tu cuenta" hint={needsAccount ? undefined : 'Ya la tienes configurada'}>
          {needsAccount ? (
            <Input
              required
              placeholder="Nu, BBVA, Efectivo…"
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
            />
          ) : (
            <Input value={existingAccount.name} disabled />
          )}
        </Field>

        {needsBalance ? (
          <Field label="Saldo de hoy">
            <AmountInput value={balanceCents} onChange={setBalanceCents} />
          </Field>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">{es.kind.category}s sugeridos</p>
        {SUGGESTED_CATEGORIES.map((category) => {
          const alreadyExists = existingCategoryNameSet.has(category.name);
          return (
            <Checkbox
              key={category.name}
              label={alreadyExists ? `${category.name} (ya existe)` : category.name}
              checked={alreadyExists || selectedCategories.has(category.name)}
              disabled={alreadyExists}
              onChange={() => toggleCategory(category.name)}
            />
          );
        })}
      </div>

      <div>
        <Checkbox
          label={incomeSourceExists ? `${SUGGESTED_INCOME_SOURCE} (ya existe)` : SUGGESTED_INCOME_SOURCE}
          checked={incomeSourceExists || incomeSourceSelected}
          disabled={incomeSourceExists}
          onChange={(event) => setIncomeSourceSelected(event.target.checked)}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" loading={loading} disabled={needsAccount && accountName.trim() === ''}>
        Empezar
      </Button>
    </form>
  );
}
