'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AmountInput } from '@/components/money/AmountInput';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useDraft } from '@/features/capture/hooks/useDraft';
import { showToast } from '@/features/capture/stores/toastStore';
import { useCategories } from '@/features/envelopes/hooks/useCategories';
import { usePeriods } from '@/features/periods/hooks/usePeriods';
import { BudgetImpactMessage } from '@/features/transactions/components/BudgetImpactMessage';
import { useCreateTransaction } from '@/features/transactions/hooks/useCreateTransaction';
import { ApiError } from '@/lib/api/errors';
import { isDateInClosedPeriod, todayInTimeZone } from '@/lib/domain/dates';
import { formatMoney, splitEvenly } from '@/lib/domain/money';
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

const LAST_USED_STORAGE_KEY = 'last_used_expense_context';

export function ExpenseForm() {
  const router = useRouter();
  const timezone = useTimezone();
  const today = todayInTimeZone(timezone);

  const { draft, update, clear } = useDraft<ExpenseDraftValues>('expense', makeInitialValues(today));
  const [values, setValues] = useState<ExpenseDraftValues>(() => makeInitialValues(today));
  const [hydrated, setHydrated] = useState(false);

  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories(null);
  const { data: periods } = usePeriods();

  const createExpense = useCreateTransaction('expenses');
  const [result, setResult] = useState<TransactionMutationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filtrado estricto: solo cuentas liquidas reales pueden pagar (cash y credit), ordenadas alfabéticamente
  const paymentAccounts = useMemo(
    () =>
      [...(accounts?.data.filter((a) => a.kind === 'cash' || a.kind === 'credit') ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name, 'es'),
      ),
    [accounts?.data],
  );
  const receivableAccounts = useMemo(
    () =>
      [...(accounts?.data.filter((a) => a.kind === 'receivable') ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name, 'es'),
      ),
    [accounts?.data],
  );
  const sortedCategories = useMemo(
    () => [...(categories?.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [categories?.data],
  );

  const chipsCategories = useMemo(() => {
    const list = [...(categories?.data ?? [])];
    const lastUsedId = values.lines[0]?.categoryId;
    return list.sort((a, b) => {
      if (lastUsedId && a.id === lastUsedId) return -1;
      if (lastUsedId && b.id === lastUsedId) return 1;
      return a.name.localeCompare(b.name, 'es');
    });
  }, [categories?.data, values.lines]);

  const chipsPaymentAccounts = useMemo(() => {
    const list = [...paymentAccounts];
    const lastUsedId = values.paidFromAccountId;
    return list.sort((a, b) => {
      if (lastUsedId && a.id === lastUsedId) return -1;
      if (lastUsedId && b.id === lastUsedId) return 1;
      return a.name.localeCompare(b.name, 'es');
    });
  }, [paymentAccounts, values.paidFromAccountId]);

  // Rehidrata desde borrador la primera vez
  useEffect(() => {
    if (draft && !hydrated) {
      setValues(draft.values);
      setHydrated(true);
    }
  }, [draft, hydrated]);

  // Preselección inteligente: recuerda el último sobre y cuenta en localStorage si existen,
  // o arranca en blanco cuando no hay nada guardado (exige selección consciente del usuario).
  useEffect(() => {
    if (hydrated) {
      let savedContext: { categoryId?: string; paidFromAccountId?: string } | null = null;
      try {
        const raw = window.localStorage.getItem(LAST_USED_STORAGE_KEY);
        if (raw) savedContext = JSON.parse(raw);
      } catch {}

      let changed = false;
      let nextPaidFrom = values.paidFromAccountId;
      const nextLines = [...values.lines];

      // Preseleccionar cuenta solo si no hay fijada en borrador y existe memoria válida
      if (!nextPaidFrom && savedContext?.paidFromAccountId) {
        const accountExists = paymentAccounts.some((a) => a.id === savedContext?.paidFromAccountId);
        if (accountExists) {
          nextPaidFrom = savedContext.paidFromAccountId;
          changed = true;
        }
      }

      // Preseleccionar sobre solo si no hay fijado en borrador y existe memoria válida
      if ((!nextLines[0] || !nextLines[0].categoryId) && savedContext?.categoryId) {
        const categoryExists = categories?.data?.some((c) => c.id === savedContext?.categoryId);
        if (categoryExists) {
          nextLines[0] = {
            categoryId: savedContext.categoryId,
            amountCents: nextLines[0]?.amountCents ?? values.amountCents,
          };
          changed = true;
        }
      }

      if (changed) {
        const next = { ...values, paidFromAccountId: nextPaidFrom, lines: nextLines };
        setValues(next);
        update(next);
      }
    }
  }, [hydrated, paymentAccounts, categories, values, update]);

  function setField<K extends keyof ExpenseDraftValues>(key: K, value: ExpenseDraftValues[K]) {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      update(next);
      return next;
    });
  }

  function handleTotalAmountChange(cents: string) {
    setValues((prev) => {
      let nextLines = prev.lines;
      if (prev.splitEnabled) {
        const count = Math.max(2, prev.lines.length);
        const amounts = splitEvenly(cents, count);
        nextLines = amounts.map((amountCents, i) => ({
          categoryId: prev.lines[i]?.categoryId ?? '',
          amountCents,
        }));
      } else {
        nextLines = [{ categoryId: prev.lines[0]?.categoryId ?? '', amountCents: cents }];
      }
      const next = { ...prev, amountCents: cents, lines: nextLines };
      update(next);
      return next;
    });
  }

  function toggleSplit(enabled: boolean) {
    const lines = enabled
      ? splitEvenly(values.amountCents, 2).map((amountCents, i) => ({
          categoryId: values.lines[i]?.categoryId ?? categories?.data[i]?.id ?? '',
          amountCents,
        }))
      : [{ categoryId: values.lines[0]?.categoryId ?? categories?.data[0]?.id ?? '', amountCents: values.amountCents }];
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

  // Validación cliente de suma exacta de split y préstamos (evita 422 SPLIT_TOTAL_MISMATCH)
  const totalCentsBig = BigInt(values.amountCents || '0');
  const linesSumBig = values.lines.reduce((sum, line) => sum + BigInt(line.amountCents || '0'), 0n);
  const lentSumBig = values.lentToEnabled ? BigInt(values.lentToAmountCents || '0') : 0n;
  const isSplitMismatch = values.splitEnabled && linesSumBig + lentSumBig !== totalCentsBig;
  const isAmountZero = totalCentsBig <= 0n;

  const splitCount = BigInt(values.lines.length || 1);
  const hasRemainder = values.splitEnabled && splitCount > 1n && totalCentsBig % splitCount !== 0n;
  const firstEnvelopeName = categories?.data?.find((c) => c.id === values.lines[0]?.categoryId)?.name;

  const closedPeriodWarning =
    periods && isDateInClosedPeriod(values.bookedAt, periods.data) ? (
      <div className="rounded-lg border border-state-depleted/40 bg-state-depleted/10 p-3 text-xs leading-relaxed text-state-depleted">
        {es.expenseCapture.closedPeriodWarning}
      </div>
    ) : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !draft ||
      isSplitMismatch ||
      isAmountZero ||
      !values.paidFromAccountId ||
      (!values.splitEnabled && !values.lines[0]?.categoryId)
    ) {
      return;
    }
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
          try {
            const primaryCategoryId = values.lines[0]?.categoryId;
            if (primaryCategoryId && values.paidFromAccountId) {
              window.localStorage.setItem(
                LAST_USED_STORAGE_KEY,
                JSON.stringify({
                  categoryId: primaryCategoryId,
                  paidFromAccountId: values.paidFromAccountId,
                }),
              );
            }
          } catch {}

          clear();
          const impact = transaction.budgetImpact.status;
          if (impact === 'in_open_period') {
            const catName = categories?.data.find((c) => c.id === values.lines[0]?.categoryId)?.name;
            const formatted = formatMoney(values.amountCents);
            const msg = catName
              ? `${formatted}${es.expenseCapture.inEnvelope}${catName}`
              : formatted;
            showToast(msg);
            router.push('/');
          } else {
            setResult(transaction);
          }
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

  // Pantalla de confirmación con explicación de impacto presupuestal (para compensated, uncompensated, no_period)
  if (result) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-5 p-4 min-h-screen justify-center">
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted-background/40 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground">{es.intent.expense} registrado</h1>
              <p className="text-xs text-muted">
                {formatMoney(values.amountCents)}
              </p>
            </div>
          </div>
          <BudgetImpactMessage budgetImpact={result.budgetImpact} />
          <Button type="button" onClick={() => router.push('/')} className="w-full">
            Listo
          </Button>
        </div>
      </div>
    );
  }

  // Estado vacío: Cero sobres creados en el sistema (SCREENS-front.md §2)
  if (categories && categories.total === 0) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 p-6 min-h-96 py-20 justify-center items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted-background text-muted">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-foreground">{es.expenseCapture.noEnvelopesTitle}</h1>
          <p className="text-sm text-muted max-w-xs">{es.expenseCapture.noEnvelopesDescription}</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href="/sobres"
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:scale-95"
          >
            {es.expenseCapture.createEnvelope}
          </Link>
          <Link
            href="/empezar"
            className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-background py-2 text-sm font-medium text-foreground hover:bg-muted-background"
          >
            {es.expenseCapture.useSuggestedEnvelopes}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-lg flex-col gap-5 p-4 min-w-0 pb-12">
      {/* Encabezado modal con salida rápida */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <h1 className="text-xl font-bold tracking-tight text-foreground">{es.expenseCapture.title}</h1>
        <Link
          href="/"
          className="text-xs font-medium text-muted hover:text-foreground transition-colors py-1 px-2 rounded-md hover:bg-muted-background"
        >
          {es.expenseCapture.cancel}
        </Link>
      </div>

      {/* Hero Input de Monto: limpio, sin tarjeta ni recuadro, símbolo y cifra agrupados en un solo bloque centrado */}
      <div className="flex flex-col items-center justify-center py-4">
        <label htmlFor="hero-amount-input" className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
          {es.expenseCapture.amount}
        </label>
        <div className="inline-flex items-baseline justify-center">
          <span className="text-3xl font-bold text-muted select-none mr-1">$</span>
          <AmountInput
            bare
            autoWidth
            id="hero-amount-input"
            value={values.amountCents}
            onChange={handleTotalAmountChange}
            className="text-left text-5xl font-bold tracking-tight text-foreground bg-transparent p-0 focus:outline-none"
            placeholder={es.expenseCapture.amountPlaceholder}
            autoFocus
            required
          />
        </div>
      </div>

      {/* Camino corto: sobre y cuenta de pago con pastillas táctiles */}
      <div className="flex flex-col gap-4">
        {!values.splitEnabled ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              {es.expenseCapture.envelope}
            </span>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {chipsCategories.map((category) => {
                const isSelected = values.lines[0]?.categoryId === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      setField('lines', [{ categoryId: category.id, amountCents: values.amountCents }])
                    }
                    className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm ring-2 ring-primary ring-offset-1'
                        : 'border border-border/80 bg-background text-foreground hover:bg-muted-background/40 hover:border-border'
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              className="sr-only"
              tabIndex={-1}
              required
              value={values.lines[0]?.categoryId ?? ''}
              onChange={() => {}}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            {es.expenseCapture.paidFromAccount}
          </span>
          <div className="flex flex-wrap gap-2 pt-0.5">
            {chipsPaymentAccounts.map((account) => {
              const isSelected = values.paidFromAccountId === account.id;
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => setField('paidFromAccountId', account.id)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm ring-2 ring-primary ring-offset-1'
                      : 'border border-border/80 bg-background text-foreground hover:bg-muted-background/40 hover:border-border'
                  }`}
                >
                  {account.name}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            className="sr-only"
            tabIndex={-1}
            required
            value={values.paidFromAccountId}
            onChange={() => {}}
          />
        </div>

        <Field label={es.expenseCapture.date}>
          <Input
            type="date"
            value={values.bookedAt}
            onChange={(event) => setField('bookedAt', event.target.value)}
            className="rounded-lg py-2 text-sm"
            required
          />
        </Field>
        {closedPeriodWarning}

        <Field label={es.expenseCapture.description}>
          <Input
            value={values.description}
            onChange={(event) => setField('description', event.target.value)}
            placeholder={es.expenseCapture.description}
            className="rounded-lg py-2 text-sm"
          />
        </Field>
      </div>

      {/* Opciones avanzadas: Reparto y Préstamo */}
      <div className="flex flex-col gap-3 pt-2 border-t border-border/40">
        <Checkbox
          label={es.expenseCapture.splitLabel}
          checked={values.splitEnabled}
          onChange={(event) => toggleSplit(event.target.checked)}
        />

        {values.splitEnabled ? (
          <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted-background/30 p-3.5">
            {hasRemainder && firstEnvelopeName ? (
              <p className="text-xs text-muted leading-relaxed">
                {es.expenseCapture.residualCentNotice(firstEnvelopeName)}
              </p>
            ) : null}
            {values.lines.map((line, index) => (
              <div key={index} className="flex items-center gap-2">
                <select
                  className="flex-1 rounded-lg border border-border bg-background px-2.5 py-2 text-xs text-foreground shadow-sm"
                  value={line.categoryId}
                  onChange={(event) => {
                    const lines = [...values.lines];
                    lines[index] = { ...line, categoryId: event.target.value };
                    setField('lines', lines);
                  }}
                  required
                >
                  <option value="" disabled>
                    {es.expenseCapture.envelope}
                  </option>
                  {sortedCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <div className="relative flex items-center max-w-32">
                  <span className="absolute left-2.5 text-xs text-muted select-none">$</span>
                  <AmountInput
                    value={line.amountCents}
                    onChange={(cents) => {
                      const lines = [...values.lines];
                      lines[index] = { ...line, amountCents: cents };
                      setField('lines', lines);
                    }}
                    className="w-full text-right text-xs py-2 pl-6 pr-2 rounded-lg"
                    required
                  />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1">
              <Button type="button" variant="secondary" size="sm" onClick={addSplitLine}>
                {es.expenseCapture.addSplitEnvelope}
              </Button>
              {isSplitMismatch ? (
                <span className="text-xs font-semibold text-danger">
                  Diferencia: {formatMoney((totalCentsBig - (linesSumBig + lentSumBig)).toString())}
                </span>
              ) : null}
            </div>
            {isSplitMismatch ? (
              <p className="text-xs text-danger font-medium">
                {es.expenseCapture.splitMismatch}
              </p>
            ) : null}
          </div>
        ) : null}

        <Checkbox
          label={es.expenseCapture.lentToLabel}
          checked={values.lentToEnabled}
          onChange={(event) => setField('lentToEnabled', event.target.checked)}
        />

        {values.lentToEnabled ? (
          <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted-background/30 p-3.5">
            <Field label={es.expenseCapture.lentToAccount}>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm"
                value={values.lentToAccountId}
                onChange={(event) => setField('lentToAccountId', event.target.value)}
                required={values.lentToEnabled}
              >
                <option value="">{es.expenseCapture.chooseAccount}</option>
                {receivableAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={es.expenseCapture.lentToAmount}>
              <AmountInput
                value={values.lentToAmountCents}
                onChange={(cents) => setField('lentToAmountCents', cents)}
                className="rounded-lg text-sm py-2"
                required={values.lentToEnabled}
              />
            </Field>
          </div>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          Ocurrió un problema. Intenta de nuevo.
        </p>
      ) : null}

      <Button
        type="submit"
        size="md"
        loading={createExpense.isPending}
        disabled={
          !hydrated ||
          isSplitMismatch ||
          isAmountZero ||
          !values.paidFromAccountId ||
          (!values.splitEnabled && !values.lines[0]?.categoryId)
        }
        className="w-full mt-2 font-semibold shadow-md"
      >
        {es.expenseCapture.saveExpense}
      </Button>
    </form>
  );
}
